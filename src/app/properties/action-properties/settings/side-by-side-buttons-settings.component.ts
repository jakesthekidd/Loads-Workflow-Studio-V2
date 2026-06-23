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
  selector: 'ws-side-by-side-buttons-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, SelectModule],
  template: `
    <div class="btn-section">
      <span class="btn-section__label">Button 1</span>
      <div class="field">
        <label class="field__label">ButtonText</label>
        <input pInputText [(ngModel)]="button1Text" placeholder="What Dose The Button Say" class="field__input" />
      </div>
      <div class="field">
        <label class="field__label">Button Action</label>
        <p-select
          [(ngModel)]="button1Action"
          [options]="actionOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="What Dose The Button Do?"
          styleClass="w-full"
        />
      </div>
    </div>

    <div class="btn-section">
      <span class="btn-section__label">Button 2</span>
      <div class="field">
        <label class="field__label">ButtonText</label>
        <input pInputText [(ngModel)]="button2Text" placeholder="What Dose The Button Say" class="field__input" />
      </div>
      <div class="field">
        <label class="field__label">Button Action</label>
        <p-select
          [(ngModel)]="button2Action"
          [options]="actionOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="What Dose The Button Do?"
          styleClass="w-full"
        />
      </div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .btn-section { display: flex; flex-direction: column; gap: 10px; }
    .btn-section__label {
      font-size: 13px;
      font-weight: 600;
      font-family: Roboto, sans-serif;
      color: #37404c;
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
    .w-full { width: 100%; }
  `,
})
export class SideBySideButtonsSettingsComponent {
  readonly button1Text = model<string>('');
  readonly button1Action = model<string | undefined>(undefined);
  readonly button2Text = model<string>('');
  readonly button2Action = model<string | undefined>(undefined);

  protected readonly actionOptions = BUTTON_ACTION_OPTIONS;
}
