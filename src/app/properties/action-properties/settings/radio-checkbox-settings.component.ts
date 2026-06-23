import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectOption } from '@app/models';
import { PrePopulatedCardComponent } from '../../shared/pre-populated-card/pre-populated-card.component';
import { SegmentedButtonGroupComponent } from '../../shared/segmented-button-group/segmented-button-group.component';

@Component({
  selector: 'ws-radio-checkbox-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, PrePopulatedCardComponent, SegmentedButtonGroupComponent],
  template: `
    <div class="field">
      <label class="field__label">Label Text</label>
      <input pInputText [(ngModel)]="labelText" placeholder="Set Drop Down Label Text" class="field__input" />
    </div>

    <ws-pre-populated-card
      [(enabled)]="prePopulate"
      [(recipientType)]="prePopulateSource"
      [(recipientValue)]="prePopulateValue"
      [(readOnly)]="readOnly"
      [(editableIfNull)]="editableIfNull"
    />

    <div class="field">
      <label class="field__label">Type*</label>
      <ws-segmented-button-group [options]="typeOptions" [(value)]="selectionType" />
    </div>

    <div class="field">
      <label class="field__label">Options*</label>
      <div class="options-list">
        @for (opt of options(); track $index) {
          <div class="option-row">
            <i class="pi pi-bars option-row__grip"></i>
            <input
              pInputText
              [ngModel]="opt.label"
              (ngModelChange)="updateOption($index, $event)"
              placeholder="Option label"
              class="field__input"
            />
          </div>
        }
      </div>
      <button class="btn-add" type="button" (click)="addOption()">+ Add Option</button>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
    .options-list { display: flex; flex-direction: column; gap: 6px; }
    .option-row { display: flex; align-items: center; gap: 8px; }
    .option-row__grip { color: #a9b3c2; font-size: 12px; cursor: grab; flex-shrink: 0; }
    .btn-add {
      align-self: flex-start;
      margin-top: 4px;
      background: transparent;
      border: 1px solid #2474bb;
      color: #2474bb;
      border-radius: 4px;
      padding: 4px 12px;
      font-size: 13px;
      font-family: Roboto, sans-serif;
      cursor: pointer;
    }
    .btn-add:hover { background: #e9f1f8; }
  `,
})
export class RadioCheckboxSettingsComponent {
  readonly labelText = model<string>('');
  readonly prePopulate = model<boolean>(false);
  readonly prePopulateSource = model<'json' | 'static'>('json');
  readonly prePopulateValue = model<string>('');
  readonly readOnly = model<boolean>(false);
  readonly editableIfNull = model<boolean>(false);
  readonly selectionType = model<string>('Single-Select');
  readonly options = model<SelectOption[]>([]);

  protected readonly typeOptions = ['Single-Select', 'Multi-Select'];

  protected addOption(): void {
    this.options.update(opts => [...opts, { value: `opt-${opts.length + 1}`, label: '' }]);
  }

  protected updateOption(index: number, label: string): void {
    this.options.update(opts => opts.map((o, i) => i === index ? { ...o, label, value: label.toLowerCase().replace(/\s+/g, '-') || o.value } : o));
  }
}
