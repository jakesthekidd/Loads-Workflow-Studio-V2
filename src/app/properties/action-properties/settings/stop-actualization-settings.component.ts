import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { PropertyToggleRowComponent } from '../../shared/property-toggle-row/property-toggle-row.component';
import { SplitTriggerSelectComponent } from '../../shared/split-trigger-select/split-trigger-select.component';

@Component({
  selector: 'ws-stop-actualization-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitTriggerSelectComponent, PropertyToggleRowComponent],
  template: `
    <ws-split-trigger-select
      label="Trigger"
      [(triggerType)]="trigger"
      [(geofenceId)]="geofenceId"
    />
    <ws-property-toggle-row label="Prompt Driver to manually confirm" [(value)]="promptManualConfirm" />
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  `,
})
export class StopActualizationSettingsComponent {
  readonly trigger = model<string | undefined>(undefined);
  readonly geofenceId = model<string | undefined>(undefined);
  readonly promptManualConfirm = model<boolean>(false);
}
