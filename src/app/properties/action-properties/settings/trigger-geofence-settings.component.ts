import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

const TRIGGER_OPTIONS = [
  { label: 'Enter', value: 'enter' },
  { label: 'Exit', value: 'exit' },
  { label: 'Dwell', value: 'dwell' },
];

@Component({
  selector: 'ws-trigger-geofence-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule, InputNumberModule],
  template: `
    <div class="field">
      <label class="field__label">Trigger</label>
      <p-select [(ngModel)]="trigger" [options]="triggerOptions" optionLabel="label" optionValue="value" placeholder="Select trigger" styleClass="w-full" />
    </div>
    @if (trigger() === 'dwell') {
      <div class="field">
        <label class="field__label">Dwell Duration (seconds)</label>
        <p-inputnumber [(ngModel)]="dwellSeconds" [min]="1" styleClass="w-full" />
      </div>
    }
    <div class="field">
      <label class="field__label">Select Geo-Fence</label>
      <p-select [options]="[]" placeholder="Select an item" styleClass="w-full" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class TriggerGeofenceSettingsComponent {
  readonly trigger = model<'enter' | 'exit' | 'dwell' | undefined>(undefined);
  readonly dwellSeconds = model<number | undefined>(undefined);
  protected readonly triggerOptions = TRIGGER_OPTIONS;
}
