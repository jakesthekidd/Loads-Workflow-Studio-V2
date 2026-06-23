import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PrePopulatedCardComponent } from '../../shared/pre-populated-card/pre-populated-card.component';

@Component({
  selector: 'ws-temperature-field-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, PrePopulatedCardComponent],
  template: `
    <div class="field">
      <label class="field__label">Label Text</label>
      <input pInputText [(ngModel)]="labelText" placeholder="Enter LabelText" class="field__input" />
    </div>

    <ws-pre-populated-card
      [(enabled)]="prePopulate"
      [(recipientType)]="prePopulateSource"
      [(recipientValue)]="prePopulateValue"
      [(readOnly)]="readOnly"
      [(editableIfNull)]="editableIfNull"
    />
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
  `,
})
export class TemperatureFieldSettingsComponent {
  readonly labelText = model<string>('');
  readonly prePopulate = model<boolean>(false);
  readonly prePopulateSource = model<'json' | 'static'>('json');
  readonly prePopulateValue = model<string>('');
  readonly readOnly = model<boolean>(false);
  readonly editableIfNull = model<boolean>(false);
}
