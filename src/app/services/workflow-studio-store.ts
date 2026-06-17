import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Action,
  ActionConfig,
  ActionTypeCatalogEntry,
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

  /** Open the properties panel for the given node id and also select it. */
  openProperties(id: string): void {
    this.propertiesPanelId.set(id);
    this.select(id);
  }

  /** Close the properties panel without mutating the workflow. */
  closeProperties(): void {
    this.propertiesPanelId.set(null);
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
    patch: Partial<Pick<Step, 'requirement' | 'orderEnforcement' | 'prompt' | 'statusMessage'>>,
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

  setPanelOpen(open: boolean): void {
    this.panelOpen.set(open);
  }

  togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  // ---- internal -----------------------------------------------------------

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
