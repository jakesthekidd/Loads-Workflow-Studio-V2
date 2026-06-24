import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { StepTemplate } from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { StepTemplateSelectorComponent } from './step-template-selector';

@Component({
  selector: 'ws-step-picker-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepTemplateSelectorComponent],
  template: `
    <div class="picker">
      <header class="picker__head">
        <span class="picker__title">
          <i class="pi pi-plus-circle picker__title-icon"></i>
          Template Steps
        </span>
        <button class="picker__close" type="button" aria-label="Cancel" (click)="store.closeStepPicker()">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <div class="picker__body">
        <ws-step-template-selector
          (selectTemplate)="select($event)"
          (selectBlank)="selectBlank()"
        />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; width: 460px; }

    .picker {
      background: #f0f9ff;
      border: 1.5px dashed var(--p-primary-400, #4da6d9);
      border-radius: 10px;
      box-shadow: 0 4px 18px rgba(36, 116, 187, 0.13), 0 1px 4px rgba(20, 30, 50, 0.08);
      overflow: hidden;
    }

    .picker__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 9px;
      background: #fff;
      border-bottom: 1px solid var(--p-primary-200, #bae0f7);
    }
    .picker__title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: var(--p-primary-600, #1b5f99);
    }
    .picker__title-icon { font-size: 14px; color: var(--p-primary-500, #2474bb); }
    .picker__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      font-size: 11px;
      cursor: pointer;
    }
    .picker__close:hover { background: #dbeafe; color: var(--p-primary-600, #1b5f99); }

    .picker__body {
      padding: 10px 12px 12px;
      height: 320px;
      overflow-y: auto;
    }
  `,
})
export class StepPickerCard {
  protected readonly store = inject(WorkflowStudioStore);

  readonly insertIndex = input.required<number>();
  readonly segmentId = input.required<string>();

  protected select(tpl: StepTemplate): void {
    this.store.addStep(this.segmentId(), this.insertIndex(), tpl);
  }

  protected selectBlank(): void {
    this.store.addStep(this.segmentId(), this.insertIndex());
  }
}
