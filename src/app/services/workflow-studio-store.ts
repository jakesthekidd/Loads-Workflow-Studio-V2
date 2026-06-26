import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Action,
  ActionConfig,
  ACTION_TYPE_CATALOG,
  ActionType,
  ActionTypeCatalogEntry,
  BlockingCondition,
  ConditionGroup,
  NodeKind,
  OrderEnforcement,
  RequirementLevel,
  Segment,
  Step,
  StepTemplate,
  toSegmentGraph,
  Workflow,
  WorkflowGraph,
  WorkflowSummary,
} from '@app/models';
import { ActionCatalogApi, StepTemplateApi, WorkflowApi } from '@app/mock-api';

const EMPTY_GRAPH: WorkflowGraph = { nodes: [], connections: [] };

// ---- Step/action creation helpers ----------------------------------------

function defaultConfigFor(type: ActionType): ActionConfig {
  switch (type) {
    case ActionType.TriggerGeofence:
      return { actionType: type, latitude: 0, longitude: 0, radiusMeters: 100 };
    case ActionType.SingleSelectDropdown:
    case ActionType.MultiSelectDropdown:
      return { actionType: type, optionsSource: { kind: 'static', options: [] } };
    case ActionType.Slider:
      return { actionType: type, min: 0, max: 100 };
    default:
      return { actionType: type } as ActionConfig;
  }
}

function blankStep(id: string, segmentId: string, sortIndex: number): Step {
  return {
    id, segmentId, label: 'New Step', sortIndex,
    requirement: RequirementLevel.Required,
    orderEnforcement: OrderEnforcement.Enforced,
    actions: [],
  };
}

function instantiateTemplate(tpl: StepTemplate, stepId: string, segmentId: string, sortIndex: number): Step {
  return {
    ...tpl.blueprint, id: stepId, segmentId, sortIndex,
    actions: tpl.blueprint.actions.map((a, i) => ({
      ...a, id: crypto.randomUUID(), stepId, sortIndex: i,
    })),
  };
}

/** Where a node lives in the hierarchy — for resolving the active segment. */
interface NodeLocation {
  readonly kind: NodeKind;
  readonly segmentId: string;
  readonly stepId?: string;
}

/**
 * Central signal store for the studio. Owns the loaded workflow, the catalogs,
 * and a single shared **selection** (`selectedId` — a segment, step, or action).
 * The canvas scopes to the selected node's segment, and the tree + canvas both
 * render highlight from the same selection (fully bidirectional).
 *
 * Reads + selection only in this phase — mutations come later.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowStudioStore {
  private readonly workflowApi = inject(WorkflowApi);
  private readonly catalogApi = inject(ActionCatalogApi);
  private readonly templateApi = inject(StepTemplateApi);

  // ---- raw state ----------------------------------------------------------
  readonly workflow = signal<Workflow | null>(null);
  readonly summaries = signal<readonly WorkflowSummary[]>([]);
  readonly actionCatalog = signal<readonly ActionTypeCatalogEntry[]>([]);
  readonly stepTemplates = signal<readonly StepTemplate[]>([]);
  readonly loading = signal(false);

  // ---- UI state -----------------------------------------------------------
  /** The single shared selection — id of a segment, step, or action. */
  readonly selectedId = signal<string | null>(null);
  /** Ids expanded in the Workflow Items tree. */
  readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  /** Whether the Workflow Items panel is the open (docked tree) state. */
  readonly panelOpen = signal(true);
  /** Id of the node whose properties panel is currently open (null = closed). */
  readonly propertiesPanelId = signal<string | null>(null);
  /** Scroll target requested when opening the panel — cleared after the scroll fires. */
  readonly propertiesPanelScrollTarget = signal<'conditions' | null>(null);
  /** Insertion index in the current segment where the step picker is open (null = closed). */
  readonly pickerIndex = signal<number | null>(null);
  /** Whether the action library panel is open. */
  readonly actionLibraryOpen = signal(false);
  /** The step id that opened the action library (null = opened from toolbar, drag-only). */
  readonly actionLibraryTargetStepId = signal<string | null>(null);
  /** Whether the step template library panel is open. */
  readonly stepLibraryOpen = signal(false);
  /** Whether the mobile workflow preview modal is open. */
  readonly previewOpen = signal(false);
  /** CSS class applied to the content wrapper to trigger directional slide animation. */
  readonly panelNavAnimClass = signal<string>('');
  /** True while the panel close animation is playing (before DOM removal). */
  readonly panelClosing = signal(false);

  // ---- derived ------------------------------------------------------------
  readonly segments = computed<readonly Segment[]>(() => this.workflow()?.segments ?? []);

  /** id → location, for resolving the active segment from any selected node. */
  private readonly index = computed(() => {
    const map = new Map<string, NodeLocation>();
    for (const seg of this.segments()) {
      map.set(seg.id, { kind: NodeKind.Segment, segmentId: seg.id });
      for (const step of seg.steps) {
        map.set(step.id, { kind: NodeKind.Step, segmentId: seg.id, stepId: step.id });
        for (const action of step.actions) {
          map.set(action.id, { kind: NodeKind.Action, segmentId: seg.id, stepId: step.id });
        }
      }
    }
    return map;
  });

  /** The segment the canvas is scoped to — the selected node's segment (or the first). */
  readonly activeSegmentId = computed<string | null>(() => {
    const id = this.selectedId();
    const loc = id ? this.index().get(id) : undefined;
    return loc?.segmentId ?? this.segments()[0]?.id ?? null;
  });
  readonly currentSegment = computed<Segment | null>(
    () => this.segments().find((s) => s.id === this.activeSegmentId()) ?? null,
  );
  /** Canvas projection for the active segment (steps + their actions). */
  readonly segmentGraph = computed<WorkflowGraph>(() => {
    const seg = this.currentSegment();
    return seg ? toSegmentGraph(seg) : EMPTY_GRAPH;
  });

  /** Ancestor breadcrumb trail for the current properties panel node. */
  readonly panelBreadcrumbs = computed<ReadonlyArray<{ label: string; id: string; kind: NodeKind }>>(() => {
    const id = this.propertiesPanelId();
    if (!id) return [];
    const loc = this.index().get(id);
    if (!loc) return [];
    const seg = this.segments().find((s) => s.id === loc.segmentId);
    if (!seg) return [];
    if (loc.kind === NodeKind.Step) {
      return [{ label: seg.label, id: seg.id, kind: NodeKind.Segment }];
    }
    if (loc.kind === NodeKind.Action) {
      const step = seg.steps.find((s) => s.id === loc.stepId);
      return step
        ? [
            { label: seg.label, id: seg.id, kind: NodeKind.Segment },
            { label: step.label, id: step.id, kind: NodeKind.Step },
          ]
        : [{ label: seg.label, id: seg.id, kind: NodeKind.Segment }];
    }
    return [];
  });

  /** Kind of the node open in the properties panel — drives accent color. */
  readonly panelItemKind = computed<NodeKind | null>(() => {
    const id = this.propertiesPanelId();
    if (!id) return null;
    return this.index().get(id)?.kind ?? null;
  });

  /** Workflow tree projected for the DataSourceSelectorComponent (Segment > Step > Action). */
  readonly dssWorkflowData = computed(() => ({
    segments: this.segments().map(seg => ({
      id: seg.id,
      label: seg.label,
      steps: seg.steps.map(step => ({
        id: step.id,
        label: step.label,
        actions: step.actions.map(action => ({
          id: action.id,
          label: action.label,
          actionType: action.config.actionType,
        })),
      })),
    })),
  }));

  // ---- actions ------------------------------------------------------------

  /** Initial load: summaries + catalogs, then the default (or given) workflow. */
  load(workflowId?: string): void {
    this.loading.set(true);
    this.catalogApi.getCatalog().subscribe((c) => this.actionCatalog.set(c));
    this.templateApi.listStepTemplates().subscribe((t) => this.stepTemplates.set(t));
    this.workflowApi.listWorkflows().subscribe((summaries) => {
      this.summaries.set(summaries);
      const id = workflowId ?? summaries.find((s) => s.isDefault)?.id ?? summaries[0]?.id;
      if (id) this.loadWorkflow(id);
      else this.loading.set(false);
    });
  }

  /** Switch to a different workflow by id. */
  selectWorkflow(id: string): void {
    this.loadWorkflow(id);
  }

  /** Select any node (segment/step/action). Scopes the canvas and reveals it in the tree. */
  select(id: string): void {
    this.selectedId.set(id);
    const loc = this.index().get(id);
    if (!loc) return;
    const next = new Set(this.expandedIds());
    next.add(loc.segmentId);
    if (loc.stepId) next.add(loc.stepId);
    this.expandedIds.set(next);
  }

  isSelected(id: string): boolean {
    return this.selectedId() === id;
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: string): void {
    const next = new Set(this.expandedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedIds.set(next);
  }

  readonly allExpanded = computed<boolean>(() => {
    const ids = this.expandedIds();
    return this.segments().every(
      seg => ids.has(seg.id) && seg.steps.every(step => ids.has(step.id)),
    );
  });

  expandAll(): void {
    const ids = new Set<string>();
    for (const seg of this.segments()) {
      ids.add(seg.id);
      for (const step of seg.steps) ids.add(step.id);
    }
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  /** Move a step within a segment from `from` index to `to` index. */
  reorderStep(segmentId: string, from: number, to: number): void {
    if (from === to) return;
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const steps = [...seg.steps];
        const [moved] = steps.splice(from, 1);
        steps.splice(to, 0, moved);
        return { ...seg, steps };
      }),
    });
  }

  /** Move an action within a step from `from` index to `to` index. */
  reorderAction(stepId: string, from: number, to: number): void {
    if (from === to) return;
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) => {
          if (step.id !== stepId) return step;
          const actions = [...step.actions];
          const [moved] = actions.splice(from, 1);
          actions.splice(to, 0, moved);
          return { ...step, actions };
        }),
      })),
    });
  }

  /** Open the properties panel and auto-scroll to the Conditions section. */
  openConditions(id: string): void {
    this.openProperties(id);
    this.propertiesPanelScrollTarget.set('conditions');
  }

  /** Open the properties panel for the given node id and also select it. */
  openProperties(id: string): void {
    // Cancel any pending close animation so re-opening the same panel doesn't
    // get silently killed by the close timeout.
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
      this._closeTimeout = null;
      this.panelClosing.set(false);
    }

    const currentId = this.propertiesPanelId();
    if (currentId && currentId !== id) {
      const diff = this.nodeDepth(id) - this.nodeDepth(currentId);
      if (diff !== 0) {
        this._navSeq++;
        const suffix = this._navSeq % 2 === 0 ? 'b' : 'a';
        this.panelNavAnimClass.set(diff > 0 ? `nav-fwd-${suffix}` : `nav-bwd-${suffix}`);
      } else {
        this.panelNavAnimClass.set('');
      }
    } else {
      this.panelNavAnimClass.set('');
    }
    this.propertiesPanelId.set(id);
    this.select(id);
  }

  /** Close the properties panel — plays the slide-out animation then removes from DOM. */
  closeProperties(): void {
    if (this._closeTimeout) clearTimeout(this._closeTimeout);
    this.panelClosing.set(true);
    this._closeTimeout = setTimeout(() => {
      this.propertiesPanelId.set(null);
      this.panelNavAnimClass.set('');
      this.panelClosing.set(false);
      this.propertiesPanelScrollTarget.set(null);
      this._closeTimeout = null;
    }, 200);
  }

  /**
   * Resolve what a given id points to in the hierarchy.
   * Returns the kind, and the matching step/action objects if found.
   */
  resolveItem(id: string): { kind: NodeKind; step?: Step; action?: Action } | null {
    const loc = this.index().get(id);
    if (!loc) return null;
    const seg = this.segments().find((s) => s.id === loc.segmentId);
    if (!seg) return null;
    if (loc.kind === NodeKind.Segment) return { kind: NodeKind.Segment };
    const step = seg.steps.find((s) => s.id === (loc.stepId ?? id));
    if (!step) return null;
    if (loc.kind === NodeKind.Step) return { kind: NodeKind.Step, step };
    const action = step.actions.find((a) => a.id === id);
    return action ? { kind: NodeKind.Action, step, action } : null;
  }

  /** Replace an action's config with a new config object (immutable update). */
  updateActionConfig(actionId: string, config: ActionConfig): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) => ({
          ...step,
          actions: step.actions.map((a) =>
            a.id === actionId ? { ...a, config } : a,
          ),
        })),
      })),
    });
  }

  /** Patch mutable fields on a Step (immutable update). */
  updateStep(
    stepId: string,
    patch: Partial<Pick<Step, 'requirement' | 'orderEnforcement' | 'prompt' | 'statusMessage' | 'condition' | 'blocker'>>,
  ): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) =>
          step.id === stepId ? { ...step, ...patch } : step,
        ),
      })),
    });
  }

  updateSegmentLabel(segmentId: string, label: string): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) =>
        seg.id === segmentId ? { ...seg, label } : seg,
      ),
    });
  }

  updateStepLabel(stepId: string, label: string): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) =>
          step.id === stepId ? { ...step, label } : step,
        ),
      })),
    });
  }

  updateActionLabel(actionId: string, label: string): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) => ({
          ...step,
          actions: step.actions.map((a) =>
            a.id === actionId ? { ...a, label } : a,
          ),
        })),
      })),
    });
  }

  setPanelOpen(open: boolean): void {
    this.panelOpen.set(open);
  }

  togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  // ---- step picker --------------------------------------------------------

  openStepPicker(insertIndex: number): void {
    this.pickerIndex.set(insertIndex);
    this.propertiesPanelId.set(null);
  }

  closeStepPicker(): void {
    this.pickerIndex.set(null);
  }

  addStep(segmentId: string, insertIndex: number, template?: StepTemplate): void {
    const wf = this.workflow();
    if (!wf) return;
    const stepId = crypto.randomUUID();
    const newStep = template
      ? instantiateTemplate(template, stepId, segmentId, insertIndex)
      : blankStep(stepId, segmentId, insertIndex);
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => {
        if (seg.id !== segmentId) return seg;
        const steps = [...seg.steps];
        steps.splice(insertIndex, 0, newStep);
        return { ...seg, steps: steps.map((s, i) => ({ ...s, sortIndex: i })) };
      }),
    });
    this.pickerIndex.set(null);
    const expanded = new Set(this.expandedIds());
    expanded.add(stepId);
    this.expandedIds.set(expanded);
    this.openProperties(stepId);
  }

  // ---- step library -------------------------------------------------------

  openPreview(): void  { this.previewOpen.set(true); }
  closePreview(): void { this.previewOpen.set(false); }

  openStepLibrary(): void {
    this.actionLibraryOpen.set(false);
    this.actionLibraryTargetStepId.set(null);
    this.stepLibraryOpen.set(true);
  }
  closeStepLibrary(): void { this.stepLibraryOpen.set(false); }

  // ---- action library -----------------------------------------------------

  openActionLibrary(stepId: string | null): void {
    this.stepLibraryOpen.set(false);
    this.actionLibraryTargetStepId.set(stepId);
    this.actionLibraryOpen.set(true);
  }

  closeActionLibrary(): void {
    this.actionLibraryOpen.set(false);
    this.actionLibraryTargetStepId.set(null);
  }

  addAction(stepId: string, type: ActionType): void {
    const wf = this.workflow();
    if (!wf) return;
    const actionId = crypto.randomUUID();
    this.workflow.set({
      ...wf,
      segments: wf.segments.map((seg) => ({
        ...seg,
        steps: seg.steps.map((step) => {
          if (step.id !== stepId) return step;
          const newAction: Action = {
            id: actionId,
            stepId,
            sortIndex: step.actions.length,
            label: ACTION_TYPE_CATALOG[type].label,
            config: defaultConfigFor(type),
          };
          return { ...step, actions: [...step.actions, newAction] };
        }),
      })),
    });
    this.closeActionLibrary();
    const expanded = new Set(this.expandedIds());
    expanded.add(stepId);
    this.expandedIds.set(expanded);
    this.openProperties(actionId);
  }

  // ---- internal -----------------------------------------------------------

  private _navSeq = 0;
  private _closeTimeout: ReturnType<typeof setTimeout> | null = null;

  private nodeDepth(id: string): number {
    const kind = this.index().get(id)?.kind;
    if (kind === NodeKind.Segment) return 0;
    if (kind === NodeKind.Step) return 1;
    if (kind === NodeKind.Action) return 2;
    return 0;
  }

  private loadWorkflow(id: string): void {
    this.loading.set(true);
    this.workflowApi.getWorkflow(id).subscribe((w) => {
      this.workflow.set(w);
      const firstSeg = w.segments[0] ?? null;
      const firstStep = firstSeg?.steps[0] ?? null;
      // Default selection: first step (so the canvas shows a scoped segment + a
      // selected step). Falls back to the segment, then nothing.
      this.selectedId.set(firstStep?.id ?? firstSeg?.id ?? null);
      // Seed the first segment + all its steps as expanded so step cards start open.
      const seed = new Set<string>(firstSeg ? [firstSeg.id] : []);
      for (const step of firstSeg?.steps ?? []) seed.add(step.id);
      this.expandedIds.set(seed);
      this.loading.set(false);
    });
  }
}
