import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { SplitTriggerSelectComponent } from '../../shared/split-trigger-select/split-trigger-select.component';

@Component({
  selector: 'ws-timer-stopwatch-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitTriggerSelectComponent],
  template: `
    <ws-split-trigger-select
      label="Start Timer Trigger"
      [(triggerType)]="startTriggerType"
      [(geofenceId)]="startGeofenceId"
    />
    <ws-split-trigger-select
      label="Stop Timer Trigger"
      [(triggerType)]="stopTriggerType"
      [(geofenceId)]="stopGeofenceId"
    />
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  `,
})
export class TimerStopwatchSettingsComponent {
  readonly startTriggerType = model<string | undefined>(undefined);
  readonly startGeofenceId = model<string | undefined>(undefined);
  readonly stopTriggerType = model<string | undefined>(undefined);
  readonly stopGeofenceId = model<string | undefined>(undefined);
}
