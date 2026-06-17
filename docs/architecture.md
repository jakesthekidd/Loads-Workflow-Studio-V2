# Workflow Studio — Architecture

> **Status:** Foundation phase. Project scaffold + data-model contract +
> design-system wiring are in place. Service/canvas/UI layers below are
> **designed here but not yet implemented** — this doc is the map we build against.

---

## 1. What we're building

Workflow Studio is a **drag-and-drop canvas** where an admin visually composes
**configurable mobile workflows** that drivers execute on a device (forms,
scanning, geofence triggers, SDK launches, etc.).

The product goal: workflows that are lightweight and business-process-agnostic,
**configurable without a code change or deployment**. The Studio's output is a
data structure (a `Workflow`, see [data-model.md](./data-model.md)) that the
mobile app interprets at runtime.

This codebase is a **prototype meant to be handed to developers** as a clean
starting point. We optimize equally for: (1) visual fidelity to the Transflo
design language, (2) functional end-to-end workflow creation, and (3) clean,
extensible component architecture.

---

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Angular 21**, standalone components, signals | No NgModules; signals for state where sensible. |
| Canvas | **`@foblex/flow`** | THE canvas library. Node/connection primitives — not substituted. See [canvas.md](./canvas.md). |
| UI / styling | **Transflo Design System** (PrimeNG 21 + `TransfloTheme`) | All UI uses TDS components + CSS design tokens (`var(--p-*)`), never hardcoded hex. See §5. |
| Backend (this phase) | **Mock .NET API** | Injectable services behind interface boundaries returning fake JSON; swap for real .NET later with no consumer changes. See [mock-api.md](./mock-api.md). |
| Language | TypeScript (strict) | Path aliases `@app/models`, `@app/services`, `@app/mock-api`. |

---

## 3. Folder structure

```
src/
├── theme/
│   └── transflo-theme.ts        # TransfloTheme preset (copied from design system)
└── app/
    ├── models/                  # ✅ DONE — the domain contract (see data-model.md)
    │   ├── enums.ts
    │   ├── action-type.ts
    │   ├── action-config.ts
    │   ├── entities.ts
    │   ├── graph.ts             # canvas projection of the domain model
    │   └── index.ts             # barrel → import from '@app/models'
    ├── mock-api/                # ⏳ PLANNED — API contract + fake-data impl (mock-api.md)
    ├── services/                # ⏳ PLANNED — state layer (store) consumers talk to
    ├── canvas/                  # ⏳ PLANNED — @foblex/flow shell; segment-scoped Step/Action nodes + Workflow Items tree
    ├── palette/                 # ⏳ PLANNED — BOTH the "Add" picker popover AND a drag-palette rail
    ├── properties/              # ⏳ PLANNED — right-side inspector for the selected node/action
    ├── app.ts / app.html / app.config.ts
    └── ...
docs/                            # ✅ these reference docs
transflo-design-system/          # local clone of the design system (reference)
```

`✅ DONE` = built this phase. `⏳ PLANNED` = designed in docs, implemented in a later phase.

---

## 4. Layer boundaries

Strict, one-directional dependencies. Each layer only knows about the one below it.

```
┌─────────────────────────────────────────────────────────┐
│  UI components   canvas/   palette/   properties/         │  Angular + TDS
│        │ render the model, emit user intent               │
├────────┼──────────────────────────────────────────────────┤
│  State layer        services/  (signal-based store)       │  holds current workflow,
│        │ owns mutation; exposes signals; calls the API    │  selection, dirty state
├────────┼──────────────────────────────────────────────────┤
│  API boundary       mock-api/  (abstract WorkflowApi etc) │  Observable<T>, async
│        │ interface today bound to a mock; HTTP later       │  semantics = real .NET
├────────┼──────────────────────────────────────────────────┤
│  Domain model       models/    (pure types, no Angular)   │  the shared contract
└─────────────────────────────────────────────────────────┘
```

Key rules:
- **The canvas never mutates the domain model directly.** It renders a
  read-only projection (`WorkflowGraph`) and emits intent (move / add / connect /
  select); the state layer reconciles. See [canvas.md](./canvas.md).
- **Consumers inject the abstract API class, never a concrete impl.** Swapping
  the mock for HTTP is a provider change in `app.config.ts` only. See
  [mock-api.md](./mock-api.md).
- **`models/` has zero Angular imports** — pure TypeScript so it's portable and
  trivially testable.

---

## 5. Design system

All UI is built on the **Transflo Design System** — PrimeNG 21 themed with the
`TransfloTheme` preset (brand blue `#2474BB` at primary-500, slate surfaces).

- Theme preset copied to [`src/theme/transflo-theme.ts`](../src/theme/transflo-theme.ts).
- PrimeNG, `@primeuix/themes`, and `primeicons` are installed.
- **Activation is staged but not yet switched on** in `app.config.ts` (we paused
  before wiring `providePrimeNG`), so the foundation isn't half-broken. Turning it
  on is the first step of the UI phase.
- Use TDS/PrimeNG components and CSS tokens (`var(--p-primary-500)`); never
  hardcode hex. Available components are catalogued in [`CLAUDE.md`](../CLAUDE.md);
  the live reference is the design system's Storybook.

---

## 6. Phasing plan

| Phase | Scope | State |
|---|---|---|
| **0 — Scaffold** | Angular workspace, `@foblex/flow`, PrimeNG + TransfloTheme staged. | ✅ Done |
| **1a — Data model** | Full domain contract: entities, enums, action catalog, discriminated-union configs, graph projection. | ✅ Done |
| **1b — Reference docs** | `architecture` / `data-model` / `canvas` / `mock-api` docs (this set). | ✅ Done |
| **2 — Mock API + state** | Implement `mock-api/` (contract + fake data) and `services/` store. | ⏳ Next |
| **3 — Canvas + palette** | `@foblex/flow` shell, four node components, drag-from-palette, containment-aware rendering against Figma. | ⏳ |
| **4 — Properties panel** | Type-aware inspector; flesh out per-type action configs (the `TODO (Phase 2)` stubs). | ⏳ |
| **5 — End-to-end create/save** | Wire create → edit graph → save through the API boundary. | ⏳ |
| **Later** | Runtime ordering/state logic, completion-condition expressions, blockers, eBOL/ePOD. | Out of scope now |

See [data-model.md §6](./data-model.md) for the explicit out-of-scope list.
