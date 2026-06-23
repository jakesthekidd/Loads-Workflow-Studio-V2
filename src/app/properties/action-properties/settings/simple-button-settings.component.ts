import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

const BUTTON_ACTION_OPTIONS = [
  { label: 'Submit', value: 'submit' },
  { label: 'Next Step', value: 'next-step' },
  { label: 'Launch Web View', value: 'launch-webview' },
  { label: 'Custom', value: 'custom' },
];

@Component({
  selector: 'ws-simple-button-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, SelectModule],
  template: `
    <div class="field">
      <label class="field__label">ButtonText</label>
      <input pInputText [(ngModel)]="buttonText" placeholder="What Dose The Button Say" class="field__input" />
    </div>
    <div class="field">
      <label class="field__label">Button Action</label>
      <p-select
        [(ngModel)]="buttonAction"
        [options]="actionOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="What Dose The Button Do?"
        styleClass="w-full"
      />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
    .w-full { width: 100%; }
  `,
})
export class SimpleButtonSettingsComponent {
  readonly buttonText = model<string>('');
  readonly buttonAction = model<string | undefined>(undefined);

  protected readonly actionOptions = BUTTON_ACTION_OPTIONS;
}
