import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { PropertyToggleRowComponent } from '../../shared/property-toggle-row/property-toggle-row.component';

const TRIGGER_OPTIONS = [{ label: 'Geofence Trigger', value: 'geofence' }];

@Component({
  selector: 'ws-generate-email-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TextareaModule,
    PropertyToggleRowComponent,
  ],
  template: `
    <ws-property-toggle-row label="Pre-Populate" [(value)]="prePopulate" />
    <div class="field">
      <label class="field__label">Trigger</label>
      <p-select [(ngModel)]="trigger" [options]="triggerOptions" optionLabel="label" optionValue="value" placeholder="Geofence Trigger + Unset" styleClass="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Email Recipient — Type</label>
      <p-select [(ngModel)]="recipientType" [options]="recipientTypes" optionLabel="label" optionValue="value" styleClass="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Email Recipient — Value</label>
      <input pInputText [(ngModel)]="recipientValue" placeholder="Value" class="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Subject</label>
      <input pInputText [(ngModel)]="subject" placeholder="Subject line" class="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Select Actions to Send</label>
      <p-multiselect [(ngModel)]="selectedActionIds" [options]="[]" placeholder="Select actions" styleClass="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Additional Body Message</label>
      <textarea pTextarea [(ngModel)]="additionalBody" placeholder="Optional body text" class="w-full" rows="3"></textarea>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class GenerateEmailSettingsComponent {
  readonly prePopulate = model<boolean>(false);
  readonly trigger = model<'geofence' | undefined>(undefined);
  readonly recipientType = model<'json' | 'static'>('json');
  readonly recipientValue = model<string>('');
  readonly subject = model<string>('');
  readonly selectedActionIds = model<string[]>([]);
  readonly additionalBody = model<string>('');

  protected readonly triggerOptions = TRIGGER_OPTIONS;
  protected readonly recipientTypes = [
    { label: 'JSON', value: 'json' },
    { label: 'Static', value: 'static' },
  ];
}
