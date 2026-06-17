import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Workflow, WorkflowGraph, WorkflowSummary } from '@app/models';
import { CreateWorkflowInput, UpdateWorkflowInput, WorkflowApi } from './api-contract';
import { SEED_WORKFLOWS, toSummary } from './fake-data';

const LATENCY_MS = 250;

/** In-memory {@link WorkflowApi}. Returns deep copies so callers can't mutate the store. */
@Injectable()
export class MockWorkflowApi extends WorkflowApi {
  private readonly store = new Map<string, Workflow>(
    SEED_WORKFLOWS.map((w) => [w.id, structuredClone(w)] as const),
  );

  override listWorkflows(): Observable<readonly WorkflowSummary[]> {
    return of([...this.store.values()].map(toSummary)).pipe(delay(LATENCY_MS));
  }

  override getWorkflow(id: string): Observable<Workflow> {
    const found = this.store.get(id);
    return found
      ? of(structuredClone(found)).pipe(delay(LATENCY_MS))
      : throwError(() => new Error(`Workflow not found: ${id}`));
  }

  override createWorkflow(input: CreateWorkflowInput): Observable<Workflow> {
    // TODO (Phase N): server assigns id/metadata; minimal stub for now.
    return throwError(() => new Error('createWorkflow not implemented in the mock yet'));
  }

  override updateWorkflow(id: string, patch: UpdateWorkflowInput): Observable<Workflow> {
    // TODO (Phase N): apply top-level patch.
    return throwError(() => new Error('updateWorkflow not implemented in the mock yet'));
  }

  override deleteWorkflow(id: string): Observable<void> {
    this.store.delete(id);
    return of(undefined).pipe(delay(LATENCY_MS));
  }

  override saveWorkflowGraph(id: string, graph: WorkflowGraph): Observable<Workflow> {
    // TODO (Phase N): reconcile the graph back into the stored workflow.
    const found = this.store.get(id);
    return found
      ? of(structuredClone(found)).pipe(delay(LATENCY_MS))
      : throwError(() => new Error(`Workflow not found: ${id}`));
  }
}
