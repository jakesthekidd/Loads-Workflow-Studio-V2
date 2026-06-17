/**
 * Workflow Studio — canvas graph projection.
 *
 * The domain model ({@link Workflow} & friends) is the source of truth. The
 * canvas, however, wants a FLAT list of positioned nodes plus parent links so
 * @foblex/flow can render and lay them out. This file defines that projection
 * and a pure mapper from the nested domain model to it.
 *
 * Keeping the projection separate means the canvas never mutates the domain
 * model directly — it emits intent (move, add, connect) and the state layer
 * reconciles. (Reconciliation logic itself is a later phase.)
 */

import { actionTypeOf, Action, FlowPosition, Segment, Step, Workflow } from './entities';
import { NodeKind } from './enums';

/** A single positioned node on the canvas, tagged by hierarchy level. */
export interface FlowNode {
  readonly id: string;
  readonly kind: NodeKind;
  /** Display label. */
  readonly label: string;
  /** Parent node id (containment). `null` for the root Workflow node. */
  readonly parentId: string | null;
  readonly position: FlowPosition;
  /** Back-reference to the domain entity this node projects. */
  readonly data: Workflow | Segment | Step | Action;
}

/** A connection between two nodes (e.g. enforced-order sequence link). */
export interface FlowConnection {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
}

/** The full canvas projection consumed by the canvas component. */
export interface WorkflowGraph {
  readonly nodes: readonly FlowNode[];
  readonly connections: readonly FlowConnection[];
}

const DEFAULT_POSITION: FlowPosition = { x: 0, y: 0 };

/**
 * Flatten a {@link Workflow} into a {@link WorkflowGraph}.
 *
 * Phase 1: positions come straight from each entity's `position` (or origin if
 * unset) and connections are not yet synthesized — auto-layout and
 * enforced-order sequence links are a later phase (see docs/canvas.md).
 */
export function toGraph(workflow: Workflow): WorkflowGraph {
  const nodes: FlowNode[] = [];

  nodes.push({
    id: workflow.id,
    kind: NodeKind.Workflow,
    label: workflow.name,
    parentId: null,
    position: DEFAULT_POSITION,
    data: workflow,
  });

  for (const segment of workflow.segments) {
    nodes.push(segmentNode(segment, workflow.id));
    for (const step of segment.steps) {
      nodes.push(stepNode(step, segment.id));
      for (const action of step.actions) {
        nodes.push(actionNode(action, step.id));
      }
    }
  }

  // TODO (Phase N): synthesize enforced-order sequence connections.
  return { nodes, connections: [] };
}

/**
 * Project a single Segment for the canvas.
 *
 * This is the projection the canvas actually consumes. The left "Workflow
 * Items" tree shows the whole hierarchy (all segments/steps/actions); selecting
 * a segment re-scopes the canvas to THAT segment, which renders its Steps as
 * **container nodes** (`parentId: null`) each holding its Actions as **child
 * nodes** (`parentId: <stepId>`). Switching segments re-projects.
 * (Confirmed model — see docs/canvas.md.)
 */
export function toSegmentGraph(segment: Segment): WorkflowGraph {
  const nodes: FlowNode[] = [];
  for (const step of segment.steps) {
    nodes.push(stepNode(step, null)); // step is a top-level container in segment scope
    for (const action of step.actions) {
      nodes.push(actionNode(action, step.id)); // action nested inside its step
    }
  }
  // TODO (Phase N): synthesize enforced-order sequence connectors between steps.
  return { nodes, connections: [] };
}

function segmentNode(segment: Segment, parentId: string): FlowNode {
  return {
    id: segment.id,
    kind: NodeKind.Segment,
    label: segment.label,
    parentId,
    position: segment.position ?? DEFAULT_POSITION,
    data: segment,
  };
}

function stepNode(step: Step, parentId: string | null): FlowNode {
  return {
    id: step.id,
    kind: NodeKind.Step,
    label: step.label,
    parentId,
    position: step.position ?? DEFAULT_POSITION,
    data: step,
  };
}

function actionNode(action: Action, parentId: string): FlowNode {
  return {
    id: action.id,
    kind: NodeKind.Action,
    label: `${action.label} (${actionTypeOf(action)})`,
    parentId,
    position: action.position ?? DEFAULT_POSITION,
    data: action,
  };
}
