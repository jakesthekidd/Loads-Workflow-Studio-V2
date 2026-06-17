import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActionCategory, categoryOf, Action } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

/**
 * Open "Workflow Items" tree — the docked left column (Figma 15199-78106).
 * Renders the full Segment ▸ Step ▸ Action hierarchy; selecting any node sets
 * the shared selection (scopes the canvas + highlights there too). Navigation is
 * through the tree — there is no workflow dropdown.
 * // TODO (Phase N): reorder via drag, kebab actions, rename.
 */
@Component({
  selector: 'ws-workflow-items-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="ws-tree">
      <header class="ws-tree__head">
        <span class="ws-tree__title">
          {{ store.workflow()?.name ?? '—' }}
          <i class="pi pi-chevron-down"></i>
        </span>
        <button class="ws-tree__collapse" type="button" (click)="store.setPanelOpen(false)" aria-label="Collapse panel">
          <i class="pi pi-angle-double-left"></i>
        </button>
      </header>

      <div class="ws-tree__caption">Workflow Items</div>

      <div class="ws-tree__list" role="tree">
        @for (seg of store.segments(); track seg.id) {
          @let segActive = seg.id === store.activeSegmentId();
          <div
            class="ws-row ws-row--segment"
            [class.is-active]="segActive"
            [class.is-focused]="store.isSelected(seg.id)"
            role="treeitem"
            [attr.aria-expanded]="store.isExpanded(seg.id)"
            (click)="store.select(seg.id)"
          >
            <button class="ws-row__chev" type="button" (click)="$event.stopPropagation(); store.toggleExpand(seg.id)" aria-label="Toggle segment">
              <i class="pi" [class.pi-chevron-down]="store.isExpanded(seg.id)" [class.pi-chevron-right]="!store.isExpanded(seg.id)"></i>
            </button>
            <span class="ws-row__label">{{ seg.label }}</span>
            <i class="ws-row__kind pi pi-th-large" aria-hidden="true"></i>
            <button class="ws-row__kebab" type="button" (click)="$event.stopPropagation(); store.openProperties(seg.id)" aria-label="Segment properties"><i class="pi pi-ellipsis-v"></i></button>
          </div>

          @if (store.isExpanded(seg.id)) {
            @for (step of seg.steps; track step.id) {
              <div
                class="ws-row ws-row--step"
                [class.is-tinted]="segActive"
                [class.is-focused]="store.isSelected(step.id)"
                role="treeitem"
                (click)="store.select(step.id)"
              >
                    <button class="ws-row__chev" type="button" (click)="$event.stopPropagation(); store.toggleExpand(step.id)" aria-label="Toggle step">
                  <i class="pi" [class.pi-chevron-down]="store.isExpanded(step.id)" [class.pi-chevron-right]="!store.isExpanded(step.id)"></i>
                </button>
                <span class="ws-row__label">{{ step.label }}</span>
                <i class="ws-row__kind pi pi-list" aria-hidden="true"></i>
                <button class="ws-row__kebab" type="button" (click)="$event.stopPropagation(); store.openProperties(step.id)" aria-label="Step properties"><i class="pi pi-ellipsis-v"></i></button>
              </div>

              @if (store.isExpanded(step.id)) {
                @for (action of step.actions; track action.id) {
                  <div
                    class="ws-row ws-row--action"
                    [class.is-tinted]="segActive"
                    [class.is-focused]="store.isSelected(action.id)"
                    role="treeitem"
                    (click)="store.select(action.id)"
                  >
                            <span class="ws-row__chev"></span>
                    <span class="ws-row__label">{{ action.label }}</span>
                    <i class="ws-row__kind pi" [class.pi-pencil]="isInput(action)" [class.pi-bolt]="!isInput(action)" aria-hidden="true"></i>
                    <button class="ws-row__kebab" type="button" (click)="$event.stopPropagation(); store.openProperties(action.id)" aria-label="Action properties"><i class="pi pi-ellipsis-v"></i></button>
                  </div>
                }
              }
            }
          }
        }
      </div>
    </aside>
  `,
  styles: `
    .ws-tree {
      display: flex;
      flex-direction: column;
      width: 300px;
      height: 100%;
      background: var(--ws-surface, #fff);
      border-right: 1px solid var(--ws-border, #c6ccd6);
    }
    .ws-tree__head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 12px 8px;
    }
    .ws-tree__title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1 1 auto;
      min-width: 0;
      font-size: 15px;
      font-weight: 700;
      color: var(--ws-text, #1b2330);
    }
    .ws-tree__title .pi { font-size: 12px; color: var(--ws-text-muted, #5a626f); }
    .ws-tree__collapse {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--ws-text, #1b2330);
      cursor: pointer;
    }
    .ws-tree__collapse:hover { background: var(--ws-hover, #eef1f6); }
    .ws-tree__caption {
      padding: 4px 16px 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
      color: var(--ws-text-muted, #5a626f);
    }
    .ws-tree__list { flex: 1 1 auto; overflow-y: auto; padding-bottom: 8px; }

    .ws-row {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 10px 0 8px;
      cursor: pointer;
      border-left: 3px solid transparent;
      user-select: none;
    }
    .ws-row:hover { background: var(--ws-hover, #eef1f6); }
    .ws-row--step { padding-left: 26px; }
    .ws-row--action { padding-left: 46px; }

    /* active segment = the one the canvas is scoped to (brand blue) */
    .ws-row--segment.is-active {
      background: var(--ws-scope-bg, #e9f1f8);
      border-left-color: var(--ws-scope-accent, #2474bb);
    }
    .ws-row--segment.is-active .ws-row__label { color: #15486f; }
    .ws-row--step.is-tinted, .ws-row--action.is-tinted { background: color-mix(in srgb, var(--ws-scope-bg, #e9f1f8) 50%, transparent); }

    /* the single focused (selected) node, any level (cyan) */
    .ws-row.is-focused {
      background: var(--ws-sel-bg, #e3f5fd);
      border-left-color: var(--ws-sel-accent, #72cdf4);
    }
    .ws-row.is-focused .ws-row__label { color: #0f3a4d; }

    .ws-row__chev {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      border: none;
      background: transparent;
      color: var(--ws-text-muted, #5a626f);
      font-size: 11px;
      cursor: pointer;
    }
    .ws-row__label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 600;
      color: var(--ws-text, #1b2330);
    }
    .ws-row--action .ws-row__label { font-weight: 500; }
    .ws-row__kind { color: var(--ws-text-muted, #5a626f); font-size: 13px; }
    .ws-row__kebab {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      cursor: pointer;
    }
    .ws-row__kebab:hover { color: var(--ws-text, #1b2330); }
  `,
})
export class WorkflowItemsTree {
  protected readonly store = inject(WorkflowStudioStore);

  protected isInput(action: Action): boolean {
    return categoryOf(action.config.actionType) === ActionCategory.Input;
  }
}
