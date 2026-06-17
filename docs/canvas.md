# Workflow Studio — Canvas (`@foblex/flow`)

> **Status:** Design spec, refined against the **"Concept May 18th"** Figma board
> (file `YaWAqYR83FSxKxubMhlYQC`). The domain→canvas projection
> ([`graph.ts`](../src/app/models/graph.ts)) is implemented; the canvas
> components, picker/palette, and inspector are **planned** (Phase 3).

---

## 1. Screen layout (from Figma)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Transflo header:  logo            Dashboard   ▦   (avatar)                 │
├────┬───────────────────────┬──────────────────────────────────┬───────────┤
│ a  │ b  Workflow Items      │ c  Canvas (dotted grid)          │ d  ▶Run 💾Save│
│ p  │  {WORKFLOW NAME} ▾      │   ┌─ Step 1: Pre-Trip  ↑↓ Optional┐│  inspector │
│ p  │  ▾ Pick Up   (segment)  │   │  ⠿ Heading        [Headingtext]│  (right    │
│    │    ▸ Pre-Trip (step)    │   │  ⠿ TEXT 1         [Text]       │  panel,    │
│ n  │      • Heading (action) │   │  ⠿ Scan           [Button]     │  opens on  │
│ a  │      • TEXT 1           │   │  ⠿ DDL1           [Input]      │  edit)     │
│ v  │    ▸ Start Movement     │   │  + Add Action                  │            │
│    │  ▸ Get Fuel  (segment)  │   └────────────────┬───────────────┘│            │
│ 66 │  ▸ End Load  (segment)  │            (+ insert step)          │            │
│ px │                         │   ┌─ Step 2: Pick Up Form ...       │            │
└────┴───────────────────────┴──────────────────────────────────┴───────────┘
   a = app nav rail   b = Workflow Items tree   c = @foblex/flow canvas   d = inspector
```

### 1a. Workflow Items panel (floating side nav)

A **floating, collapsible** panel (not a fixed column) overlaying the canvas. It
is the breakdown of the whole workflow and the primary navigation surface.

- **Closed state** — a compact pill: workflow name (small) + the **currently
  selected Segment** + an expand button. (So even collapsed it shows context.)
- **Open state** — header with a **workflow-name dropdown** (`{WORKFLOW NAME} ▾`,
  switch workflows) + a collapse button, the **"Workflow Items"** label, then the
  **3-level expandable tree**: Segment ▸ Step ▸ Action.
- **Selection ↔ canvas link:** the selected Segment is highlighted (blue text +
  blue left bar) and its child Steps render on a tinted background — this is the
  segment the canvas is scoped to (see §2). Switching selection re-scopes the canvas.
- **Row anatomy** (every level): **drag handle** (reorder within its level),
  expand chevron, label, a **kind icon** (Segment = 4-square grid, Step = rows
  glyph, Action = its type glyph), and a **kebab** (⋮) context menu.

---

## 2. The canvas is **segment-scoped** (key model)

This is the single most important behavior to get right:

- The **left "Workflow Items" tree** holds the **entire hierarchy** — every
  Segment, every Step, every Action — expandable in one list view.
- **Selecting a Segment re-scopes the canvas to that segment.** The canvas never
  shows the whole workflow at once.
- **Within the selected segment:** each **Step is a container node**, and each
  **Action is a child node rendered inside its Step container.** Steps are
  connected in sequence with an insert (`+`) affordance between them.

So the mapping to `@foblex/flow` is:

| Domain level | Where it lives | Canvas representation |
|---|---|---|
| **Workflow** | Title (`{WORKFLOW NAME} ▾`) + tree root | not a canvas node |
| **Segment** | Tree item; **selection scopes the canvas** | not a node — it *is* the canvas viewport |
| **Step** | Tree item + **canvas container node** | `@foblex/flow` node (container), with sequence connectors |
| **Action** | Tree item + **child node inside the Step** | `@foblex/flow` node nested in the step container |

> This replaces the earlier "four nested node levels" guess. Confirmed:
> **Step = container node, Action = node inside it, canvas = one segment at a time.**

---

## 3. Domain ↔ canvas projection

The bridge is [`graph.ts`](../src/app/models/graph.ts):

- **`toSegmentGraph(segment)`** — *the projection the canvas uses.* Emits Step
  nodes (`parentId: null`, top-level containers in the segment view) and Action
  nodes (`parentId: <stepId>`, nested in their step). Re-run on segment switch.
- **`toGraph(workflow)`** — a whole-workflow flatten (used for the tree / overview;
  positions + parent links for all four levels).
- **`FlowNode`** — `{ id, kind, label, parentId, position, data }`; `parentId`
  encodes containment, `data` back-references the domain entity.
- **`FlowConnection`** — `{ id, sourceId, targetId }`; reserved for enforced-order
  sequence links between steps (not synthesized yet).

Data flow stays one-directional: domain → projection → canvas renders → canvas
emits intent (move / add / reorder / select) → state layer reconciles.

---

## 4. Node anatomy (from Figma)

**Step container node** header shows:
- `Step N: <label>` (the number reflects enforced-order position),
- reorder **↑ ↓** arrows,
- a **requirement tag** (`Optional` / `Required`),
- a hierarchy icon + kebab menu,
- a colored **left border** tying it to its segment,
- a **`+ Add Action`** row at the bottom.

**Action child node** (row) shows: drag handle, label, a **type tag**
(`Text`, `Button`, `Input`, `Dropdown`, `Submit Button`, `Headingtext`…), a
**required dot**, a hierarchy icon + kebab. (Type tags are display labels; the
underlying type is an `ActionType` from the catalog — non-input launches like
Geotab/Copilot/Scan render as a `Button`.)

Runtime-state styling (`locked`/`blocked`/`active`/`completed`) and the
order/requirement badges are **display only** — no runtime logic this project.

---

## 5. Adding items — **both** patterns

Confirmed we support two ways to add:

1. **Contextual picker popover** — `+ Add Action` (and add-step/add-segment)
   opens a searchable **"Actions/Components/Widgets"** popover with category
   groups (e.g. *Form Components*) of icon tiles. Categories follow
   `ActionCategory` (Input vs NonInput). Deferred types are hidden.
2. **Persistent drag-palette rail** — a palette the user can drag from onto the
   canvas / into a container, as an alternative to the picker.

Both resolve to the same outcome: the state layer creates the entity (respecting
containment rules — Action→Step, Step→Segment) and re-projects via
`toSegmentGraph()`. Structural items can also be added/reordered directly in the
**Workflow Items tree** and via the **`+` insert** point between step nodes.

---

## 6. Canvas toolbar (a primary component)

A floating pill toolbar ("Canvas Action Row", Figma `15245:27849`). It is the
**main creation + control surface** on the canvas, so it gets its own treatment.

**Anatomy, left → right (resting / open state):**

| Button | Icon | Role |
|---|---|---|
| Collapse | `‹` (angles-right) | Toggle toolbar collapsed ↔ open. |
| Preview | eye | Preview / visibility of the workflow. |
| **Steps** | steps glyph | Opens the **Template Steps** picker (add a Step). |
| **Components** | diamond/layers glyph | Opens the **Actions/Components/Widgets** picker (add an Action). |
| Settings | gears | Canvas/workflow settings. |
| Undo / Redo | undo · redo | Edit history (split control). |
| **Run** | play | Outlined button — simulate/preview the workflow. |
| **Save ▾** | save + caret | Filled primary split-button; caret = save/publish options. |

**States:** `Resting` (idle), `Steps` (Steps button active + Template Steps
popover open), `Actions` (Components button active + picker open), plus a
**Collapsed** variant showing only **Run** and **Save ▾**.

**Styling tokens** (all map to `TransfloTheme`): surface white `#FFFFFF`,
border `#E2E6EB`, hairline `#DFDFDF`, text-medium `#606061`, primary `#2474BB`.
Build with PrimeNG (Toolbar / Button / SplitButton / Popover) + tokens — no
hardcoded hex.

### 6a. The two pickers (launched from the toolbar)

1. **Components → "Actions/Components/Widgets"** — searchable popover that adds an
   **Action** to the focused Step (also reachable from inline `+ Add Action`).
   It is **unified** (Input *and* Non-Input), with UI category groups:
   - **Form Components** — Input controls (Text/Numeric Input, Dropdown List,
     Radio, Checkbox, Date & Time, Heading, Text Block, Divider, Image, …).
   - **Commit Options** — submit/commit-type actions (e.g. Start).
   - **Actions** — Non-Input integrations (Launch Phone App, Launch Scan, …).
   - **Template actions** — pre-built components (Pick Up Address, Logo Image,
     Help Link). *(See templates note — `ActionTemplate` not yet modeled.)*

   These groups are a **UI presentation**; the model's fundamental split stays
   `ActionCategory` Input/NonInput, and the catalog of types remains exactly the
   brief's spec (extra picker tiles like Signature/Swipe/Toggle are not in the
   model). See [data-model.md §4](./data-model.md).
2. **Steps → "Template Steps"** — searchable popover with **`✎ Add Blank Step`**
   plus a library of **pre-built Step templates** grouped by category
   (*Stops (Loads)*: Begin Load, Arrive at Shipper, Depart from Shipper, Arrive at
   Consignee, Empty Call, Damaged Asset, Weigh Station, Wash Trailer) and a
   **"Created By you"** group (user-saved templates). Adds a **Step**.

> **New concept — templates.** Step (and likely component) templates are *not yet
> in the data model*. They imply a template catalog (akin to `ACTION_TYPE_CATALOG`)
> and probably a "save as template" / user-library capability. See
> [data-model.md](./data-model.md) "Open: templates" — flagged, not yet modeled.

### 6b. Right inspector panel

Opens when a node/action is edited. For an Action it shows a **"Define Action"**
block (`Required`, `Visible`, `Conditional` toggles → `BaseActionConfig`) and a
**type-specific "Settings"** block driven by the discriminated-union config (e.g.
Text Input: Label Text, Pre-Populated source, Read Only, Editable-if-NULL, Type,
Data Type).

---

## 7. Not in scope this project

- Runtime execution / state transitions (states render as data only).
- Conditional **evaluation** — the `conditional`/`visible` fields are modeled as
  data; the rule engine is a later phase (see [data-model.md](./data-model.md)).
- Enforced-order connection synthesis (reserved in `FlowConnection`).
- Auto-layout, eBOL/ePOD, and the rest of [data-model.md §6](./data-model.md).
