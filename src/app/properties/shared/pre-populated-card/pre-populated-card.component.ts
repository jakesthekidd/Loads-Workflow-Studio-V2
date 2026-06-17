import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PropertyToggleRowComponent } from '../property-toggle-row/property-toggle-row.component';

const RECIPIENT_TYPES = [
  { label: 'JSON', value: 'json' },
  { label: 'Static', value: 'static' },
];

@Component({
  selector: 'ws-pre-populated-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ToggleSwitchModule, SelectModule, PropertyToggleRowComponent],
  template: `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Pre-Populated</span>
        <p-toggleswitch [(ngModel)]="enabled" />
      </div>
      @if (enabled()) {
        <div class="card__body">
          <div class="split-input">
            <p-select
              [(ngModel)]="recipientType"
              [options]="recipientTypes"
              optionLabel="label"
              optionValue="value"
              styleClass="split-input__type"
            />
            <p-select
              [(ngModel)]="recipientValue"
              [options]="[]"
              placeholder="Value"
              styleClass="split-input__value"
              [editable]="true"
            />
          </div>
          <div class="sub-toggles">
            <ws-property-toggle-row label="Read Only" [(value)]="readOnly" />
            @if (readOnly()) {
              <ws-property-toggle-row
                label="Editable if NULL"
                [(value)]="editableIfNull"
                class="indent"
              />
              <ws-property-toggle-row
                label="Visible"
                [(value)]="subVisible"
                class="indent"
              />
            }
          </div>
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
      gap: 12px;
      padding: 16px 8px;
    }
    .split-input {
      display: flex;
      width: 100%;
    }
    :host ::ng-deep .split-input__type .p-select {
      border-radius: 4px 0 0 4px;
      min-width: 90px;
    }
    :host ::ng-deep .split-input__value .p-select {
      border-radius: 0 4px 4px 0;
      flex: 1;
      border-left: none;
    }
    .sub-toggles {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .indent {
      padding-left: 16px;
    }
  `,
})
export class PrePopulatedCardComponent {
  readonly enabled = model<boolean>(false);
  readonly recipientType = model<'json' | 'static'>('json');
  readonly recipientValue = model<string>('');
  readonly readOnly = model<boolean>(false);
  readonly editableIfNull = model<boolean>(false);
  readonly subVisible = model<boolean>(false);

  protected readonly recipientTypes = RECIPIENT_TYPES;
}
