import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PropertyToggleRowComponent } from '../../shared/property-toggle-row/property-toggle-row.component';

const TRIGGER_OPTIONS = [{ label: 'Geofence Trigger', value: 'geofence' }];

@Component({
  selector: 'ws-stop-actualization-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule, PropertyToggleRowComponent],
  template: `
    <div class="field">
      <label class="field__label">Trigger</label>
      <p-select [(ngModel)]="trigger" [options]="triggerOptions" optionLabel="label" optionValue="value" placeholder="Geofence Trigger + Unset" styleClass="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Select Geo-Fence</label>
      <p-select [(ngModel)]="geofenceId" [options]="[]" placeholder="Select an item" styleClass="w-full" />
    </div>
    <ws-property-toggle-row label="Prompt Driver to manually confirm" [(value)]="promptManualConfirm" />
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class StopActualizationSettingsComponent {
  readonly trigger = model<'geofence' | undefined>(undefined);
  readonly geofenceId = model<string | undefined>(undefined);
  readonly promptManualConfirm = model<boolean>(false);
  protected readonly triggerOptions = TRIGGER_OPTIONS;
}
