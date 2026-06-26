import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Segment } from '@app/models';
import { PreviewRuntime, type PreviewStepState } from './preview-runtime.service';
import { type IconState, PreviewStatusIcon } from './preview-status-icon';
import { PreviewStep } from './preview-step';

interface StepRow {
  step: import('@app/models').Step;
  isFirst: boolean;
  prevDone: boolean;
}

@Component({
  selector: 'ws-preview-segment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpperCasePipe, PreviewStatusIcon, PreviewStep],
  template: `
    <div class="seg" [class.seg--active]="segmentStatus() === 'active'">

      <!-- ── Sticky section header ─────────────────────────────────────── -->
      <button
        class="seg__header"
        type="button"
        (click)="expanded.update(v => !v)"
        [attr.aria-expanded]="expanded()"
      >
        <ws-preview-status-icon [state]="segmentStatus()" />
        <span class="seg__label">{{ segment().label | uppercase }}</span>
        <span class="seg__count">{{ doneCount() }}/{{ visibleRows().length }}</span>
        <span class="seg__chevron-wrap" [class.seg__chevron-wrap--open]="expanded()">
          <i class="pi pi-chevron-right seg__chevron"></i>
        </span>
      </button>

      <!-- ── Collapsible step list ─────────────────────────────────────── -->
      @if (expanded()) {
        <div class="seg__steps">
          @for (row of visibleRows(); track row.step.id) {
            <ws-preview-step
              [step]="row.step"
              [isFirst]="row.isFirst"
              [prevDone]="row.prevDone"
            />
          }
        </div>
      }

    </div>
  `,
  styles: `
    :host { display: block; }

    /* Flat section wrapper — no card, no overflow:hidden (breaks sticky) */
    .seg {
      display: flex;
      flex-direction: column;
    }

    /* Full-width sticky section header */
    .seg__header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      background: #fff;
      border: none;
      border-bottom: 1px solid #E2E6EB;
      border-left: 3px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: border-color 200ms ease-in-out;
    }

    /* Active segment: blue left accent */
    .seg--active .seg__header {
      border-left-color: #2474BB;
      background: #fff;
    }

    .seg__label {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: #3D3D3D;
      letter-spacing: 0.04em;
    }

    .seg__count {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.4);
      font-weight: 500;
    }

    .seg__chevron-wrap {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #F3F5F7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 260ms ease-in-out;
    }
    .seg__chevron-wrap--open {
      background: #E3F5FD;
    }

    .seg__chevron {
      font-size: 10px;
      color: #3D3D3D;
      transition: transform 260ms ease-in-out;
    }
    .seg__chevron-wrap--open .seg__chevron {
      transform: rotate(90deg);
    }

    /* Step list sits on the gray content background */
    .seg__steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #F3F5F7;
    }
  `,
})
export class PreviewSegment {
  readonly segment = input.required<Segment>();

  protected readonly runtime = inject(PreviewRuntime);
  protected readonly expanded = signal(true);

  protected readonly visibleRows = computed<StepRow[]>(() => {
    const steps = this.segment().steps;
    const rows: StepRow[] = [];
    let prevStepDone = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (this.runtime.isHidden(step.condition)) continue;

      const isFirst = rows.length === 0;
      rows.push({ step, isFirst, prevDone: isFirst ? true : prevStepDone });
      prevStepDone = this.runtime.isDone(step.id);
    }
    return rows;
  });

  protected readonly doneCount = computed(() =>
    this.visibleRows().filter(r => this.runtime.isDone(r.step.id)).length,
  );

  protected readonly hasActiveStep = computed(() =>
    this.visibleRows().some(r => {
      const state = this.runtime.stepState(r.step, r.isFirst, r.prevDone);
      return state === 'active' || state === 'blocked';
    }),
  );

  protected readonly segmentStatus = computed<IconState>(() => {
    if (this.hasActiveStep()) return 'active';
    const rows = this.visibleRows();
    if (rows.length > 0 && this.doneCount() === rows.length) return 'done';
    return 'locked';
  });
}
