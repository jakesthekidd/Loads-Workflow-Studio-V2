import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FFlowModule } from '@foblex/flow';
import { Step } from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { ActionPropertiesComponent } from '../properties/action-properties/action-properties.component';
import { StepPropertiesComponent } from '../properties/step-properties/step-properties.component';
import { CanvasToolbar } from './canvas-toolbar';
import { StepCard } from './nodes/step-card';
import { WorkflowItemsPanel } from './workflow-items-panel';

/** Layout item: a step card, a connector, or an empty-state hint, with a position. */
interface LayoutItem {
  readonly kind: 'card' | 'connector' | 'empty';
  readonly id: string;
  readonly position: { x: number; y: number };
  readonly step?: Step;
  readonly index?: number;
  readonly totalSteps?: number;
}

const CARD_X = 80;
const CARD_W = 460;
const START_Y = 40;
const CONNECTOR_W = 28;
const CONNECTOR_GAP = 52;
const CARD_H_COLLAPSED = 64; // 12px pad-top + 40px header + 12px pad-bottom
/** Must track the rendered step-card height: padding+header+rows+addAction (≈118 + 52·actions). */
const stepHeight = (s: Step, expanded: boolean) =>
  expanded ? 118 + 52 * s.actions.length : CARD_H_COLLAPSED;

/**
 * The studio work area: a @foblex/flow canvas (dotted grid + pan/zoom) with the
 * floating Workflow Items panel (top-left) and canvas toolbar (top-right)
 * overlaid on top.
 *
 * SKELETON: the canvas is **empty** (matches the initial-state Figma frame). No
 * data/state yet.
 * // TODO (Phase 3): render segment-scoped Step container nodes + Action child
 *    nodes via toSegmentGraph(); connections; selection; drag/drop.
 */
@Component({
  selector: 'ws-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FFlowModule, WorkflowItemsPanel, CanvasToolbar, StepCard, ActionPropertiesComponent, StepPropertiesComponent],
  template: `
    <div class="ws-canvas">
      <f-flow fDraggable class="ws-canvas__flow">
        <f-canvas fZoom>
          <f-background>
            <f-circle-pattern color="var(--p-surface-300, #cbd5e1)" [radius]="1.4" />
          </f-background>

          <!-- NOTE: keep this @for a DIRECT child of f-canvas. foblex's content
               projection does not pick up nodes nested inside an @if wrapper. -->
          @for (item of layout(); track item.id) {
            <div
              fNode
              [fNodeId]="item.id"
              [fNodePosition]="item.position"
              [fNodeDraggingDisabled]="true"
              [fNodeSelectionDisabled]="true"
              [class.ws-connector]="item.kind === 'connector'"
              [class.ws-steps__empty]="item.kind === 'empty'"
            >
              @if (item.kind === 'card') {
                <ws-step-card [step]="item.step!" [index]="item.index!" [segmentId]="store.activeSegmentId()!" [totalSteps]="item.totalSteps!" />
              } @else if (item.kind === 'connector') {
                <span class="ws-connector__line"></span>
                <button class="ws-connector__add" type="button" aria-label="Insert step"><i class="pi pi-plus"></i></button>
                <span class="ws-connector__line"></span>
              } @else {
                This segment has no steps yet.
              }
            </div>
          }
        </f-canvas>
      </f-flow>

      @if (!store.panelOpen()) {
        <div class="ws-canvas__overlay ws-canvas__overlay--left">
          <ws-workflow-items-panel />
        </div>
      }
      <div class="ws-canvas__overlay ws-canvas__overlay--right">
        <ws-canvas-toolbar />
      </div>

      <!-- Properties panel — rendered when a step or action is being edited -->
      @if (panelItem(); as item) {
        @if (item.kind === 'action' && item.action && item.step) {
          <ws-action-properties [action]="item.action" [step]="item.step" />
        } @else if (item.kind === 'step' && item.step) {
          <ws-step-properties [step]="item.step" />
        }
      }
    </div>
  `,
  styles: `
    .ws-canvas {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      /* Neutralize foblex's default node chrome — our cards provide their own. */
      --ff-node-padding: 0;
      --ff-node-background-color: transparent;
      --ff-node-border-color: transparent;
      --ff-node-border-radius: 0;
      --ff-node-shadow: none;
      --ff-node-border-color-selected: transparent;
      --ff-node-shadow-selected: none;
      /* Textured dot-grid backdrop — cooler than the cards so they pop.
         Phase N: switch to f-circle-pattern so the grid pans/zooms. */
      background-color: var(--ws-canvas, #eaeef3);
      background-image: radial-gradient(circle, var(--ws-dot, #c2cad6) 1.4px, transparent 1.5px);
      background-size: 20px 20px;
      background-position: -10px -10px;
    }
    .ws-canvas__flow {
      display: block;
      position: absolute;
      inset: 0;
      background: transparent;
    }
    /* keep foblex surfaces transparent so the CSS grid shows through (skeleton) */
    .ws-canvas__flow ::ng-deep f-canvas { background: transparent; }
    .ws-canvas__overlay {
      position: absolute;
      top: 14px;
      z-index: 10;
    }
    .ws-canvas__overlay--left { left: 14px; }
    .ws-canvas__overlay--right { right: 14px; }

    .ws-steps__empty {
      width: 460px;
      padding: 20px;
      text-align: center;
      color: var(--ws-text-muted, #5a626f);
      font-size: 13px;
      background: var(--ws-surface, #fff);
      border: 1px dashed var(--ws-border-strong, #a9b3c2);
      border-radius: 8px;
    }
    .ws-connector { display: flex; flex-direction: column; align-items: center; width: 28px; height: 52px; }
    .ws-connector__line { flex: 1 1 auto; width: 2px; background: var(--ws-border-strong, #a9b3c2); }
    .ws-connector__add {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: 1px solid var(--ws-border-strong, #a9b3c2);
      border-radius: 50%;
      background: var(--ws-surface, #fff);
      color: var(--ws-text-muted, #5a626f);
      font-size: 11px;
      cursor: pointer;
    }
    .ws-connector__add:hover { color: var(--ws-scope-accent, #2474bb); border-color: var(--ws-scope-accent, #2474bb); }
  `,
})
export class Canvas {
  protected readonly store = inject(WorkflowStudioStore);

  /** Resolves which step/action the properties panel is showing (null = closed). */
  protected readonly panelItem = computed(() => {
    const id = this.store.propertiesPanelId();
    return id ? this.store.resolveItem(id) : null;
  });

  /**
   * Vertical auto-layout for the active segment: each step is its own node, with
   * a connector node in each gap. // TODO (Phase N): drag-reposition, persist positions.
   */
  protected readonly layout = computed<LayoutItem[]>(() => {
    const seg = this.store.currentSegment();
    const expandedIds = this.store.expandedIds();
    if (!seg) return [];
    if (seg.steps.length === 0) {
      return [{ kind: 'empty', id: 'empty', position: { x: CARD_X, y: START_Y } }];
    }
    const items: LayoutItem[] = [];
    const centerX = CARD_X + CARD_W / 2 - CONNECTOR_W / 2;
    const totalSteps = seg.steps.length;
    let y = START_Y;
    seg.steps.forEach((step, i) => {
      if (i > 0) {
        items.push({ kind: 'connector', id: `conn-${step.id}`, position: { x: centerX, y } });
        y += CONNECTOR_GAP;
      }
      items.push({ kind: 'card', id: step.id, position: { x: CARD_X, y }, step, index: i + 1, totalSteps });
      y += stepHeight(step, expandedIds.has(step.id));
    });
    return items;
  });
}
