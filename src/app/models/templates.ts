/**
 * Workflow Studio — templates.
 *
 * Creating a Step is ALWAYS one of: pick a pre-built **Step template** from the
 * toolbar's "Template Steps" picker, or start from a **blank step**. Templates
 * come in two origins: `system` (shipped catalog, e.g. "Begin Load", "Arrive at
 * Shipper") and `user` (the picker's "Created By you" — saved by the admin/org).
 *
 * A template is a reusable **blueprint** for a Step (and its Actions) minus the
 * identity/placement fields, which are assigned when the template is
 * instantiated into a specific Segment.
 *
 * NOTE: the components picker also shows a "Template actions" group (pre-built
 * components like "Pick Up Address", "Logo Image", "Help Link"). That implies an
 * analogous component/action template. It is intentionally NOT modeled yet — we
 * model Step templates now (a confirmed always-present concept) and leave the
 * parallel `ActionTemplate` to a later phase. See docs/data-model.md §6b.
 */

import { Action, Step } from './entities';

/** An Action as it lives in a template — no identity/placement yet. */
export type ActionBlueprint = Omit<Action, 'id' | 'stepId' | 'sortIndex'>;

/** A Step as it lives in a template — no identity/placement, blueprinted actions. */
export type StepBlueprint = Omit<Step, 'id' | 'segmentId' | 'sortIndex' | 'actions'> & {
  readonly actions: readonly ActionBlueprint[];
};

/** Where a Step template came from. */
export type TemplateOrigin = 'system' | 'user';

/**
 * A pre-built Step offered by the "Template Steps" picker. Served by the
 * (mock) API like the action-type catalog. Instantiating one seeds a new Step
 * in the target Segment from {@link blueprint}.
 */
export interface StepTemplate {
  readonly id: string;
  /** Display name, e.g. "Begin Load", "Arrive at Shipper". */
  readonly name: string;
  /** Picker grouping, e.g. "Stops (Loads)", "Created By you". */
  readonly category: string;
  readonly description?: string;
  readonly origin: TemplateOrigin;
  /** The Step this template produces (identity/placement assigned on insert). */
  readonly blueprint: StepBlueprint;
}
