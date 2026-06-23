import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PrePopulatedCardComponent } from '../../shared/pre-populated-card/pre-populated-card.component';
import { SegmentedButtonGroupComponent } from '../../shared/segmented-button-group/segmented-button-group.component';

const MIN_LENGTH_OPTIONS = [
  { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 },
  { label: '5', value: 5 }, { label: '10', value: 10 }, { label: '20', value: 20 },
  { label: '50', value: 50 }, { label: '100', value: 100 },
];

@Component({
  selector: 'ws-text-field-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, SelectModule, PrePopulatedCardComponent, SegmentedButtonGroupComponent],
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
      <ws-segmented-button-group [options]="textTypeOptions" [(value)]="type" />
    </div>

    <div class="field">
      <label class="field__label">Data Type*</label>
      <ws-segmented-button-group [options]="dataTypeOptions" [(value)]="dataType" />
    </div>

    <!-- Minimum Length collapsible -->
    <div class="card">
      <div class="card__header">
        <span class="card__title">Minimum Length</span>
        <label class="toggle-wrap">
          <input type="checkbox" [ngModel]="minLengthEnabled()" (ngModelChange)="minLengthEnabled.set($event)" class="toggle-wrap__input" />
          <span class="toggle-wrap__track"></span>
        </label>
      </div>
      @if (minLengthEnabled()) {
        <div class="card__body">
          <p-select
            [(ngModel)]="minLength"
            [options]="minLengthOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Set Minimum Length"
            styleClass="w-full"
          />
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
    .w-full { width: 100%; }

    .card {
      border: 1px solid #e2e6eb;
      border-radius: 8px;
      background: white;
    }
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      background: #f6f9fc;
      border-radius: 8px 8px 0 0;
      border-bottom: 1px solid #e2e6eb;
    }
    .card__title { font-size: 14px; font-weight: 500; font-family: Roboto, sans-serif; color: #282e38; }
    .card__body { padding: 12px 8px; }

    /* minimal native toggle until PrimeNG ToggleSwitch is wired */
    .toggle-wrap { display: inline-flex; align-items: center; cursor: pointer; }
    .toggle-wrap__input { display: none; }
    .toggle-wrap__track {
      width: 36px; height: 20px; background: #cbd5e1; border-radius: 10px;
      position: relative; transition: background 150ms;
    }
    .toggle-wrap__track::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; background: white; border-radius: 50%; transition: left 150ms;
    }
    .toggle-wrap__input:checked + .toggle-wrap__track { background: #2474bb; }
    .toggle-wrap__input:checked + .toggle-wrap__track::after { left: 18px; }
  `,
})
export class TextFieldSettingsComponent {
  readonly labelText = model<string>('');
  readonly prePopulate = model<boolean>(false);
  readonly prePopulateSource = model<'json' | 'static'>('json');
  readonly prePopulateValue = model<string>('');
  readonly readOnly = model<boolean>(false);
  readonly editableIfNull = model<boolean>(false);
  readonly type = model<string>('Short Text');
  readonly dataType = model<string>('Alpha');
  readonly minLengthEnabled = model<boolean>(false);
  readonly minLength = model<number | undefined>(undefined);

  protected readonly textTypeOptions = ['Short Text', 'Paragraph'];
  protected readonly dataTypeOptions = ['Alpha', 'Numeric', 'All'];
  protected readonly minLengthOptions = MIN_LENGTH_OPTIONS;
}
