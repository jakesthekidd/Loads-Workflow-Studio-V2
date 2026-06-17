import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PropertyToggleRowComponent } from '../../shared/property-toggle-row/property-toggle-row.component';

@Component({
  selector: 'ws-barcode-scanner-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, PropertyToggleRowComponent],
  template: `
    <ws-property-toggle-row label="Repeatable" [(value)]="repeatable" />
    <div class="field">
      <label class="field__label">Label Text</label>
      <input pInputText [(ngModel)]="labelText" placeholder="Label Text" class="w-full" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class BarcodeScannerSettingsComponent {
  readonly repeatable = model<boolean>(false);
  readonly labelText = model<string>('');
}
