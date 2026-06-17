/**
 * Workflow Studio — (mock) .NET API contract.
 *
 * These ABSTRACT CLASSES are the boundary between the front-end and the backend.
 * They double as the TypeScript interface AND the Angular DI token: consumers
 * inject the abstract class; `provideMockApi()` binds it to the in-memory
 * implementation today and to an HTTP-backed one later — with ZERO consumer
 * changes. Every method returns an `Observable` with HTTP-like async semantics.
 *
 * See docs/mock-api.md.
 */

import { Observable } from 'rxjs';
import {
  ActionTypeCatalogEntry,
  StepBlueprint,
  StepTemplate,
  Workflow,
  WorkflowGraph,
  WorkflowStatus,
  WorkflowSummary,
} from '@app/models';

/** Payload to create a new workflow. Server assigns id/metadata. */
export interface CreateWorkflowInput {
  readonly name: string;
  readonly description?: string;
  readonly status?: WorkflowStatus;
  readonly fleetIds?: readonly string[];
}

/** Partial patch for an existing workflow's top-level fields. */
export type UpdateWorkflowInput = Partial<
  Pick<Workflow, 'name' | 'description' | 'status' | 'enabled' | 'isDefault'>
> & {
  readonly fleetIds?: readonly string[];
};

/** CRUD + graph load/save for workflows. */
export abstract class WorkflowApi {
  /** List lightweight summaries for the workflows grid / switcher. */
  abstract listWorkflows(): Observable<readonly WorkflowSummary[]>;

  /** Fetch a single workflow's full graph (segments → steps → actions). */
  abstract getWorkflow(id: string): Observable<Workflow>;

  /** Create a new (empty) workflow. */
  abstract createWorkflow(input: CreateWorkflowInput): Observable<Workflow>;

  /** Patch top-level workflow fields. */
  abstract updateWorkflow(id: string, patch: UpdateWorkflowInput): Observable<Workflow>;

  /** Delete a workflow. */
  abstract deleteWorkflow(id: string): Observable<void>;

  /** Persist the full graph (ordering, positions, nesting); returns canonical workflow. */
  abstract saveWorkflowGraph(id: string, graph: WorkflowGraph): Observable<Workflow>;
}

/** Serves the Action Type catalog (Input/NonInput, labels, deferred flags). */
export abstract class ActionCatalogApi {
  abstract getCatalog(): Observable<readonly ActionTypeCatalogEntry[]>;
}

/** Serves the Template Steps picker: system catalog + user "Created By you" library. */
export abstract class StepTemplateApi {
  abstract listStepTemplates(): Observable<readonly StepTemplate[]>;
  /** Save a step as a reusable user template (origin: 'user'). */
  abstract saveStepTemplate(blueprint: StepBlueprint, name: string): Observable<StepTemplate>;
}
