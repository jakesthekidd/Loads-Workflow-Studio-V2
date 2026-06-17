/**
 * Mock .NET API — public barrel + DI wiring. Import from `@app/mock-api`.
 *
 * Consumers inject the ABSTRACT classes (`WorkflowApi`, `ActionCatalogApi`,
 * `StepTemplateApi`); `provideMockApi()` binds them to the in-memory mocks.
 * To go live later, swap this for a `provideHttpApi()` that binds the same
 * abstracts to HttpClient-backed impls — no consumer changes.
 */

import { Provider } from '@angular/core';
import { ActionCatalogApi, StepTemplateApi, WorkflowApi } from './api-contract';
import { MockActionCatalogApi } from './action-catalog.mock';
import { MockStepTemplateApi } from './step-template.mock';
import { MockWorkflowApi } from './workflow-api.mock';

export * from './api-contract';

/** Provider array binding each API abstraction to its in-memory mock. */
export function provideMockApi(): Provider[] {
  return [
    { provide: WorkflowApi, useClass: MockWorkflowApi },
    { provide: ActionCatalogApi, useClass: MockActionCatalogApi },
    { provide: StepTemplateApi, useClass: MockStepTemplateApi },
  ];
}
