import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WorkflowStudioStore } from '@app/services';

/**
 * Floating "Workflow Items" pill — the **closed** state of the panel
 * (docs/canvas.md §1a). Shows the workflow name + currently-selected segment and
 * expands into the docked tree ({@link WorkflowItemsTree}) when clicked.
 */
@Component({
  selector: 'ws-workflow-items-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ws-items" role="region" aria-label="Workflow items">
      <div class="ws-items__text">
        <span class="ws-items__workflow">{{ store.workflow()?.name ?? workflowNamePlaceholder }}</span>
        <span class="ws-items__segment">
          <i class="pi pi-th-large"></i>
          {{ store.currentSegment()?.label ?? 'No segment selected' }}
        </span>
      </div>
      <button class="ws-items__toggle" type="button" (click)="store.setPanelOpen(true)" aria-label="Expand workflow items" aria-expanded="false">
        <i class="pi pi-angle-double-right"></i>
      </button>
    </div>
  `,
  styles: `
    .ws-items {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 284px;
      padding: 12px 15px;
      background: var(--ws-surface, #fff);
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 9px;
      box-shadow: 0 4px 16px rgb(20 30 50 / 12%);
    }
    .ws-items__text {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1 1 auto;
      min-width: 0;
    }
    .ws-items__workflow {
      font-size: 11px;
      letter-spacing: 0.4px;
      color: var(--ws-text-muted, #5a626f);
      text-transform: uppercase;
    }
    .ws-items__segment {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ws-text, #1b2330);
    }
    .ws-items__segment .pi { color: var(--ws-scope-accent, #2474bb); }
    .ws-items__toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 29px;
      height: 29px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--p-text-color, #1e293b);
      cursor: pointer;
    }
    .ws-items__toggle:hover { background: var(--p-surface-100, #f1f5f9); }
  `,
})
export class WorkflowItemsPanel {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly workflowNamePlaceholder = '{NAME OF THIS WORKFLOW}';
}
