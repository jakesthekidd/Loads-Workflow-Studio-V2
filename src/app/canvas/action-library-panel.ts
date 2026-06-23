import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActionCategory, ActionType, ActionTypeCatalogEntry } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

@Component({
  selector: 'ws-action-library-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  template: `
    <div class="alib">
      <header class="alib__head">
        <span class="alib__title">Actions / Components / Widgets</span>
        <button class="alib__close" type="button" aria-label="Close" (click)="store.closeActionLibrary()">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <div class="alib__search">
        <i class="pi pi-search alib__search-icon"></i>
        <input
          class="alib__search-input"
          type="text"
          placeholder="Search..."
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
      </div>

      <div class="alib__body">
        @if (formComponents().length) {
          <div class="alib__section">
            <button class="alib__section-hd" type="button" (click)="formOpen.set(!formOpen())">
              <span class="alib__section-label">Form Components</span>
              <i class="pi" [class.pi-chevron-up]="formOpen()" [class.pi-chevron-down]="!formOpen()"></i>
            </button>
            @if (formOpen()) {
              <div class="alib__grid">
                @for (entry of formComponents(); track entry.type) {
                  <button
                    class="alib__tile alib__tile--form"
                    type="button"
                    draggable="true"
                    [title]="entry.description"
                    (dragstart)="onDragStart($event, entry)"
                    (click)="onTileClick(entry)"
                  >
                    <i class="pi alib__tile-icon" [ngClass]="entry.icon"></i>
                    <span class="alib__tile-label">{{ entry.label }}</span>
                  </button>
                }
              </div>
            }
          </div>
        }

        @if (backendActions().length) {
          <div class="alib__section">
            <button class="alib__section-hd" type="button" (click)="backendOpen.set(!backendOpen())">
              <span class="alib__section-label">Backend Actions</span>
              <i class="pi" [class.pi-chevron-up]="backendOpen()" [class.pi-chevron-down]="!backendOpen()"></i>
            </button>
            @if (backendOpen()) {
              <div class="alib__grid">
                @for (entry of backendActions(); track entry.type) {
                  <button
                    class="alib__tile alib__tile--backend"
                    type="button"
                    draggable="true"
                    [title]="entry.description"
                    (dragstart)="onDragStart($event, entry)"
                    (click)="onTileClick(entry)"
                  >
                    <i class="pi alib__tile-icon" [ngClass]="entry.icon"></i>
                    <span class="alib__tile-label">{{ entry.label }}</span>
                  </button>
                }
              </div>
            }
          </div>
        }

        @if (!store.actionLibraryTargetStepId()) {
          <p class="alib__hint">Drag a tile onto a step card to add it.</p>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      top: 90px;
      right: 14px;
      width: 360px;
      z-index: 200;
    }

    .alib {
      background: #fff;
      border: 1px solid #e2e6eb;
      border-radius: 12px;
      box-shadow: 0 8px 28px rgba(14, 46, 75, 0.18), 0 2px 8px rgba(14, 46, 75, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 110px);
    }

    .alib__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--ws-border, #c6ccd6);
      flex-shrink: 0;
    }
    .alib__title {
      font-size: 13px;
      font-weight: 700;
      color: var(--ws-text, #1b2330);
    }
    .alib__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      font-size: 12px;
      cursor: pointer;
    }
    .alib__close:hover { background: var(--ws-hover, #eef1f6); color: var(--ws-text, #1b2330); }

    .alib__search {
      position: relative;
      padding: 10px 12px 8px;
      border-bottom: 1px solid var(--ws-border, #c6ccd6);
      flex-shrink: 0;
    }
    .alib__search-icon {
      position: absolute;
      left: 22px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ws-text-faint, #8d9aae);
      font-size: 12px;
      pointer-events: none;
    }
    .alib__search-input {
      width: 100%;
      height: 32px;
      padding: 0 10px 0 30px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 6px;
      font-size: 12px;
      color: var(--ws-text, #1b2330);
      background: var(--p-surface-50, #f8fafc);
      outline: none;
      box-sizing: border-box;
    }
    .alib__search-input:focus { border-color: var(--p-primary-400, #4da6d9); background: #fff; }

    .alib__body {
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alib__section { display: flex; flex-direction: column; gap: 8px; }
    .alib__section-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 2px;
      border: none;
      background: transparent;
      cursor: pointer;
      width: 100%;
    }
    .alib__section-hd:hover .alib__section-label { color: var(--ws-text, #1b2330); }
    .alib__section-hd i { font-size: 10px; color: var(--ws-text-faint, #8d9aae); }
    .alib__section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ws-text-muted, #5a626f);
    }

    .alib__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .alib__tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 14px 6px 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: grab;
      user-select: none;
      text-align: center;
      transition: filter 100ms;
      aspect-ratio: 1;
    }
    .alib__tile:active { cursor: grabbing; }

    /* Form Component tiles — light gray */
    .alib__tile--form {
      background: var(--p-surface-100, #f1f5f9);
    }
    .alib__tile--form:hover {
      background: var(--p-surface-200, #e2e8f0);
      border-color: var(--p-primary-300, #7cc3e8);
    }
    .alib__tile--form .alib__tile-icon { color: var(--p-slate-600, #475569); font-size: 22px; }
    .alib__tile--form .alib__tile-label { color: var(--ws-text, #1b2330); }

    /* Backend Action tiles — dark navy */
    .alib__tile--backend {
      background: #1e2d44;
    }
    .alib__tile--backend:hover { background: #243554; border-color: var(--p-primary-400, #4da6d9); }
    .alib__tile--backend .alib__tile-icon { color: #c8d8ec; font-size: 22px; }
    .alib__tile--backend .alib__tile-label { color: #a8bedb; }

    .alib__tile-icon { line-height: 1; flex-shrink: 0; }
    .alib__tile-label {
      font-size: 10px;
      font-weight: 500;
      line-height: 1.25;
      max-width: 100%;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .alib__hint {
      font-size: 11px;
      color: var(--ws-text-muted, #5a626f);
      text-align: center;
      padding: 4px 0 2px;
      margin: 0;
    }
  `,
})
export class ActionLibraryPanel {
  protected readonly store = inject(WorkflowStudioStore);

  protected readonly search = signal('');
  protected readonly formOpen = signal(true);
  protected readonly backendOpen = signal(true);

  protected readonly formComponents = computed<readonly ActionTypeCatalogEntry[]>(() => {
    const q = this.search().toLowerCase();
    return this.store.actionCatalog().filter(
      e => e.category === ActionCategory.Input && !e.deferred &&
        (!q || e.label.toLowerCase().includes(q)),
    );
  });

  protected readonly backendActions = computed<readonly ActionTypeCatalogEntry[]>(() => {
    const q = this.search().toLowerCase();
    return this.store.actionCatalog().filter(
      e => e.category === ActionCategory.NonInput && !e.deferred &&
        (!q || e.label.toLowerCase().includes(q)),
    );
  });

  protected onDragStart(event: DragEvent, entry: ActionTypeCatalogEntry): void {
    event.dataTransfer!.setData('text/ws-action-type', entry.type);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  protected onTileClick(entry: ActionTypeCatalogEntry): void {
    const targetId = this.store.actionLibraryTargetStepId();
    if (targetId) {
      this.store.addAction(targetId, entry.type as ActionType);
    }
  }
}
