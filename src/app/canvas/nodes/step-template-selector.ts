import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { StepTemplate } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

interface TemplateGroup {
  readonly category: string;
  readonly templates: readonly StepTemplate[];
  readonly open: ReturnType<typeof signal<boolean>>;
}

/**
 * Shared template browser content — used by both the inline StepPickerCard
 * and the floating StepLibraryPanel. The parent handles the actual add call
 * since segment/insertIndex differ between the two contexts.
 */
@Component({
  selector: 'ws-step-template-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Search -->
    <div class="sel__search">
      <i class="pi pi-search sel__search-icon"></i>
      <input
        class="sel__search-input"
        type="text"
        placeholder="Search..."
        [value]="search()"
        (input)="search.set($any($event.target).value)"
      />
    </div>

    <!-- Add Blank Step — always first -->
    <button class="sel__blank-btn" type="button" (click)="selectBlank.emit()">
      <i class="pi pi-pencil"></i>
      Add Blank Step
    </button>

    <!-- System templates grouped by category -->
    @for (group of systemGroups(); track group.category) {
      <div class="sel__section">
        <button class="sel__section-hd" type="button" (click)="group.open.set(!group.open())">
          <span class="sel__section-label">{{ group.category }}</span>
          <i class="pi" [class.pi-chevron-up]="group.open()" [class.pi-chevron-down]="!group.open()"></i>
        </button>
        @if (group.open()) {
          <div class="sel__grid">
            @for (tpl of group.templates; track tpl.id) {
              <button class="sel__tile" type="button" (click)="selectTemplate.emit(tpl)" [title]="tpl.description ?? tpl.name">
                <span class="sel__tile-icon"><i class="pi pi-truck"></i></span>
                <span class="sel__tile-name">{{ tpl.name }}</span>
              </button>
            }
          </div>
        }
      </div>
    }

    <!-- User templates -->
    @if (hasUserTemplates()) {
      <div class="sel__section">
        <button class="sel__section-hd" type="button" (click)="userOpen.set(!userOpen())">
          <span class="sel__section-label">Created By You</span>
          <i class="pi" [class.pi-chevron-up]="userOpen()" [class.pi-chevron-down]="!userOpen()"></i>
        </button>
        @if (userOpen()) {
          <div class="sel__grid">
            @for (tpl of userTemplates(); track tpl.id) {
              <button class="sel__tile" type="button" (click)="selectTemplate.emit(tpl)" [title]="tpl.description ?? tpl.name">
                <span class="sel__tile-icon"><i class="pi pi-truck"></i></span>
                <span class="sel__tile-name">{{ tpl.name }}</span>
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 10px; }

    .sel__search {
      position: relative;
      flex-shrink: 0;
    }
    .sel__search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ws-text-faint, #8d9aae);
      font-size: 12px;
      pointer-events: none;
    }
    .sel__search-input {
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
    .sel__search-input:focus { border-color: var(--p-primary-400, #4da6d9); background: #fff; }

    .sel__blank-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 38px;
      border: 1.5px solid var(--p-primary-400, #4da6d9);
      border-radius: 6px;
      background: transparent;
      color: var(--p-primary-600, #1b5f99);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 120ms;
    }
    .sel__blank-btn:hover { background: #dbeafe; border-color: var(--p-primary-500, #2474bb); }
    .sel__blank-btn i { font-size: 13px; }

    .sel__section { display: flex; flex-direction: column; gap: 8px; }
    .sel__section-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 0;
      border: none;
      background: transparent;
      cursor: pointer;
      width: 100%;
    }
    .sel__section-hd i { font-size: 10px; color: var(--ws-text-faint, #8d9aae); }
    .sel__section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ws-text-muted, #5a626f);
    }

    .sel__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .sel__tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 4px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      text-align: center;
      aspect-ratio: 1;
      transition: background 100ms, border-color 100ms;
    }
    .sel__tile:hover {
      background: var(--ws-hover, #eef1f6);
      border-color: var(--p-primary-300, #7cc3e8);
    }
    .sel__tile-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--p-surface-100, #f1f5f9);
    }
    .sel__tile-icon i { font-size: 16px; color: var(--p-primary-500, #2474bb); }
    .sel__tile:hover .sel__tile-icon { background: #dbeafe; }
    .sel__tile-name {
      font-size: 10px;
      font-weight: 600;
      color: var(--ws-text, #1b2330);
      line-height: 1.25;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  `,
})
export class StepTemplateSelectorComponent {
  private readonly store = inject(WorkflowStudioStore);

  readonly selectTemplate = output<StepTemplate>();
  readonly selectBlank = output<void>();

  protected readonly search = signal('');
  protected readonly userOpen = signal(true);

  protected readonly systemGroups = computed<readonly TemplateGroup[]>(() => {
    const q = this.search().toLowerCase();
    const groups = new Map<string, StepTemplate[]>();
    for (const tpl of this.store.stepTemplates().filter(t => t.origin === 'system')) {
      if (q && !tpl.name.toLowerCase().includes(q)) continue;
      const existing = groups.get(tpl.category);
      if (existing) existing.push(tpl);
      else groups.set(tpl.category, [tpl]);
    }
    return Array.from(groups.entries()).map(([category, templates]) => ({
      category,
      templates,
      open: signal(true),
    }));
  });

  protected readonly userTemplates = computed(() => {
    const q = this.search().toLowerCase();
    return this.store.stepTemplates().filter(
      t => t.origin === 'user' && (!q || t.name.toLowerCase().includes(q)),
    );
  });

  protected readonly hasUserTemplates = computed(() => this.userTemplates().length > 0);
}
