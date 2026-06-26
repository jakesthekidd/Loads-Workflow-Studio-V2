import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { WorkflowStudioStore } from '@app/services';
import { PreviewRuntime } from './preview-runtime.service';
import { PreviewSegment } from './preview-segment';

/**
 * Mobile workflow preview overlay — a phone-bezel dialog centered over the
 * canvas. Provides PreviewRuntime at this component level (ephemeral scope).
 *
 * Layout:
 *   backdrop (full-screen)
 *     phone bezel (390×auto, centered)
 *       status bar   (iOS chrome)
 *       app header   (workflow name + back/close)
 *       tab content  (scrollable steps)
 *       bottom nav   (Overview | Steps✓ | Map | Scan)
 */
@Component({
  selector: 'ws-preview-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PreviewRuntime],
  imports: [PreviewSegment],
  template: `
    <!-- Backdrop -->
    <div class="pv-backdrop" (click)="close()" role="dialog" aria-modal="true" aria-label="Workflow Preview">

      <!-- Phone bezel — stop backdrop click from bubbling through the phone -->
      <div class="pv-phone" (click)="$event.stopPropagation()">

        <!-- iOS-style status bar -->
        <div class="pv-status-bar">
          <span class="pv-status-bar__time">9:41</span>
          <span class="pv-status-bar__icons">
            <i class="pi pi-wifi"></i>
            <i class="pi pi-signal-bars"></i>
            <i class="pi pi-battery-full"></i>
          </span>
        </div>

        <!-- App header -->
        <div class="pv-app-header">
          <button class="pv-app-header__back" type="button" aria-label="Back">
            <i class="pi pi-chevron-left"></i>
          </button>
          <span class="pv-app-header__title">{{ workflowName() }}</span>
          <button class="pv-app-header__close" type="button" aria-label="Close preview" (click)="close()">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Scrollable content area -->
        <div class="pv-content">

          <!-- Steps counter -->
          <div class="pv-counter">
            Steps — <strong>{{ doneCount() }}/{{ totalStepCount() }} DONE</strong>
          </div>

          <!-- Segment panels -->
          <div class="pv-segments">
            @for (seg of store.segments(); track seg.id) {
              @if (!runtime.isHidden(seg.condition)) {
                <ws-preview-segment [segment]="seg" />
              }
            }
          </div>
        </div>

        <!-- Bottom tab bar -->
        <nav class="pv-tab-bar">
          <button class="pv-tab" type="button">
            <i class="pi pi-home"></i>
            <span>Overview</span>
          </button>
          <button class="pv-tab pv-tab--active" type="button">
            <i class="pi pi-list"></i>
            <span>Steps</span>
            <span class="pv-tab__dot"></span>
          </button>
          <button class="pv-tab" type="button">
            <i class="pi pi-map"></i>
            <span>Map View</span>
          </button>
          <button class="pv-tab" type="button">
            <i class="pi pi-qrcode"></i>
            <span>Scan</span>
          </button>
        </nav>

      </div>
    </div>
  `,
  styles: `
    /* ── Backdrop ─────────────────────────────────────────────────────── */
    .pv-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pv-enter 200ms ease-out;
    }

    @keyframes pv-enter {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Phone bezel ──────────────────────────────────────────────────── */
    .pv-phone {
      width: 390px;
      height: min(844px, calc(100vh - 80px));
      border-radius: 44px;
      background: #F3F5F7;
      box-shadow:
        0 0 0 10px #1b2330,
        0 0 0 11px #3f4a5a,
        0 30px 80px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: pv-phone-enter 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes pv-phone-enter {
      from { opacity: 0; transform: scale(0.93) translateY(12px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ── Status bar ───────────────────────────────────────────────────── */
    .pv-status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 28px 4px;
      background: var(--p-primary-600, #1b5f99);
      flex-shrink: 0;
    }
    .pv-status-bar__time {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.01em;
    }
    .pv-status-bar__icons {
      display: flex;
      gap: 5px;
      color: #fff;
      font-size: 12px;
    }

    /* ── App header ───────────────────────────────────────────────────── */
    .pv-app-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px 12px;
      background: var(--p-primary-600, #1b5f99);
      flex-shrink: 0;
    }
    .pv-app-header__back,
    .pv-app-header__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .pv-app-header__back:hover,
    .pv-app-header__close:hover { background: rgba(255, 255, 255, 0.25); }

    .pv-app-header__title {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      text-align: center;
      letter-spacing: 0.01em;
    }

    /* ── Scrollable content ───────────────────────────────────────────── */
    .pv-content {
      flex: 1;
      overflow-y: auto;
      background: #F3F5F7;
      min-height: 0;
    }
    .pv-content::-webkit-scrollbar { width: 4px; }
    .pv-content::-webkit-scrollbar-track { background: transparent; }
    .pv-content::-webkit-scrollbar-thumb { background: var(--p-surface-300, #cbd5e1); border-radius: 2px; }

    /* ── Counter row ──────────────────────────────────────────────────── */
    .pv-counter {
      padding: 12px 16px 10px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      background: #fff;
      border-bottom: 1px solid #E2E6EB;
      letter-spacing: 0.01em;
    }
    .pv-counter strong { color: #2474BB; font-size: 13px; }

    /* ── Segment list — no extra padding; segments are full-width ─────── */
    .pv-segments {
      display: flex;
      flex-direction: column;
    }

    /* ── Bottom tab bar ───────────────────────────────────────────────── */
    .pv-tab-bar {
      display: flex;
      align-items: stretch;
      background: #fff;
      border-top: 1px solid var(--p-surface-200, #e2e8f0);
      padding: 0 0 10px;
      flex-shrink: 0;
    }

    .pv-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 4px 0;
      border: none;
      background: transparent;
      color: var(--p-surface-400, #94a3b8);
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      position: relative;
    }
    .pv-tab i { font-size: 18px; }
    .pv-tab--active { color: var(--p-primary-600, #1b5f99); }
    .pv-tab__dot {
      position: absolute;
      top: 6px;
      right: calc(50% - 14px);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--p-primary-500, #2474bb);
    }
  `,
})
export class PreviewShell implements OnInit {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly runtime = inject(PreviewRuntime);

  ngOnInit(): void {
    this.runtime.initFromSegments(this.store.segments());
  }

  protected close(): void {
    this.store.closePreview();
  }

  protected readonly workflowName = computed(() => this.store.workflow()?.name ?? 'Preview');

  protected readonly totalStepCount = computed(() =>
    this.store.segments().reduce((acc, seg) => acc + seg.steps.length, 0),
  );

  protected readonly doneCount = computed(() => {
    // Touch values signal so this recomputes when any field changes.
    void this.runtime.values();
    return this.store.segments().reduce(
      (acc, seg) => acc + seg.steps.filter(s => this.runtime.isDone(s.id)).length,
      0,
    );
  });
}
