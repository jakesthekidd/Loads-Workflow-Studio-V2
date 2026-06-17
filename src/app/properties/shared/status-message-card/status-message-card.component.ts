import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

export interface StatusMessageOption {
  label: string;
  value: string;
}

@Component({
  selector: 'ws-status-message-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ToggleSwitchModule, MultiSelectModule],
  template: `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Status Message</span>
        <p-toggleswitch [(ngModel)]="enabled" />
      </div>
      @if (enabled()) {
        <div class="card__body">
          <label class="card__label">Select Status Message</label>
          <p-multiselect
            [(ngModel)]="selectedMessages"
            [options]="options()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Status Message"
            styleClass="w-full"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .card {
      border: 1px solid var(--p-surface-border, #e2e6eb);
      border-radius: 8px;
      background: white;
      width: 100%;
    }
    .card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      background: var(--p-surface-hover, #f6f9fc);
      border-bottom: 1px solid var(--p-surface-border, #e2e6eb);
      border-radius: 8px 8px 0 0;
    }
    .card__title {
      font-size: 16px;
      font-weight: 500;
      font-family: Roboto, sans-serif;
      color: var(--p-surface-900, #282e38);
    }
    .card__body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px 8px;
    }
    .card__label {
      font-size: 14px;
      color: var(--p-surface-600, #a9b3c2);
      font-family: Roboto, sans-serif;
    }
  `,
})
export class StatusMessageCardComponent {
  readonly enabled = model<boolean>(false);
  readonly selectedMessages = model<string[]>([]);
  readonly options = model<StatusMessageOption[]>([]);
}
