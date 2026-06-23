import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ws-segmented-button-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg">
      @for (opt of options(); track opt) {
        <button
          class="seg__btn"
          type="button"
          [class.seg__btn--active]="value() === opt"
          (click)="value.set(opt)"
        >{{ opt }}</button>
      }
    </div>
  `,
  styles: `
    .seg {
      display: flex;
      background: #f6f9fc;
      border-radius: 6px;
      padding: 4px;
      gap: 2px;
      width: 100%;
    }
    .seg__btn {
      flex: 1;
      height: 28px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-family: Roboto, sans-serif;
      cursor: pointer;
      background: transparent;
      color: #8d9aae;
      font-weight: 400;
      transition: background 120ms, color 120ms, box-shadow 120ms;
      white-space: nowrap;
    }
    .seg__btn--active {
      background: #2474bb;
      color: white;
      font-weight: 900;
      box-shadow: 0 1px 4px rgba(36, 116, 187, 0.28);
    }
  `,
})
export class SegmentedButtonGroupComponent {
  readonly options = input.required<string[]>();
  readonly value = model<string>('');
}
