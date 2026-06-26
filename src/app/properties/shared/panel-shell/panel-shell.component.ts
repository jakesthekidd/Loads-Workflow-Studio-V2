import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NodeKind } from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { EditableLabelComponent } from '../editable-label/editable-label.component';

@Component({
  selector: 'ws-panel-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditableLabelComponent],
  template: `
    <div class="shell">

      <!-- Header — #f6f9fc background, 3-row layout, bottom border -->
      <div class="shell__header">

        <!-- Row 1: breadcrumb trail + × close -->
        <div class="shell__header-top">
          <nav class="shell__trail" aria-label="Panel location">
            @for (crumb of store.panelBreadcrumbs(); track crumb.id; let last = $last) {
              @if (crumb.kind === NodeKind.Step) {
                <button
                  class="trail__item trail__item--link"
                  type="button"
                  (click)="store.openProperties(crumb.id)"
                >{{ crumb.label }}</button>
              } @else {
                <span class="trail__item">{{ crumb.label }}</span>
              }
              @if (!last) {
                <i class="trail__sep pi pi-angle-right"></i>
              }
            }
          </nav>
          <button class="shell__close" type="button" (click)="store.closeProperties()" aria-label="Close panel">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Row 2: title + badge + action buttons all inline -->
        <div class="shell__title-row">
          <div class="shell__title-group" (dblclick)="titleEditMode.set(true)">
            <h2 class="shell__title">
              <ws-editable-label
                [value]="title()"
                [editMode]="titleEditMode()"
                (confirmed)="onTitleConfirmed($event)"
                (cancelled)="titleEditMode.set(false)"
              >{{ title() }}</ws-editable-label>
            </h2>
            @if (!titleEditMode()) {
              <i class="shell__title-edit-hint pi pi-pencil" aria-hidden="true"></i>
            }
          </div>
          @if (typeBadge()) {
            <span class="shell__badge">{{ typeBadge() }}</span>
          }
          <div class="shell__actions">
            <button class="shell__action" type="button" aria-label="Save as template" (click)="saveTemplate.emit()">
              <i class="pi pi-bookmark"></i>
            </button>
            <button class="shell__action" type="button" aria-label="Duplicate" (click)="duplicate.emit()">
              <i class="pi pi-copy"></i>
            </button>
            <button class="shell__action shell__action--danger" type="button" aria-label="Delete" (click)="delete.emit()">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>

      </div>

      <!-- Scrollable content -->
      <div class="shell__content">
        <ng-content />
      </div>

      <!-- Footer -->
      <div class="shell__footer">
        <button class="btn btn--cancel" type="button" (click)="cancel.emit()">Cancel</button>
        <button class="btn btn--save" type="button" (click)="save.emit()">Save</button>
      </div>

    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
    }

    .shell {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      overflow: hidden;
    }

    /* ------------------------------------------------------------------ */
    /* Header                                                               */
    /* ------------------------------------------------------------------ */

    .shell__header {
      background: #f6f9fc;
      padding: 10px 16px 10px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid #e2e6eb;
    }

    /* Row 1: breadcrumb + close */
    .shell__header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .shell__trail {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      min-width: 0;
    }
    .trail__item {
      margin: 0;
      font-size: 12px;
      font-family: Roboto, sans-serif;
      color: #818ea1;
      white-space: nowrap;
    }
    .trail__item--link {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
      font-size: 12px;
      font-family: Roboto, sans-serif;
      color: #2474bb;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .trail__item--link:hover { color: #1d5d96; }
    .trail__sep {
      font-size: 10px;
      color: #818ea1;
    }
    .shell__close {
      border: none;
      background: transparent;
      cursor: pointer;
      color: #37404c;
      font-size: 16px;
      padding: 4px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
      transition: background 120ms ease, color 120ms ease;
    }
    .shell__close:hover {
      background: #eaeff5;
      color: #0e2e4b;
    }

    /* Row 2: title group + badge + actions */
    .shell__title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .shell__title-group {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1 1 0;
      cursor: text;
      border-radius: 4px;
      padding: 2px 4px;
      margin: -2px -4px;
      transition: background 120ms ease;
    }
    .shell__title-group:hover {
      background: #eaeff5;
    }
    .shell__title-edit-hint {
      color: #818ea1;
      font-size: 12px;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 120ms ease;
    }
    .shell__title-group:hover .shell__title-edit-hint {
      opacity: 1;
    }
    .shell__title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      font-family: Roboto, sans-serif;
      color: #0e2e4b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    /* Badge — dark navy pill, same visual weight as the action type
       tags on the step card rows (matches bg: #0e2e4b spec from Figma) */
    .shell__badge {
      display: inline-flex;
      align-items: center;
      height: 24px;
      padding: 0 8px;
      background: #0e2e4b;
      border-radius: 36px;
      font-size: 12px;
      font-family: Roboto, sans-serif;
      font-weight: 400;
      color: white;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Action buttons — now inline in title row */
    .shell__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      margin-left: auto;
    }
    .shell__action {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: #7a8799;
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 120ms ease, color 120ms ease;
    }
    .shell__action:hover {
      background: #e4edf6;
      color: #1d5d96;
    }
    .shell__action--danger:hover {
      color: #c41c28;
      background: #fef2f2;
    }

    /* ------------------------------------------------------------------ */
    /* Content + Footer                                                     */
    /* ------------------------------------------------------------------ */

    .shell__content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .shell__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid #e2e6eb;
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
      background: #e9f1f8;
      border: 1px solid #2068a8;
      color: #2068a8;
    }
    .btn--save {
      background: #2068a8;
      border: 1px solid #2068a8;
      color: white;
    }
    .btn:hover { opacity: 0.88; }
  `,
})
export class PanelShellComponent {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly NodeKind = NodeKind;

  readonly title = input.required<string>();
  readonly typeBadge = input<string>();

  readonly save = output<void>();
  readonly cancel = output<void>();
  readonly saveTemplate = output<void>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();
  readonly titleChanged = output<string>();

  protected readonly titleEditMode = signal(false);

  protected onTitleConfirmed(label: string): void {
    this.titleEditMode.set(false);
    if (label !== this.title()) {
      this.titleChanged.emit(label);
    }
  }
}
