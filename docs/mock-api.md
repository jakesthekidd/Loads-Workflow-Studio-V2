# Workflow Studio — Mock .NET API

> **Status:** Design spec. The contract and fake-data implementation are
> **planned** (Phase 2). This doc defines the boundary so the implementation —
> and the eventual swap to the real .NET API — has a target.

---

## 1. Goal

A **mock backend** that lets us build and demo the whole front-end end-to-end
with fake JSON, behind **interface boundaries** so the real .NET API drops in
later **with zero changes on the consumer side**.

Two principles:
1. **Abstract class = interface + DI token.** Consumers inject the abstract
   class; the provider decides whether it resolves to the mock or to HTTP.
2. **Async semantics match real HTTP.** Every method returns `Observable<T>`
   (with simulated latency), so substituting `HttpClient` is mechanical.

---

## 2. The contract (planned, `mock-api/api-contract.ts`)

```ts
abstract class WorkflowApi {
  listWorkflows(): Observable<readonly WorkflowSummary[]>;
  getWorkflow(id: string): Observable<Workflow>;
  createWorkflow(input: CreateWorkflowInput): Observable<Workflow>;
  updateWorkflow(id: string, patch: UpdateWorkflowInput): Observable<Workflow>;
  deleteWorkflow(id: string): Observable<void>;
  saveWorkflowGraph(id: string, graph: WorkflowGraph): Observable<Workflow>;
}

abstract class ActionCatalogApi {
  getCatalog(): Observable<readonly ActionTypeCatalogEntry[]>;
}

abstract class StepTemplateApi {
  // Template Steps picker: system catalog + the user's "Created By you" library.
  listStepTemplates(): Observable<readonly StepTemplate[]>;
  saveStepTemplate(blueprint: StepBlueprint, name: string): Observable<StepTemplate>; // origin: 'user'
}
```

DTOs:
- **`CreateWorkflowInput`** — `{ name, description?, status?, fleetIds? }`; server assigns id/metadata.
- **`UpdateWorkflowInput`** — partial patch of top-level fields (`name`, `description`, `status`, `enabled`, `isDefault`, `fleetIds`).

Both abstract classes resolve against the shared model in
[`@app/models`](../src/app/models/index.ts) — no parallel/duplicate types.

---

## 3. Layout (planned)

```
mock-api/
├── api-contract.ts        # abstract WorkflowApi, ActionCatalogApi + DTOs
├── fake-data.ts           # seed Workflows / Fleets (exercise the union: Slider, Geofence, …)
├── workflow-api.mock.ts   # MockWorkflowApi extends WorkflowApi
├── action-catalog.mock.ts # MockActionCatalogApi extends ActionCatalogApi (serves ACTION_TYPE_CATALOG)
└── index.ts               # barrel + provideMockApi()
```

`provideMockApi()` returns the provider array binding each abstract class to its
mock:

```ts
export function provideMockApi(): Provider[] {
  return [
    { provide: WorkflowApi, useClass: MockWorkflowApi },
    { provide: ActionCatalogApi, useClass: MockActionCatalogApi },
  ];
}
```

Wired in `app.config.ts`. The mocks hold an in-memory store and use
`of(...).pipe(delay(...))` to mimic network latency, returning deep copies so
callers can't mutate the store by reference.

---

## 4. Swapping in the real .NET API (later)

1. Add HTTP implementations (e.g. `HttpWorkflowApi extends WorkflowApi`) that
   call the real endpoints with `HttpClient`.
2. Replace `provideMockApi()` with `provideHttpApi()` in `app.config.ts`.
3. **Nothing else changes** — components and the state layer only ever import the
   abstract classes from `@app/mock-api` (or a renamed `@app/api`).

The mock method signatures are intentionally REST-shaped (list / get / create /
update / delete / save-graph) so they map cleanly onto .NET controller actions.

---

## 5. Consumer access (planned)

UI components do **not** call the API directly. They go through the **state
layer** (`services/`, Phase 2) — a signal-based store that:
- loads the catalog + current workflow,
- exposes them as signals,
- owns mutation + dirty tracking,
- calls `saveWorkflowGraph()` on save.

This keeps the API surface in one place and the components declarative. See
[architecture.md §4](./architecture.md) for the layer boundaries.
