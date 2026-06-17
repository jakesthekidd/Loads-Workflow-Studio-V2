import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

const TRIGGER_OPTIONS = [{ label: 'Geofence Trigger', value: 'geofence' }];

@Component({
  selector: 'ws-generate-push-alert-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, SelectModule],
  template: `
    <div class="field">
      <label class="field__label">Push Alert Text</label>
      <input pInputText [(ngModel)]="pushAlertText" placeholder="Push alert message" class="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Trigger</label>
      <p-select [(ngModel)]="trigger" [options]="triggerOptions" optionLabel="label" optionValue="value" placeholder="Geofence Trigger + Unset" styleClass="w-full" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class GeneratePushAlertSettingsComponent {
  readonly pushAlertText = model<string>('');
  readonly trigger = model<'geofence' | undefined>(undefined);
  protected readonly triggerOptions = TRIGGER_OPTIONS;
}
