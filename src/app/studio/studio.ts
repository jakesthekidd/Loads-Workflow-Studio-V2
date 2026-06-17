import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { WorkflowStudioStore } from '@app/services';
import { Canvas } from '../canvas/canvas';
import { WorkflowItemsTree } from '../canvas/workflow-items-tree';
import { AppHeader } from '../shell/app-header';
import { AppNavRail } from '../shell/app-nav-rail';

/**
 * Workflow Studio shell: global header on top, 66px app rail on the left, the
 * Workflow Items tree (when open) as a docked column, then the canvas work area.
 */
@Component({
  selector: 'ws-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppHeader, AppNavRail, Canvas, WorkflowItemsTree],
  template: `
    <div class="ws-studio">
      <ws-app-header />
      <div class="ws-studio__body">
        <ws-app-nav-rail />
        @if (store.panelOpen()) {
          <ws-workflow-items-tree />
        }
        <main class="ws-studio__work">
          <ws-canvas />
        </main>
      </div>
    </div>
  `,
  styles: `
    .ws-studio {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .ws-studio__body {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
    }
    .ws-studio__work {
      flex: 1 1 auto;
      min-width: 0;
    }
  `,
})
export class Studio implements OnInit {
  protected readonly store = inject(WorkflowStudioStore);

  ngOnInit(): void {
    this.store.load();
  }
}
