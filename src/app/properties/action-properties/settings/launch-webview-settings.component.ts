import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

const BUTTON_ACTION_OPTIONS = [{ label: 'Launch Web View', value: 'launch-webview' }];

@Component({
  selector: 'ws-launch-webview-settings',
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
        [(ngModel)]="buttonActionDisplay"
        [options]="actionOptions"
        optionLabel="label"
        optionValue="value"
        [disabled]="true"
        styleClass="w-full"
      />
    </div>
    <div class="field">
      <label class="field__label">Hyper Link</label>
      <input pInputText [(ngModel)]="hyperLink" placeholder="www.transflo.com" class="field__input" />
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
export class LaunchWebviewSettingsComponent {
  readonly buttonText = model<string>('');
  readonly hyperLink = model<string>('');

  protected readonly buttonActionDisplay = 'launch-webview';
  protected readonly actionOptions = BUTTON_ACTION_OPTIONS;
}
