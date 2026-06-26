import { computed, Injectable, signal } from '@angular/core';
import { Action, BlockingCondition, ConditionGroup, OrderEnforcement, Segment, Step } from '@app/models';
import { evaluateConditionGroup, RuntimeValues } from './evaluate-condition';

export type PreviewStepState = 'hidden' | 'locked' | 'blocked' | 'active' | 'done';

/**
 * Ephemeral preview runtime — provided at PreviewShell level (not root).
 *
 * Tracks form values, submission state, and exactly ONE active step at a time.
 * Submitting a step marks it done and advances activeStepId to the next
 * available step across all segments automatically.
 */
@Injectable()
export class PreviewRuntime {
  private readonly _values      = signal<Map<string, unknown>>(new Map());
  private readonly _done        = signal<Set<string>>(new Set());
  private readonly _submitted   = signal<Set<string>>(new Set());
  private readonly _activeStepId = signal<string | null>(null);
  private _segments: readonly Segment[] = [];

  readonly values       = computed<RuntimeValues>(() => this._values());
  /** The ID of the one step currently focused/open. Drives expand state in PreviewStep. */
  readonly activeStepId = this._activeStepId.asReadonly();

  // ---- value access --------------------------------------------------------

  setValue(actionId: string, value: unknown): void {
    this._values.update(m => new Map(m).set(actionId, value));
  }

  getValue(actionId: string): unknown {
    return this._values().get(actionId);
  }

  // ---- step lifecycle ------------------------------------------------------

  isDone(stepId: string): boolean {
    return this._done().has(stepId);
  }

  isSubmitted(stepId: string): boolean {
    return this._submitted().has(stepId);
  }

  /**
   * Validate and submit. On success marks it done and advances activeStepId
   * to the next available step. Returns true when the step passes validation.
   */
  submitStep(step: Step): boolean {
    this._submitted.update(s => new Set(s).add(step.id));
    const allFilled = step.actions.every(a => {
      if (!a.config.required) return true;
      const val = this._values().get(a.id);
      return val !== undefined && val !== null && val !== '' &&
        !(Array.isArray(val) && val.length === 0);
    });
    if (allFilled) {
      this._done.update(s => new Set(s).add(step.id));
      this._advanceActiveStep(step.id);
    }
    return allFilled;
  }

  /** Manually set the focused step (used when tapping a notDone step in unenforced mode). */
  setActiveStep(stepId: string | null): void {
    this._activeStepId.set(stepId);
  }

  /** True when the step was submitted AND a required field on this action is empty. */
  isFieldError(action: Action): boolean {
    if (!this._submitted().has(action.stepId)) return false;
    if (!action.config.required) return false;
    const val = this._values().get(action.id);
    return val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0);
  }

  // ---- condition helpers ---------------------------------------------------

  isHidden(group: ConditionGroup | undefined): boolean {
    return !!group?.enabled && !evaluateConditionGroup(group, this._values());
  }

  isBlocked(blocker: BlockingCondition | undefined): boolean {
    if (!blocker?.enabled) return false;
    return !evaluateConditionGroup(blocker.condition, this._values());
  }

  // ---- state machine -------------------------------------------------------

  /**
   * Runtime state for a step:
   *  hidden  → show/hide condition not met
   *  done    → submitted successfully
   *  locked  → enforced-order and previous step not done
   *  blocked → blocker condition not cleared (visible but submit disabled)
   *  active  → available to interact with
   */
  stepState(step: Step, isFirst: boolean, prevDone: boolean): PreviewStepState {
    if (this.isHidden(step.condition)) return 'hidden';
    if (this.isDone(step.id)) return 'done';
    if (step.orderEnforcement === OrderEnforcement.Enforced && !isFirst && !prevDone) return 'locked';
    if (this.isBlocked(step.blocker)) return 'blocked';
    return 'active';
  }

  // ---- lifecycle -----------------------------------------------------------

  /** Seed done state and set activeStepId to the first non-done available step. */
  initFromSegments(segments: readonly Segment[]): void {
    this._segments = segments;
    const done = new Set<string>();
    for (const seg of segments) {
      for (const step of seg.steps) {
        if (step.runtimeState === 'completed') done.add(step.id);
      }
    }
    this._done.set(done);
    this._activeStepId.set(this._findFirstActiveStep());
  }

  reset(): void {
    this._values.set(new Map());
    this._done.set(new Set());
    this._submitted.set(new Set());
    this._activeStepId.set(this._findFirstActiveStep());
  }

  // ---- private helpers -----------------------------------------------------

  private _findFirstActiveStep(): string | null {
    for (const seg of this._segments) {
      let firstInSeg = true;
      let prevDone = true;
      for (const step of seg.steps) {
        if (this.isHidden(step.condition)) continue;
        const state = this.stepState(step, firstInSeg, prevDone);
        firstInSeg = false;
        prevDone = this.isDone(step.id);
        if (state === 'active' || state === 'blocked') return step.id;
      }
    }
    return null;
  }

  /**
   * After marking completedStepId done, rebuild the ordered step list with
   * updated done state so locks re-evaluate, then pick the next active step.
   */
  private _advanceActiveStep(completedStepId: string): void {
    const ordered: Array<{ step: Step; state: PreviewStepState }> = [];

    for (const seg of this._segments) {
      let firstInSeg = true;
      let prevDone = true;
      for (const step of seg.steps) {
        if (this.isHidden(step.condition)) continue;
        const state = this.stepState(step, firstInSeg, prevDone);
        firstInSeg = false;
        prevDone = this.isDone(step.id);
        ordered.push({ step, state });
      }
    }

    const idx = ordered.findIndex(x => x.step.id === completedStepId);
    if (idx === -1) return;

    for (let i = idx + 1; i < ordered.length; i++) {
      const { step, state } = ordered[i];
      if (state === 'active' || state === 'blocked') {
        this._activeStepId.set(step.id);
        return;
      }
    }

    this._activeStepId.set(null); // workflow complete
  }
}
