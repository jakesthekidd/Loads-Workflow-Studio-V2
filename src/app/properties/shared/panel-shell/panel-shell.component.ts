import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { WorkflowStudioStore } from '@app/services';

@Component({
  selector: 'ws-panel-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <!-- Collapse handle tab -->
      <button class="shell__tab" type="button" (click)="store.closeProperties()" aria-label="Close panel">
        <i class="pi pi-angle-left"></i>
      </button>

      <!-- Main card -->
      <div class="shell__card">
        <!-- Header -->
        <div class="shell__header">
          <div class="shell__header-left">
            @if (stepName()) {
              <p class="shell__step-name">{{ stepName() }}</p>
            }
            <div class="shell__title-row">
              <h2 class="shell__title">{{ title() }}</h2>
              @if (typeBadge()) {
                <span class="shell__badge">{{ typeBadge() }}</span>
              }
            </div>
          </div>
          <button class="shell__expand" type="button" aria-label="Expand panel">
            <i class="pi pi-expand"></i>
          </button>
        </div>

        <!-- Blue divider -->
        <div class="shell__divider"></div>

        <!-- Content -->
        <div class="shell__content">
          <ng-content />
        </div>

        <!-- Footer -->
        <div class="shell__footer">
          <button class="btn btn--cancel" type="button" (click)="cancel.emit()">Cancel</button>
          <button class="btn btn--save" type="button" (click)="save.emit()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      position: absolute;
      top: 16px;
      right: 16px;
      /* No bottom anchor — panel is content-height, not full-height */
      width: 478px;
      z-index: 100;
      pointer-events: all;
      filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.15));
    }

    .shell {
      display: flex;
      align-items: stretch;   /* tab stretches to match card height */
      width: 100%;
      max-height: calc(100vh - 120px);
    }

    /* Collapse tab */
    .shell__tab {
      flex-shrink: 0;
      width: 40px;
      min-height: 78px;       /* no fixed height — stretches with card */
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--p-surface-900, #282e38);
      border: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      color: white;
      font-size: 16px;
    }
    .shell__tab:hover {
      background: var(--p-surface-700, #556376);
    }

    /* Card */
    .shell__card {
      flex: 1;
      min-width: 0;
      /* no height: 100% — card is content-height */
      background: white;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Header */
    .shell__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 16px 16px 8px;
      background: white;
      flex-shrink: 0;
    }
    .shell__header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .shell__step-name {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      font-family: Roboto, sans-serif;
      color: var(--p-surface-300, #9fa9b7);
    }
    .shell__title-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .shell__title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      font-family: Roboto, sans-serif;
      color: var(--p-surface-900, #282e38);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .shell__badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      background: #dcf2fc;
      border-radius: 36px;
      font-size: 12px;
      font-family: Roboto, sans-serif;
      color: #000;
      align-self: flex-start;
    }
    .shell__expand {
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--p-surface-900, #282e38);
      font-size: 16px;
      padding: 0;
      flex-shrink: 0;
    }

    /* Divider */
    .shell__divider {
      margin: 4px 16px;
      height: 2px;
      background: var(--p-primary-700, #1d5d96);
      border-radius: 40px;
      flex-shrink: 0;
    }

    /* Content */
    .shell__content {
      flex: 1;
      min-height: 0;          /* required: lets flex child scroll instead of expanding */
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Footer */
    .shell__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid var(--p-surface-border, #e2e6eb);
      flex-shrink: 0;
    }
    .btn {
      height: 37px;
      padding: 0 24px;
      border-radius: 4px;
      font-size: 14px;
      font-family: Roboto, sans-serif;
      cursor: pointer;
    }
    .btn--cancel {
      background: var(--p-blue-50, #e9f1f8);
      border: 1px solid var(--p-blue-600, #2068a8);
      color: var(--p-blue-600, #2068a8);
    }
    .btn--save {
      background: var(--p-blue-600, #2068a8);
      border: 1px solid var(--p-blue-600, #2068a8);
      color: white;
    }
    .btn:hover {
      opacity: 0.9;
    }
  `,
})
export class PanelShellComponent {
  protected readonly store = inject(WorkflowStudioStore);

  readonly title = input.required<string>();
  readonly stepName = input<string>();
  readonly typeBadge = input<string>();

  readonly save = output<void>();
  readonly cancel = output<void>();
}
