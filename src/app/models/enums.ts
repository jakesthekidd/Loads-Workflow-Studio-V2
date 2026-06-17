/**
 * Workflow Studio — shared enums & state model.
 *
 * Conventions:
 *  - We use the "const object + derived union" pattern instead of TS `enum`.
 *    It gives us a runtime-iterable value (for catalogs / dropdowns) AND a
 *    structural string-literal union for the type system, while emitting plain
 *    objects (no `enum` runtime quirks). The derived `type` shares the name.
 */

/** Lifecycle status of a Workflow. */
export const WorkflowStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Disabled: 'Disabled',
} as const;
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

/** Whether a Segment or Step must be completed (Required) or may be skipped (Optional). */
export const RequirementLevel = {
  Required: 'Required',
  Optional: 'Optional',
} as const;
export type RequirementLevel = (typeof RequirementLevel)[keyof typeof RequirementLevel];

/**
 * Ordering semantics for the children of a container (Segment ordering Steps,
 * or a Workflow ordering Segments).
 *  - Enforced   → children must be completed in sequence (sequential-locked).
 *  - Unenforced → children may be completed in any order.
 *
 * NOTE: mixed enforced/unenforced within the same container is allowed; the
 * enforcement applies per-child via {@link OrderedNode.orderEnforcement}, and
 * the container's value is the default for newly added children.
 */
export const OrderEnforcement = {
  Enforced: 'Enforced',
  Unenforced: 'Unenforced',
} as const;
export type OrderEnforcement = (typeof OrderEnforcement)[keyof typeof OrderEnforcement];

/**
 * Per-node runtime state. We model these as DATA only in Phase 1 — the runtime
 * logic that transitions between them (driver completing a step, a blocker
 * clearing, etc.) is intentionally out of scope and lives in a later phase.
 *
 *  - locked    → cannot be started yet (a preceding enforced-order sibling is incomplete).
 *  - blocked   → gated by an explicit blocker condition on the node.
 *  - active    → currently available / in progress.
 *  - completed → finished.
 */
export const NodeRuntimeState = {
  Locked: 'locked',
  Blocked: 'blocked',
  Active: 'active',
  Completed: 'completed',
} as const;
export type NodeRuntimeState = (typeof NodeRuntimeState)[keyof typeof NodeRuntimeState];

/**
 * Action category. Input types render form controls the driver fills in;
 * NonInput types trigger a behavior or integration (SDK launch, geofence, etc.).
 * This drives both palette grouping and how the Action renders on-device.
 */
export const ActionCategory = {
  NonInput: 'NonInput',
  Input: 'Input',
} as const;
export type ActionCategory = (typeof ActionCategory)[keyof typeof ActionCategory];

/** The four levels of the domain hierarchy — used to tag nodes on the canvas. */
export const NodeKind = {
  Workflow: 'workflow',
  Segment: 'segment',
  Step: 'step',
  Action: 'action',
} as const;
export type NodeKind = (typeof NodeKind)[keyof typeof NodeKind];
