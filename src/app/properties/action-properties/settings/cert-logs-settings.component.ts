import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'ws-cert-logs-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule],
  template: `
    <div class="field">
      <label class="field__label">Title Label</label>
      <input pInputText [(ngModel)]="titleLabel" placeholder="Label Text" class="w-full" />
    </div>
    <div class="field">
      <label class="field__label">Body Text Label</label>
      <input pInputText [(ngModel)]="bodyTextLabel" placeholder="Label Text" class="w-full" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .w-full { width: 100%; }
  `,
})
export class CertLogsSettingsComponent {
  readonly titleLabel = model<string>('');
  readonly bodyTextLabel = model<string>('');
}
