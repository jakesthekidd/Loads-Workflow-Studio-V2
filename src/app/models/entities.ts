/**
 * Workflow Studio — the domain hierarchy.
 *
 *   Workflow ─┬─ Segment ─┬─ Step ─┬─ Action
 *             │           │        └─ ...
 *             │           └─ ...
 *             └─ ...
 *
 * Strict containment: a Segment belongs to exactly one Workflow, a Step to one
 * Segment, an Action to one Step. Children are stored inline (nested) so a
 * Workflow is a self-contained graph; the canvas derives its node tree from it.
 */

import { ActionConfig } from './action-config';
import { ActionType } from './action-type';
import {
  NodeRuntimeState,
  OrderEnforcement,
  RequirementLevel,
  WorkflowStatus,
} from './enums';

/** ISO-8601 timestamp string (e.g. "2026-06-15T13:00:00Z"). */
export type IsoDateString = string;

/** Created/updated audit trail attached to a Workflow. */
export interface AuditMetadata {
  readonly createdAt: IsoDateString;
  readonly createdBy: string;
  readonly updatedAt: IsoDateString;
  readonly updatedBy: string;
}

/** Lightweight reference to a Fleet a Workflow is associated with. */
export interface FleetRef {
  readonly id: string;
  readonly name: string;
}

/**
 * A completion condition. Phase 1 models it only as an opaque, identifiable
 * record; the expression language / evaluation is a later phase.
 */
export interface CompletionCondition {
  readonly id: string;
  readonly description?: string;
  // TODO (Phase N): typed condition expression (operands, operators, references).
}

/**
 * A blocker gates a node until cleared. Modeled as data in Phase 1.
 * OUT OF SCOPE: a blocker on an unenforced-order Step — do not build that path.
 */
export interface Blocker {
  readonly id: string;
  readonly message: string;
  // TODO (Phase N): clearing condition.
}

/** 2D position on the canvas (set by @foblex/flow drag interactions). */
export interface FlowPosition {
  readonly x: number;
  readonly y: number;
}

/** Fields shared by ordered, stateful nodes (Segment & Step). */
export interface OrderedNode {
  /** Required vs Optional. */
  readonly requirement: RequirementLevel;
  /**
   * Per-node ordering. The container's own default lives on its parent; this
   * value lets a single child opt into Enforced/Unenforced independently,
   * which is how mixed-order containers are represented.
   */
  readonly orderEnforcement: OrderEnforcement;
  /** Zero-based position among siblings (authoring order / enforced sequence). */
  readonly sortIndex: number;
  readonly completionConditions: readonly CompletionCondition[];
  readonly statusMessage?: string;
  /** Runtime state — DATA ONLY in Phase 1 (see {@link NodeRuntimeState}). */
  readonly runtimeState?: NodeRuntimeState;
  /** Canvas layout. Optional: not all consumers position nodes. */
  readonly position?: FlowPosition;
}

/** The atomic executable inside a Step. */
export interface Action {
  readonly id: string;
  readonly stepId: string;
  readonly label: string;
  readonly sortIndex: number;
  /**
   * Type-specific configuration. The discriminant `config.actionType` IS the
   * action's type; its {@link import('./enums').ActionCategory} is looked up in
   * `ACTION_TYPE_CATALOG` rather than duplicated here.
   */
  readonly config: ActionConfig;
  readonly position?: FlowPosition;
}

/** Convenience accessor — the type of an action. */
export function actionTypeOf(action: Action): ActionType {
  return action.config.actionType;
}

/** A unit of work within a Segment. */
export interface Step extends OrderedNode {
  readonly id: string;
  readonly segmentId: string;
  readonly label: string;
  readonly prompt?: string;
  /** OUT OF SCOPE when {@link OrderedNode.orderEnforcement} is Unenforced. */
  readonly blocker?: Blocker;
  readonly actions: readonly Action[];
}

/** A grouping of Steps within a Workflow. */
export interface Segment extends OrderedNode {
  readonly id: string;
  readonly workflowId: string;
  readonly label: string;
  readonly steps: readonly Step[];
}

/** Top-level container. */
export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly enabled: boolean;
  /** Fleets this workflow is associated with. */
  readonly fleets: readonly FleetRef[];
  /** Tagged as a default workflow for its fleet(s). */
  readonly isDefault: boolean;
  readonly metadata: AuditMetadata;
  readonly segments: readonly Segment[];
}

/** A summary row for list views — avoids shipping the full graph. */
export interface WorkflowSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly enabled: boolean;
  readonly isDefault: boolean;
  readonly fleetCount: number;
  readonly updatedAt: IsoDateString;
}
