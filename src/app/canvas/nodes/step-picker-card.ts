import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { StepTemplate } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

interface TemplateGroup {
  readonly category: string;
  readonly templates: readonly StepTemplate[];
  readonly open: ReturnType<typeof signal<boolean>>;
}

@Component({
  selector: 'ws-step-picker-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="picker">
      <header class="picker__head">
        <span class="picker__title">
          <i class="pi pi-plus-circle picker__title-icon"></i>
          Template Steps
        </span>
        <button class="picker__close" type="button" aria-label="Cancel" (click)="store.closeStepPicker()">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <!-- Blank Step — always first and most prominent -->
      <div class="picker__blank-wrap">
        <button class="picker__blank-btn" type="button" (click)="selectBlank()">
          <i class="pi pi-pencil"></i>
          Add Blank Step
        </button>
      </div>

      <div class="picker__body">
        <!-- System templates grouped by category -->
        @for (group of systemGroups(); track group.category) {
          <div class="picker__section">
            <button class="picker__section-hd" type="button" (click)="group.open.set(!group.open())">
              <span class="picker__section-label">{{ group.category }}</span>
              <i class="pi" [class.pi-chevron-up]="group.open()" [class.pi-chevron-down]="!group.open()"></i>
            </button>
            @if (group.open()) {
              <div class="picker__grid">
                @for (tpl of group.templates; track tpl.id) {
                  <button class="picker__tile" type="button" (click)="select(tpl)" [title]="tpl.description ?? tpl.name">
                    <span class="picker__tile-icon"><i class="pi pi-truck"></i></span>
                    <span class="picker__tile-name">{{ tpl.name }}</span>
                  </button>
                }
              </div>
            }
          </div>
        }

        <!-- User templates -->
        @if (userTemplates().length) {
          <div class="picker__section">
            <button class="picker__section-hd" type="button" (click)="userOpen.set(!userOpen())">
              <span class="picker__section-label">Created by you</span>
              <i class="pi" [class.pi-chevron-up]="userOpen()" [class.pi-chevron-down]="!userOpen()"></i>
            </button>
            @if (userOpen()) {
              <div class="picker__grid">
                @for (tpl of userTemplates(); track tpl.id) {
                  <button class="picker__tile" type="button" (click)="select(tpl)" [title]="tpl.description ?? tpl.name">
                    <span class="picker__tile-icon"><i class="pi pi-truck"></i></span>
                    <span class="picker__tile-name">{{ tpl.name }}</span>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; width: 460px; }

    .picker {
      background: #f0f9ff;
      border: 1.5px dashed var(--p-primary-400, #4da6d9);
      border-radius: 10px;
      box-shadow: 0 4px 18px rgba(36, 116, 187, 0.13), 0 1px 4px rgba(20, 30, 50, 0.08);
      overflow: hidden;
    }

    .picker__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 9px;
      background: #fff;
      border-bottom: 1px solid var(--p-primary-200, #bae0f7);
    }
    .picker__title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: var(--p-primary-600, #1b5f99);
    }
    .picker__title-icon { font-size: 14px; color: var(--p-primary-500, #2474bb); }
    .picker__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      font-size: 11px;
      cursor: pointer;
    }
    .picker__close:hover { background: #dbeafe; color: var(--p-primary-600, #1b5f99); }

    .picker__blank-wrap {
      padding: 10px 12px 8px;
      background: #fff;
      border-bottom: 1px solid var(--p-primary-100, #dbeafe);
    }
    .picker__blank-btn {
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
      transition: background 120ms, color 120ms;
    }
    .picker__blank-btn:hover { background: #dbeafe; border-color: var(--p-primary-500, #2474bb); }
    .picker__blank-btn i { font-size: 14px; }

    .picker__body {
      padding: 8px 10px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 224px;
      overflow-y: auto;
    }

    .picker__section { display: flex; flex-direction: column; gap: 6px; }
    .picker__section-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3px 2px;
      border: none;
      background: transparent;
      cursor: pointer;
      width: 100%;
    }
    .picker__section-hd i { font-size: 10px; color: var(--ws-text-faint, #8d9aae); }
    .picker__section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--p-primary-500, #2474bb);
    }

    .picker__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .picker__tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 6px;
      border: 1px solid var(--p-primary-200, #bae0f7);
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      text-align: center;
      aspect-ratio: 1;
      transition: background 100ms, border-color 100ms;
    }
    .picker__tile:hover {
      background: #dbeafe;
      border-color: var(--p-primary-400, #4da6d9);
    }

    .picker__tile-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background: #eff6ff;
    }
    .picker__tile-icon i {
      font-size: 18px;
      color: var(--p-primary-500, #2474bb);
    }
    .picker__tile:hover .picker__tile-icon { background: #bfdbfe; }

    .picker__tile-name {
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
export class StepPickerCard {
  protected readonly store = inject(WorkflowStudioStore);

  readonly insertIndex = input.required<number>();
  readonly segmentId = input.required<string>();

  protected readonly userOpen = signal(true);

  protected readonly systemGroups = computed<readonly TemplateGroup[]>(() => {
    const groups = new Map<string, StepTemplate[]>();
    for (const tpl of this.store.stepTemplates().filter(t => t.origin === 'system')) {
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

  protected readonly userTemplates = computed(() =>
    this.store.stepTemplates().filter(t => t.origin === 'user'),
  );

  protected select(tpl: StepTemplate): void {
    this.store.addStep(this.segmentId(), this.insertIndex(), tpl);
  }

  protected selectBlank(): void {
    this.store.addStep(this.segmentId(), this.insertIndex());
  }
}
