import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PreviewStepState } from './preview-runtime.service';

/** Display-only extension — 'notDone' is not a runtime state, just a visual one. */
export type IconState = PreviewStepState | 'notDone';

@Component({
  selector: 'ws-preview-status-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="icon icon--{{ state() }}">
      @switch (state()) {
        @case ('active')  { <span class="icon__dot"></span> }
        @case ('done')    { <i class="pi pi-check"></i> }
        @case ('locked')  { <i class="pi pi-lock"></i> }
        @case ('blocked') { <i class="pi pi-exclamation"></i> }
        <!-- notDone and hidden: gray ring, nothing inside -->
      }
    </div>
  `,
  styles: `
    :host { display: contents; }

    .icon {
      width: 21px;
      height: 21px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      /* default (notDone): white fill + gray ring */
      background: #fff;
      border: 1.5px solid #A9B3C2;
    }

    /* active: white + blue 2px ring + blue center dot */
    .icon--active {
      border: 2px solid #2474BB;
    }
    .icon__dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #2474BB;
    }

    /* done: solid blue fill + white checkmark */
    .icon--done {
      background: #2474BB;
      border-color: transparent;
      color: #fff;
      font-size: 11px;
    }

    /* locked: white + gray ring + gray lock icon */
    .icon--locked {
      color: #A9B3C2;
      font-size: 10px;
    }

    /* blocked: orange-tinted fill + orange warning icon */
    .icon--blocked {
      background: #FFE8BF;
      border-color: transparent;
      color: #FFA300;
      font-size: 12px;
    }
  `,
})
export class PreviewStatusIcon {
  readonly state = input.required<IconState>();
}
