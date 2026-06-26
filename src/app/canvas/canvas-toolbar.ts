import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { WorkflowStudioStore } from '@app/services';

@Component({
  selector: 'ws-canvas-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, SplitButtonModule],
  template: `
    <div class="ws-toolbar">
      <button
        class="ws-toolbar__collapse"
        type="button"
        (click)="toggle()"
        [attr.aria-label]="collapsed() ? 'Expand toolbar' : 'Collapse toolbar'"
        [attr.aria-expanded]="!collapsed()"
      >
        <i class="pi" [class.pi-angle-double-right]="!collapsed()" [class.pi-angle-double-left]="collapsed()"></i>
      </button>

      <div class="ws-toolbar__bar">
        @if (!collapsed()) {
          <!-- View + add-pickers -->
          <div class="ws-toolbar__group">
            <button
              class="ws-toolbar__icon"
              [class.ws-toolbar__icon--active]="store.previewOpen()"
              type="button"
              aria-label="Preview"
              (click)="store.previewOpen() ? store.closePreview() : store.openPreview()"
            >
              <i class="pi pi-eye"></i>
            </button>
            <button
              class="ws-toolbar__icon"
              [class.ws-toolbar__icon--active]="store.stepLibraryOpen()"
              type="button"
              aria-label="Template Steps"
              (click)="toggleStepLibrary()"
            >
              <i class="pi pi-list-check"></i>
            </button>
            <button
              class="ws-toolbar__icon"
              [class.ws-toolbar__icon--active]="store.actionLibraryOpen()"
              type="button"
              aria-label="Components"
              (click)="toggleActionLibrary()"
            >
              <i class="pi pi-th-large"></i>
            </button>
          </div>

          <span class="ws-toolbar__divider"></span>

          <!-- Settings + history -->
          <div class="ws-toolbar__group">
            <button class="ws-toolbar__cell" type="button" aria-label="Settings"><i class="pi pi-cog"></i></button>
            <span class="ws-toolbar__history">
              <button class="ws-toolbar__cell" type="button" aria-label="Undo"><i class="pi pi-replay"></i></button>
              <button class="ws-toolbar__cell ws-flip" type="button" aria-label="Redo"><i class="pi pi-replay"></i></button>
            </span>
          </div>
        }

        <!-- Always-visible actions -->
        <div class="ws-toolbar__group">
          <p-button label="Run" icon="pi pi-play" [outlined]="true" />
          <p-splitButton label="Save" icon="pi pi-save" [model]="saveOptions" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .ws-toolbar { display: flex; align-items: center; }
    .ws-toolbar__collapse {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 25px;
      height: 25px;
      margin-right: -9px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 50%;
      background: var(--ws-surface, #fff);
      color: var(--ws-text-muted, #5a626f);
      box-shadow: 0 2px 8px rgb(20 30 50 / 12%);
      cursor: pointer;
      z-index: 2;
    }
    .ws-toolbar__collapse:hover { color: var(--ws-text, #1b2330); }
    .ws-toolbar__bar {
      display: flex;
      align-items: center;
      gap: 18px;
      height: 59px;
      padding: 7px 14px;
      background: var(--ws-surface, #fff);
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgb(20 30 50 / 12%);
    }
    .ws-toolbar__group { display: flex; align-items: center; gap: 6px; }
    .ws-toolbar__divider { width: 1px; height: 29px; background: var(--ws-border, #c6ccd6); }
    .ws-toolbar__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--ws-text-muted, #5a626f);
      font-size: 17px;
      cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .ws-toolbar__icon:hover {
      background: var(--ws-hover, #eef1f6);
      color: var(--ws-text, #1b2330);
    }
    .ws-toolbar__icon--active {
      background: var(--p-primary-500, #2474bb);
      color: #fff;
    }
    .ws-toolbar__icon--active:hover {
      background: var(--p-primary-600, #1b5f99);
      color: #fff;
    }
    .ws-toolbar__history { display: inline-flex; border: 1px solid var(--ws-border, #c6ccd6); border-radius: 4px; overflow: hidden; }
    .ws-toolbar__cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 4px;
      background: var(--ws-surface, #fff);
      color: var(--ws-text-muted, #5a626f);
      cursor: pointer;
    }
    .ws-toolbar__cell:hover { background: var(--ws-hover, #eef1f6); color: var(--ws-text, #1b2330); }
    .ws-toolbar__history .ws-toolbar__cell { border: none; border-radius: 0; }
    .ws-toolbar__history .ws-toolbar__cell:first-child { border-right: 1px solid var(--ws-border, #c6ccd6); }
    .ws-flip { transform: scaleX(-1); }
  `,
})
export class CanvasToolbar {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly collapsed = signal(false);

  protected toggle(): void {
    this.collapsed.update((v) => !v);
  }

  protected toggleStepLibrary(): void {
    if (this.store.stepLibraryOpen()) {
      this.store.closeStepLibrary();
    } else {
      this.store.openStepLibrary();
    }
  }

  protected toggleActionLibrary(): void {
    if (this.store.actionLibraryOpen()) {
      this.store.closeActionLibrary();
    } else {
      this.store.openActionLibrary(null);
    }
  }

  protected readonly saveOptions: MenuItem[] = [
    { label: 'Save' },
    { label: 'Save & Publish' },
    { label: 'Save as Template' },
  ];
}
