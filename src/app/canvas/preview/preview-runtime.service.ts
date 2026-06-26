import { computed, Injectable, signal } from '@angular/core';
import { Action, BlockingCondition, ConditionGroup, OrderEnforcement, Segment, Step } from '@app/models';
import { evaluateConditionGroup, RuntimeValues } from './evaluate-condition';

export type PreviewStepState = 'hidden' | 'notDone' | 'locked' | 'blocked' | 'active' | 'done';

/**
 * Ephemeral preview runtime — provided at the PreviewShell component level,
 * not at root. Tracks form values, step submission, and done state. All state
 * is signals so derived computeds in child components stay reactive.
 */
@Injectable()
export class PreviewRuntime {
  private readonly _values  = signal<Map<string, unknown>>(new Map());
  private readonly _done    = signal<Set<string>>(new Set());
  private readonly _submitted = signal<Set<string>>(new Set());

  /** Expose as a computed so callers can track it inside their own computeds. */
  readonly values = computed<RuntimeValues>(() => this._values());

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
   * Mark the step as submitted, validate required fields, and advance to done
   * if all required fields are filled. Returns true when the step passes.
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
    }
    return allFilled;
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
   * Compute the visual state for a step.
   *  - hidden   → show/hide condition is not met
   *  - done     → already submitted successfully
   *  - locked   → enforced-order and previous step is not done
   *  - blocked  → explicit blocker condition not yet cleared
   *  - active   → available to interact with
   */
  stepState(step: Step, isFirst: boolean, prevDone: boolean): PreviewStepState {
    if (this.isHidden(step.condition)) return 'hidden';
    if (this.isDone(step.id)) return 'done';
    if (step.orderEnforcement === OrderEnforcement.Enforced && !isFirst && !prevDone) return 'locked';
    if (this.isBlocked(step.blocker)) return 'blocked';
    return 'active';
  }

  // ---- lifecycle -----------------------------------------------------------

  /** Seed done state from steps that have runtimeState='completed' in the model. */
  initFromSegments(segments: readonly Segment[]): void {
    const done = new Set<string>();
    for (const seg of segments) {
      for (const step of seg.steps) {
        if (step.runtimeState === 'completed') done.add(step.id);
      }
    }
    this._done.set(done);
  }

  reset(): void {
    this._values.set(new Map());
    this._done.set(new Set());
    this._submitted.set(new Set());
  }
}
