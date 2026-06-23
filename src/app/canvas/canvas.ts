import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FFlowModule } from '@foblex/flow';
import { NodeKind, Step } from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { ActionPropertiesComponent } from '../properties/action-properties/action-properties.component';
import { StepPropertiesComponent } from '../properties/step-properties/step-properties.component';
import { CanvasToolbar } from './canvas-toolbar';
import { ActionLibraryPanel } from './action-library-panel';
import { StepCard } from './nodes/step-card';
import { StepPickerCard } from './nodes/step-picker-card';
import { WorkflowItemsPanel } from './workflow-items-panel';

interface LayoutItem {
  readonly kind: 'card' | 'connector' | 'empty' | 'picker';
  readonly id: string;
  readonly position: { x: number; y: number };
  readonly step?: Step;
  readonly index?: number;
  readonly totalSteps?: number;
  readonly insertIndex?: number;
}

interface CanvasTransform { x: number; y: number; scale: number; }
interface PopoverAnchor {
  assemblyX: number;
  panelY: number;
  maxPanelHeight: number;
  /** Pixel offset from panel top to the arrow div's top edge (arrow tip = offset + 20). */
  arrowOffsetY: number;
}

const CARD_X = 80;
const CARD_W = 460;
const START_Y = 40;
const CONNECTOR_W = 28;
const CONNECTOR_GAP = 52;
const CARD_H_COLLAPSED = 64;
const PICKER_H = 308;
const stepHeight = (s: Step, expanded: boolean) =>
  expanded ? 118 + 52 * s.actions.length : CARD_H_COLLAPSED;

// Step-card internal geometry (from step-card.ts styles)
// border(1) + padding-top(12) + header-height(40) + rows-margin-top(8)
const CARD_ROWS_START_Y = 61;
const ACTION_ROW_H = 44;
const ACTION_GAP = 8;
const ARROW_HALF_H = 20;

@Component({
  selector: 'ws-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FFlowModule,
    WorkflowItemsPanel,
    CanvasToolbar,
    StepCard,
    StepPickerCard,
    ActionLibraryPanel,
    ActionPropertiesComponent,
    StepPropertiesComponent,
  ],
  template: `
    <div #canvasRoot class="ws-canvas">
      <f-flow fDraggable class="ws-canvas__flow">
        <f-canvas fZoom (fCanvasChange)="onTransformChange($event)">
          <f-background>
            <f-circle-pattern color="var(--p-surface-300, #cbd5e1)" [radius]="1.4" />
          </f-background>

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
              } @else if (item.kind === 'picker') {
                <ws-step-picker-card [insertIndex]="item.insertIndex!" [segmentId]="store.activeSegmentId()!" />
              } @else if (item.kind === 'connector') {
                <span class="ws-connector__line"></span>
                <button class="ws-connector__add" type="button" aria-label="Insert step" (click)="store.openStepPicker(item.insertIndex!)"><i class="pi pi-plus"></i></button>
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

      @if (store.actionLibraryOpen()) {
        <ws-action-library-panel />
      }

      <!-- Tethered popover — position:fixed, moved via GPU-composited transform -->
      @if (panelItem(); as item) {
        <div
          class="ws-popover"
          [class.is-closing]="store.panelClosing()"
          [style.transform]="popoverTransform()"
        >
          <!-- Left-pointing arrow; margin-top tracks the selected item's row -->
          <div
            class="ws-popover__arrow"
            [style.margin-top.px]="popoverAnchor()?.arrowOffsetY ?? 7"
          ></div>

          <!-- Panel card — 438px wide, fully rounded, clamped height -->
          <div
            class="ws-popover__card"
            [style.max-height.px]="popoverAnchor()?.maxPanelHeight ?? 600"
          >
            <!-- Directional nav animation wrapper -->
            <div class="ws-popover__body" [class]="store.panelNavAnimClass()">
              @if (item.kind === NodeKind.Action && item.action && item.step) {
                <ws-action-properties [action]="item.action" [step]="item.step" />
              } @else if (item.kind === NodeKind.Step && item.step) {
                <ws-step-properties [step]="item.step" />
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .ws-canvas {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      --ff-node-padding: 0;
      --ff-node-background-color: transparent;
      --ff-node-border-color: transparent;
      --ff-node-border-radius: 0;
      --ff-node-shadow: none;
      --ff-node-border-color-selected: transparent;
      --ff-node-shadow-selected: none;
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

    /* ------------------------------------------------------------------ */
    /* Tethered popover assembly                                            */
    /* ------------------------------------------------------------------ */

    /* Outer flex row: [arrow] [card].
       position:fixed + transform:translate = GPU-composited repositioning;
       avoids filter re-computation on every pan/zoom frame.
       top/left:0 puts the origin at the viewport corner; translate() moves it. */
    .ws-popover {
      position: fixed;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      z-index: 100;
      will-change: transform;
      animation: popover-enter 200ms ease-out;
      pointer-events: auto;
    }
    .ws-popover.is-closing {
      animation: popover-exit 180ms ease-in forwards;
      pointer-events: none;
    }

    /* Arrow div — 40×40px, z:2, overlaps card by 1px.
       margin-top is set via style binding to track the selected row's Y. */
    .ws-popover__arrow {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
      margin-right: -1px;
      align-self: flex-start;
    }
    /* Outer triangle — border color matches card border */
    .ws-popover__arrow::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      border-top: 20px solid transparent;
      border-bottom: 20px solid transparent;
      border-right: 41px solid #e2e6eb;
    }
    /* Inner triangle — white fill, 1px inset from outer */
    .ws-popover__arrow::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 2px;
      width: 0;
      height: 0;
      border-top: 19px solid transparent;
      border-bottom: 19px solid transparent;
      border-right: 39px solid white;
    }

    /* Panel card — 438px wide, fully rounded, z:1.
       box-shadow provides depth; arrow has no shadow (keeps the seam clean). */
    .ws-popover__card {
      width: 438px;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      background: white;
      border: 1px solid #e2e6eb;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 28px rgba(14, 46, 75, 0.18), 0 2px 8px rgba(14, 46, 75, 0.08);
    }

    /* Nav animation wrapper */
    .ws-popover__body {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    /* Assembly enter/exit: translates toward/away from the card edge */
    @keyframes popover-enter {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes popover-exit {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(-10px); }
    }

    /* Directional content navigation (alternating a/b guarantees animation restart) */
    .nav-fwd-a, .nav-fwd-b { animation: content-from-right 220ms ease-out; }
    .nav-bwd-a, .nav-bwd-b { animation: content-from-left  220ms ease-out; }

    @keyframes content-from-right {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes content-from-left {
      from { opacity: 0; transform: translateX(-16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `,
})
export class Canvas {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly NodeKind = NodeKind;

  private readonly canvasRoot = viewChild<ElementRef<HTMLElement>>('canvasRoot');
  private readonly canvasTransform = signal<CanvasTransform>({ x: 0, y: 0, scale: 1 });

  protected readonly layout = computed<LayoutItem[]>(() => {
    const seg = this.store.currentSegment();
    const expandedIds = this.store.expandedIds();
    const pIdx = this.store.pickerIndex();
    if (!seg) return [];
    if (seg.steps.length === 0) {
      if (pIdx === 0) {
        return [{ kind: 'picker', id: 'picker', position: { x: CARD_X, y: START_Y }, insertIndex: 0 }];
      }
      return [{ kind: 'empty', id: 'empty', position: { x: CARD_X, y: START_Y } }];
    }
    const items: LayoutItem[] = [];
    const centerX = CARD_X + CARD_W / 2 - CONNECTOR_W / 2;
    const totalSteps = seg.steps.length;
    let y = START_Y;
    seg.steps.forEach((step, i) => {
      if (i > 0) {
        if (pIdx === i) {
          items.push({ kind: 'picker', id: 'picker', position: { x: CARD_X, y }, insertIndex: i });
          y += PICKER_H;
        } else {
          items.push({ kind: 'connector', id: `conn-${i}`, position: { x: centerX, y }, insertIndex: i });
          y += CONNECTOR_GAP;
        }
      }
      items.push({ kind: 'card', id: step.id, position: { x: CARD_X, y }, step, index: i + 1, totalSteps });
      y += stepHeight(step, expandedIds.has(step.id));
    });
    // Bottom connector (always present) — or picker if inserting at end
    if (pIdx === seg.steps.length) {
      items.push({ kind: 'picker', id: 'picker', position: { x: CARD_X, y }, insertIndex: seg.steps.length });
    } else {
      items.push({ kind: 'connector', id: 'conn-end', position: { x: centerX, y }, insertIndex: seg.steps.length });
    }
    return items;
  });

  protected readonly panelItem = computed(() => {
    const id = this.store.propertiesPanelId();
    return id ? this.store.resolveItem(id) : null;
  });

  /**
   * Viewport-space anchor for the tethered popover.
   * Recomputes reactively on every foblex pan/zoom event and window resize.
   *
   * The arrow always anchors to the step card (not action sub-rows) for the
   * panel X position, but `arrowOffsetY` tracks the exact selected row's
   * midpoint so the arrow tip visually connects to what was clicked.
   */
  protected readonly popoverAnchor = computed<PopoverAnchor | null>(() => {
    const id = this.store.propertiesPanelId();
    const transform = this.canvasTransform();
    const el = this.canvasRoot()?.nativeElement;
    if (!id || !el) return null;

    const resolved = this.store.resolveItem(id);
    if (!resolved) return null;

    const stepId = resolved.kind === NodeKind.Action ? resolved.step?.id : id;
    if (!stepId) return null;

    const item = this.layout().find(l => l.id === stepId && l.kind === 'card');
    if (!item) return null;

    const rect = el.getBoundingClientRect();
    const { x: tx, y: ty, scale } = transform;

    // Card right edge in viewport coords — left edge of the popover assembly
    const cardRightX = rect.left + (item.position.x + CARD_W) * scale + tx;
    const rawY = rect.top + item.position.y * scale + ty;

    // Y position: clamp so panel is always at least partially visible
    const panelY = Math.max(16, Math.min(rawY, window.innerHeight - 300));
    const maxPanelHeight = window.innerHeight - panelY - 16;

    // Arrow Y: compute the canvas-space row midpoint, convert to viewport,
    // then express as offset from panel top (arrowOffsetY + ARROW_HALF_H = tip viewport Y)
    let canvasRowMidY: number;
    if (resolved.kind === NodeKind.Action && resolved.step) {
      const actionIdx = resolved.step.actions.findIndex(a => a.id === id);
      // CARD_ROWS_START_Y = border(1) + pad(12) + header(40) + rows-margin(8)
      canvasRowMidY = CARD_ROWS_START_Y + Math.max(0, actionIdx) * (ACTION_ROW_H + ACTION_GAP) + ACTION_ROW_H / 2;
    } else {
      // Step: midpoint of the card header = border(1) + pad(12) + header/2(20) = 33
      canvasRowMidY = 33;
    }

    const viewportTipY = rawY + canvasRowMidY * scale;
    const arrowOffsetY = Math.max(4, Math.min(
      viewportTipY - panelY - ARROW_HALF_H,
      maxPanelHeight - 36, // keep arrow within visible card area
    ));

    return { assemblyX: cardRightX, panelY, maxPanelHeight, arrowOffsetY };
  });

  /**
   * CSS transform string for GPU-composited repositioning.
   * Using transform:translate() avoids recalculating box-shadow on every frame.
   */
  protected readonly popoverTransform = computed(() => {
    const a = this.popoverAnchor();
    if (!a) return 'translate(-9999px, -9999px)';
    return `translate(${a.assemblyX}px, ${a.panelY}px)`;
  });

  protected onTransformChange(e: { position: { x: number; y: number }; scale: number }): void {
    this.canvasTransform.set({ x: e.position.x, y: e.position.y, scale: e.scale });
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.canvasTransform.update(t => ({ ...t }));
  }
}
