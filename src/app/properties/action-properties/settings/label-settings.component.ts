import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'ws-label-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule],
  template: `
    <div class="field">
      <label class="field__label">Heading Text</label>
      <input pInputText [(ngModel)]="headingText" placeholder="What Dose The Text Say" class="field__input" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { width: 100%; font-size: 14px; }
  `,
})
export class LabelSettingsComponent {
  readonly headingText = model<string>('');
}
