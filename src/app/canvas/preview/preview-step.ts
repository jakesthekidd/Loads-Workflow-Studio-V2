import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RequirementLevel, Step } from '@app/models';
import { PreviewAction } from './preview-action';
import { PreviewRuntime, PreviewStepState } from './preview-runtime.service';
import { PreviewStatusIcon } from './preview-status-icon';

@Component({
  selector: 'ws-preview-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviewAction, PreviewStatusIcon],
  template: `
    <div class="ps ps--{{ state() }}" [class.ps--expanded]="expanded()">

      <!-- ── Header row ───────────────────────────────────────────────── -->
      <button
        class="ps__header"
        type="button"
        [disabled]="state() === 'locked' || state() === 'done'"
        (click)="toggleExpand()"
        [attr.aria-expanded]="expanded()"
      >
        <ws-preview-status-icon [state]="displayState()" />

        <span class="ps__label">{{ step().label }}</span>

        @if (step().requirement === RequirementLevel.Optional) {
          <span class="ps__optional-badge">OPTIONAL</span>
        }

        @if (state() !== 'locked') {
          <i class="pi pi-chevron-right ps__chevron" [class.ps__chevron--open]="expanded()"></i>
        }
      </button>

      <!-- ── Expanded body ────────────────────────────────────────────── -->
      @if (expanded() && state() !== 'locked') {
        <div class="ps__body">

          <!-- Blocked banner -->
          @if (state() === 'blocked') {
            <div class="ps__blocked-banner">
              <i class="pi pi-exclamation-triangle"></i>
              {{ blockerMessage() }}
            </div>
          }

          <!-- Validation error banner (shown after a failed submit) -->
          @if (submitFailed()) {
            <div class="ps__error-banner">
              <i class="pi pi-times-circle"></i>
              Complete all required Actions to submit this step.
            </div>
          }

          <!-- Action renderers -->
          <div class="ps__actions">
            @for (action of visibleActions(); track action.id) {
              <ws-preview-action [action]="action" />
            }
          </div>

          <!-- Submit button — only for active steps -->
          @if (state() === 'active') {
            <div class="ps__footer">
              <button class="ps__submit" type="button" (click)="submit()">Submit</button>
            </div>
          }

        </div>
      }

    </div>
  `,
  styles: `
    :host { display: block; }

    .ps {
      border-radius: 7px;
      border: 1px solid #E2E6EB;
      background: #fff;
      overflow: hidden;
    }

    /* Active + expanded: cyan 2px border + drop shadow */
    .ps--active.ps--expanded {
      border: 2px solid #AAE1F8;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
    }

    .ps__header {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 200ms ease-in-out;
    }
    .ps__header:disabled { cursor: default; }

    /* Cyan header tint when active and expanded */
    .ps--active.ps--expanded .ps__header {
      background: rgba(227, 245, 253, 0.5);
    }

    .ps__label {
      flex: 1;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #3D3D3D;
    }

    .ps--locked .ps__label {
      color: rgba(0, 0, 0, 0.5);
    }

    .ps__optional-badge {
      font-size: 10px;
      font-weight: 500;
      color: #5A626F;
      background: #EFF2F4;
      padding: 2px 8px;
      border-radius: 17px;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .ps__chevron {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
      transition: transform 260ms ease-in-out;
    }
    .ps__chevron--open {
      transform: rotate(90deg);
    }

    /* Locked state: dimmed */
    .ps--locked { opacity: 0.5; }

    /* Expanded body */
    .ps__body {
      background: #F7F8F9;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Blocked / error banners */
    .ps__blocked-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: #FFF3CD;
      border: 1px solid #FFD97A;
      border-radius: 6px;
      font-size: 12px;
      color: #7A4F00;
    }
    .ps__blocked-banner i { color: #FFA300; font-size: 13px; }

    .ps__error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      font-size: 12px;
      color: #991b1b;
    }
    .ps__error-banner i { color: #ef4444; font-size: 13px; }

    /* Action list */
    .ps__actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Submit button — outlined cyan style matching Flutter OutlinedButton */
    .ps__footer { margin-top: 4px; }

    .ps__submit {
      width: 100%;
      height: 44px;
      border-radius: 4px;
      background: #E3F5FD;
      border: 1px solid #AAE1F8;
      color: #12395C;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      letter-spacing: 0.02em;
    }
    .ps__submit:hover { background: #d0eefb; }
    .ps__submit:active { background: #bee8f9; }
  `,
})
export class PreviewStep {
  readonly step = input.required<Step>();
  readonly isFirst = input<boolean>(false);
  readonly prevDone = input<boolean>(true);

  protected readonly RequirementLevel = RequirementLevel;
  protected readonly runtime = inject(PreviewRuntime);

  protected readonly state = computed<PreviewStepState>(() =>
    this.runtime.stepState(this.step(), this.isFirst(), this.prevDone()),
  );

  /** Visual-only: active steps show gray ring until the user opens them. */
  protected readonly displayState = computed(() => {
    const s = this.state();
    return s === 'active' && !this.expanded() ? 'notDone' : s;
  });

  protected readonly expanded = signal(true);
  protected readonly submitFailed = signal(false);

  protected readonly visibleActions = computed(() =>
    this.step().actions.filter(a => !this.runtime.isHidden(a.config.condition)),
  );

  protected readonly blockerMessage = computed(() =>
    this.step().blocker?.message ?? 'This step is currently blocked.',
  );

  protected toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  protected submit(): void {
    const ok = this.runtime.submitStep(this.step());
    this.submitFailed.set(!ok);
    if (ok) this.expanded.set(false);
  }
}
