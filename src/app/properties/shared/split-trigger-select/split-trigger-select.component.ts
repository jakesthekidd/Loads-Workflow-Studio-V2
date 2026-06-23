import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

const TRIGGER_TYPE_OPTIONS = [{ label: 'Geofence Trigger', value: 'geofence' }];

@Component({
  selector: 'ws-split-trigger-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule],
  template: `
    <div class="split-field">
      <label class="split-field__label">{{ label() }}</label>
      <div class="split-field__controls">
        <p-select
          [(ngModel)]="triggerType"
          [options]="triggerTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Geofence trigger"
          styleClass="split-field__type"
        />
        <p-select
          [(ngModel)]="geofenceId"
          [options]="[]"
          placeholder="Select Geofence"
          styleClass="split-field__value"
        />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; width: 100%; }
    .split-field { display: flex; flex-direction: column; gap: 4px; }
    .split-field__label {
      font-size: 12px;
      font-family: Roboto, sans-serif;
      color: #000;
      font-weight: 300;
    }
    .split-field__controls { display: flex; width: 100%; }

    :host ::ng-deep .split-field__type .p-select {
      background: #eff2f4;
      border: 1px solid #e2e6eb;
      border-radius: 4px 0 0 4px;
      min-width: 0;
      flex: 1;
    }
    :host ::ng-deep .split-field__value .p-select {
      background: white;
      border: 1px solid #e2e6eb;
      border-left: none;
      border-radius: 0 4px 4px 0;
      min-width: 0;
      flex: 1;
    }
  `,
})
export class SplitTriggerSelectComponent {
  readonly label = input.required<string>();
  readonly triggerType = model<string | undefined>(undefined);
  readonly geofenceId = model<string | undefined>(undefined);

  protected readonly triggerTypeOptions = TRIGGER_TYPE_OPTIONS;
}
