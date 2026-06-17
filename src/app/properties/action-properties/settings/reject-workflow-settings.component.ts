import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

const BUTTON_TYPES = [{ label: 'Simple Button', value: 'simple' }];

@Component({
  selector: 'ws-reject-workflow-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, SelectModule],
  template: `
    <div class="field">
      <label class="field__label">Decline Work Flow Button Text</label>
      <input pInputText [(ngModel)]="buttonText" placeholder="Swipe to decline workflow" class="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Button Type</label>
      <p-select [(ngModel)]="buttonType" [options]="buttonTypes" optionLabel="label" optionValue="value" styleClass="w-full" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class RejectWorkflowSettingsComponent {
  readonly buttonText = model<string>('Swipe to decline workflow');
  readonly buttonType = model<'simple'>('simple');
  protected readonly buttonTypes = BUTTON_TYPES;
}
