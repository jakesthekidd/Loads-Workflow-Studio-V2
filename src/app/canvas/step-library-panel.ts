import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StepTemplate } from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { StepTemplateSelectorComponent } from './nodes/step-template-selector';

@Component({
  selector: 'ws-step-library-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepTemplateSelectorComponent],
  template: `
    <div class="slib">
      <header class="slib__head">
        <span class="slib__title">Template Steps</span>
        <button class="slib__close" type="button" aria-label="Close" (click)="store.closeStepLibrary()">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <div class="slib__body">
        <ws-step-template-selector
          (selectTemplate)="add($event)"
          (selectBlank)="addBlank()"
        />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      top: 90px;
      right: 14px;
      width: 360px;
      z-index: 200;
    }

    .slib {
      background: #fff;
      border: 1px solid #e2e6eb;
      border-radius: 12px;
      box-shadow: 0 8px 28px rgba(14, 46, 75, 0.18), 0 2px 8px rgba(14, 46, 75, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 110px);
    }

    .slib__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--ws-border, #c6ccd6);
      flex-shrink: 0;
    }
    .slib__title {
      font-size: 13px;
      font-weight: 700;
      color: var(--ws-text, #1b2330);
    }
    .slib__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      font-size: 12px;
      cursor: pointer;
    }
    .slib__close:hover { background: var(--ws-hover, #eef1f6); color: var(--ws-text, #1b2330); }

    .slib__body {
      overflow-y: auto;
      padding: 12px;
      flex: 1;
      min-height: 0;
    }
  `,
})
export class StepLibraryPanel {
  protected readonly store = inject(WorkflowStudioStore);

  protected add(tpl: StepTemplate): void {
    const seg = this.store.currentSegment();
    if (!seg) return;
    this.store.addStep(seg.id, seg.steps.length, tpl);
    this.store.closeStepLibrary();
  }

  protected addBlank(): void {
    const seg = this.store.currentSegment();
    if (!seg) return;
    this.store.addStep(seg.id, seg.steps.length);
    this.store.closeStepLibrary();
  }
}
