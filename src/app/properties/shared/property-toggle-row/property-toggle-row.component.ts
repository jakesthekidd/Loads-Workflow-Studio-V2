import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'ws-property-toggle-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ToggleSwitchModule],
  template: `
    <div class="toggle-row">
      <span class="toggle-row__label">{{ label() }}</span>
      <p-toggleswitch [(ngModel)]="value" />
    </div>
  `,
  styles: `
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .toggle-row__label {
      font-size: 14px;
      color: var(--p-surface-900, #282e38);
      font-family: Roboto, sans-serif;
    }
  `,
})
export class PropertyToggleRowComponent {
  readonly label = input.required<string>();
  readonly value = model<boolean>(false);
}
