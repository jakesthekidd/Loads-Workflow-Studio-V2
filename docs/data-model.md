# Workflow Studio — Data Model

> **Status:** Implemented as the TypeScript contract in [`src/app/models/`](../src/app/models/).
> This document is the human-readable spec for that contract. Code and doc are
> meant to stay in lock-step — if you change one, change the other.

This is the foundation of the whole application. The canvas, the properties
panel, the palette, and the (mock) API all speak this model. Get this right and
everything downstream has a stable contract to build on.

---

## 1. The hierarchy

Workflow Studio models a **strict four-level containment hierarchy**:

```
Workflow
└── Segment            (1 Workflow has N Segments)
    └── Step           (1 Segment has N Steps)
        └── Action     (1 Step has N Actions)
```

Containment is strict: a Segment belongs to exactly one Workflow, a Step to
exactly one Segment, an Action to exactly one Step. Children are stored **inline
(nested)** on their parent, so a `Workflow` object is a self-contained graph.

| Level | Role | File |
|---|---|---|
| **Workflow** | Top-level container an admin authors and a fleet runs. | [`entities.ts`](../src/app/models/entities.ts) |
| **Segment** | A grouping of steps within a workflow. | [`entities.ts`](../src/app/models/entities.ts) |
| **Step** | A unit of work within a segment. | [`entities.ts`](../src/app/models/entities.ts) |
| **Action** | An atomic executable within a step (a form control or a behavior). | [`entities.ts`](../src/app/models/entities.ts) |

---

## 2. Entities & properties

### Workflow
| Property | Type | Notes |
|---|---|---|
| `id` | `string` | Server-assigned. |
| `name` | `string` | |
| `description` | `string` | |
| `status` | `WorkflowStatus` | `Active` \| `Inactive` \| `Disabled`. |
| `enabled` | `boolean` | Master on/off, distinct from `status`. |
| `fleets` | `FleetRef[]` | Fleets this workflow is associated with. |
| `isDefault` | `boolean` | Tagged as the default workflow for its fleet(s). |
| `metadata` | `AuditMetadata` | created/updated by + timestamps. |
| `segments` | `Segment[]` | Ordered children. |

### Segment  (extends `OrderedNode`)
| Property | Type | Notes |
|---|---|---|
| `id`, `workflowId`, `label` | `string` | |
| `steps` | `Step[]` | Ordered children. |
| *(+ all `OrderedNode` fields)* | | requirement, ordering, completion conditions, status message, runtime state, position. |

### Step  (extends `OrderedNode`)
| Property | Type | Notes |
|---|---|---|
| `id`, `segmentId`, `label` | `string` | |
| `prompt` | `string?` | Prompt shown to the driver. |
| `blocker` | `Blocker?` | Gates the step. **Out of scope on unenforced-order steps** (see §6). |
| `actions` | `Action[]` | Ordered children. |
| *(+ all `OrderedNode` fields)* | | |

### Action
| Property | Type | Notes |
|---|---|---|
| `id`, `stepId`, `label` | `string` | |
| `sortIndex` | `number` | Order among sibling actions. |
| `config` | `ActionConfig` | Discriminated union; `config.actionType` **is** the action's type (see §4). |
| `position` | `FlowPosition?` | Canvas coordinates. |

> An Action's **category** (Input/NonInput) is *not* stored on the action — it's
> looked up from `ACTION_TYPE_CATALOG` by its type. One source of truth.

### Shared / supporting types
- **`OrderedNode`** — the fields common to Segment & Step: `requirement`,
  `orderEnforcement`, `sortIndex`, `completionConditions`, `statusMessage`,
  `runtimeState?`, `position?`.
- **`AuditMetadata`** — `createdAt/By`, `updatedAt/By` (ISO strings).
- **`FleetRef`** — `{ id, name }`.
- **`CompletionCondition`** — Phase 1 models it as an opaque `{ id, description? }`;
  the expression language is a later phase (marked `TODO` in code).
- **`Blocker`** — `{ id, message }`; clearing condition is a later phase.
- **`FlowPosition`** — `{ x, y }` canvas coordinates.
- **`WorkflowSummary`** — a lightweight row for list views (no nested graph).

---

## 3. Ordering & state model

These are modeled as **data only** in this phase. The runtime logic that
*acts* on them (locking the next step, evaluating completion, clearing
blockers) is intentionally **not built yet**.

### Requirement — `RequirementLevel`
`Required` \| `Optional`. Whether a Segment/Step must be completed or may be skipped.

### Ordering — `OrderEnforcement`
`Enforced` \| `Unenforced`.
- **Enforced** → children completed in sequence (sequential-locked).
- **Unenforced** → children completed in any order.

**Mixed order is supported.** `orderEnforcement` lives on each child
(`OrderedNode`), not only on the container, so a single Segment can hold some
enforced and some unenforced Steps. The container's setting is the default for
newly added children. `sortIndex` gives the authored/enforced sequence.

### Runtime state — `NodeRuntimeState`
Per-node state, **data only**:
| State | Meaning |
|---|---|
| `locked` | A preceding enforced-order sibling isn't complete yet. |
| `blocked` | Gated by an explicit `Blocker` on the node. |
| `active` | Currently available / in progress. |
| `completed` | Finished. |

---

## 4. Action Types catalog

An **Action Type** identifies what an Action does. Defined in
[`action-type.ts`](../src/app/models/action-type.ts) via the const-object +
union pattern, with `ACTION_TYPE_CATALOG` as the single source of truth for
each type's category, label, description, and deferred flag.

Two **categories** (`ActionCategory`):
- **Input** — renders a form control the driver fills in.
- **NonInput** — triggers a behavior or integration.

### NonInput (19)
`AcceptWorkflow`, `RejectWorkflow`, `StopActualization`, `SendCheckcall`,
`LaunchGeotabSDK`, `LaunchCopilotSDK`, `LaunchScanSDK`, `LaunchEmailApp`,
`LaunchSMS`, `LaunchPhoneApp`, `BarcodeScanner`, `TriggerGeofence`,
`TimerStopwatch`, `GeneratePushAlert`, `GenerateEmailFromTFLO`,
`GenerateSMSFromTFLO`, `GetDeviceLocation`, `GetELDLocation`, `LaunchWebview`

### Input (15)
`TextField`, `NumericField`, `MultiSelectDropdown`, `SingleSelectDropdown`,
`Label`, `RadioButton`, `Checkbox`, `SimpleButton`, `Date`, `Datetime`,
`MultiDateSelector`, `Time`, `TimeRangeSelector`, `TemperatureField`, `Slider`

### Deferred — *not for v1*
`LaunchEBOL`, `LaunchEPOD` — present as enum members + catalog entries (flagged
`deferred: true`, hidden from the palette) so the type system is complete, but
not wired into v1.

---

## 5. Action config (discriminated union)

**Common fields (`BaseActionConfig`)** — present on every action, mapping to the
"Define Action" block in the Figma settings panel:
- `required?` — the REQUIRED toggle.
- `visible?` — the Visible toggle (nearly every action has this).
- `conditional?: ConditionalRule` — the Conditional toggle. A **confirmed
  requirement**; modeled as data now, rule/evaluation engine deferred (see §6).
- `helpText?`.

Each type then adds a config interface that extends `BaseActionConfig` and
carries a literal `actionType` discriminant. The union `ActionConfig` is keyed on
that field, so narrowing is type-safe with no casts:

```ts
if (action.config.actionType === ActionType.Slider) {
  action.config.min;  // ✅ SliderConfig
  action.config.max;
}
```

`ConfigFor<typeof ActionType.Slider>` extracts the exact config shape for a type.

**Seeded (representative) configs** — establish the pattern:
`Slider` (min/max/step/unit), `SingleSelectDropdown` & `MultiSelectDropdown`
(`OptionsSource`: static vs remote), `TriggerGeofence` (lat/lng/radius/trigger),
`TimerStopwatch` (mode/duration/startTrigger), `GenerateEmailFromTFLO`
(to/subject/body templates).

**Stubbed configs** — every other type currently carries only its discriminant
plus a `// TODO (Phase 2)` marker. Fleshing one out means adding its fields
below the discriminant; the union is assembled mechanically so nothing else
changes.

---

## 6. Out of scope (do NOT build)

Explicitly excluded from this work — modeled as data where relevant, but no
behavior:

- **Blocker on an unenforced-order Step** — the `blocker` field exists on `Step`,
  but the combination with unenforced order is not a supported path.
- **Conditional / show-hide *engine*** — conditional visibility is a *confirmed
  requirement* and the `conditional`/`visible` fields are modeled as data, but the
  rule language and its runtime evaluation are deferred (execution approach still
  under design). We store the toggle/rule, not the evaluator.
- **Launch eBOL / Launch ePOD** — deferred action types (see §4).
- **All runtime transition logic** — locking, completion evaluation, blocker
  clearing. We store the *state*, not the engine that changes it.

---

## 6b. Templates

Creating a Step is **always** either "pick a template" or "start blank" — so
templates are a first-class, permanent concept, modeled in
[`templates.ts`](../src/app/models/templates.ts):

- **`StepTemplate`** — a pre-built Step offered by the toolbar's **Template Steps**
  picker. `origin: 'system'` = shipped catalog (e.g. *Begin Load, Arrive at
  Shipper, Weigh Station*); `origin: 'user'` = the picker's **"Created By you"**
  library. `category` drives the picker grouping (e.g. *Stops (Loads)*).
- **`StepBlueprint` / `ActionBlueprint`** — a Step/Action minus identity &
  placement (`id`, `segmentId`/`stepId`, `sortIndex`), assigned on instantiation.
- A **blank step** is simply creating an empty Step with no template.
- Served by the (mock) API like the action-type catalog (see [mock-api.md](./mock-api.md)).

**Still open (not modeled):** the components picker also has a *"Template actions"*
group (pre-built components — Pick Up Address, Logo Image, Help Link), implying a
parallel `ActionTemplate`. Deferred until we tackle the components picker.

---

## 7. Files

| File | Contents |
|---|---|
| [`enums.ts`](../src/app/models/enums.ts) | `WorkflowStatus`, `RequirementLevel`, `OrderEnforcement`, `NodeRuntimeState`, `ActionCategory`, `NodeKind`. |
| [`action-type.ts`](../src/app/models/action-type.ts) | `ActionType`, `ACTION_TYPE_CATALOG`, `ALL_ACTION_TYPES`, `categoryOf()`. |
| [`action-config.ts`](../src/app/models/action-config.ts) | `BaseActionConfig`, seeded + stubbed configs, `ActionConfig` union, `ConfigFor<T>`. |
| [`entities.ts`](../src/app/models/entities.ts) | `Workflow`, `Segment`, `Step`, `Action`, `OrderedNode`, supporting types. |
| [`templates.ts`](../src/app/models/templates.ts) | `StepTemplate`, `StepBlueprint`, `ActionBlueprint`, `TemplateOrigin`. |
| [`graph.ts`](../src/app/models/graph.ts) | Canvas projection — see [canvas.md](./canvas.md). |
| [`index.ts`](../src/app/models/index.ts) | Public barrel (`@app/models`). |
