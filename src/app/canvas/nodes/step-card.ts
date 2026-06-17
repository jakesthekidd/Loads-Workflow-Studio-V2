import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ACTION_TYPE_CATALOG, Action, RequirementLevel, Step } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

/**
 * A Step rendered as a card on the canvas. The Step is the container; its
 * Actions are the rows inside. The card's accent + ring reflect the shared
 * selection (selecting here also highlights the matching tree row).
 */
@Component({
  selector: 'ws-step-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" [class.is-selected]="selected()">
      <header class="card__head" (click)="store.select(step().id)">
        <button class="card__chev" type="button" [class.card__chev--collapsed]="collapsed()" (click)="$event.stopPropagation(); store.toggleExpand(step().id)" [attr.aria-label]="collapsed() ? 'Expand step' : 'Collapse step'"><i class="pi pi-chevron-down"></i></button>
        <span class="card__title"><span class="card__num">Step {{ index() }}:</span> {{ step().label }}</span>
        <span class="card__head-actions" (click)="$event.stopPropagation()">
          <button class="ico" type="button" [disabled]="index() === 1" (click)="store.reorderStep(segmentId(), index() - 1, index() - 2)" aria-label="Move step up"><i class="pi pi-arrow-up"></i></button>
          <button class="ico" type="button" [disabled]="index() === totalSteps()" (click)="store.reorderStep(segmentId(), index() - 1, index())" aria-label="Move step down"><i class="pi pi-arrow-down"></i></button>
          <span class="pill" [class.pill--optional]="isOptional()" [class.pill--required]="!isOptional()">{{ step().requirement }}</span>
          <button class="ico" type="button" aria-label="Hierarchy"><i class="pi pi-sitemap"></i></button>
          <button class="ico" type="button" (click)="store.openProperties(step().id)" aria-label="Step properties"><i class="pi pi-ellipsis-v"></i></button>
        </span>
      </header>

      @if (!collapsed()) {
        <div class="card__rows">
          @for (action of step().actions; track action.id) {
            <div class="row" [class.is-selected]="store.isSelected(action.id)" (click)="store.select(action.id)">
              <span class="row__label">{{ action.label }}</span>
              @if (action.config.required) { <span class="row__req" aria-label="Required">•</span> }
              <span class="row__spacer"></span>
              <span class="tag">{{ typeLabel(action) }}</span>
              <span class="row__reorder">
                <button class="ico" type="button" [disabled]="$index === 0" (click)="$event.stopPropagation(); store.reorderAction(step().id, $index, $index - 1)" aria-label="Move action up"><i class="pi pi-arrow-up"></i></button>
                <button class="ico" type="button" [disabled]="$index === step().actions.length - 1" (click)="$event.stopPropagation(); store.reorderAction(step().id, $index, $index + 1)" aria-label="Move action down"><i class="pi pi-arrow-down"></i></button>
              </span>
              <button class="ico" type="button" (click)="$event.stopPropagation()" aria-label="Hierarchy"><i class="pi pi-sitemap"></i></button>
              <button class="ico" type="button" (click)="$event.stopPropagation(); store.openProperties(action.id)" aria-label="Action properties"><i class="pi pi-ellipsis-v"></i></button>
            </div>
          }
        </div>

        <button class="card__add" type="button" (click)="$event.stopPropagation()">
          <i class="pi pi-plus-circle"></i>
          Add Action
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; width: 460px; }
    .card {
      background: var(--ws-surface, #fff);
      border: 1px solid var(--ws-border, #c6ccd6);
      border-left: 4px solid var(--ws-border-strong, #a9b3c2);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgb(20 30 50 / 10%), 0 1px 2px rgb(20 30 50 / 8%);
      padding: 12px;
    }
    .card.is-selected {
      border-color: var(--ws-sel-border, #3ba6d6);
      border-left-color: var(--ws-sel-accent, #72cdf4);
      box-shadow: 0 0 0 2px var(--ws-sel-bg, #e3f5fd), 0 6px 16px rgb(20 30 50 / 14%);
    }

    .card__head { display: flex; align-items: center; gap: 8px; height: 40px; cursor: pointer; }
    .card__chev { border: none; background: transparent; color: var(--ws-text, #1b2330); cursor: pointer; padding: 0 2px; transition: transform 200ms ease; }
    .card__chev--collapsed { transform: rotate(-90deg); }
    .card__title { font-size: 14px; color: var(--ws-text, #1b2330); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card__num { font-weight: 600; color: var(--ws-text-muted, #5a626f); }
    .card__head-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }

    .pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    /* TODO (token): no purple semantic token yet — using literals. */
    .pill--optional { background: #efe1fb; color: #6b21a8; }
    .pill--required { background: var(--ws-scope-bg, #e9f1f8); color: #15486f; }

    .card__rows { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 10px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 6px;
      cursor: pointer;
    }
    .row:hover { background: var(--ws-hover, #eef1f6); }
    .row.is-selected { background: var(--ws-sel-bg, #e3f5fd); border-color: var(--ws-sel-border, #3ba6d6); }
    .row__label { font-size: 13px; font-weight: 500; color: var(--ws-text, #1b2330); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row__reorder {
      display: inline-flex;
      align-items: center;
      gap: 0;
      padding-right: 6px;
      margin-right: 2px;
      border-right: 1px solid var(--ws-border, #c6ccd6);
    }
    .row__req { color: #c41c28; font-weight: 700; line-height: 1; }
    .row__spacer { flex: 1 1 auto; }
    .tag {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      background: var(--ws-scope-bg, #e9f1f8);
      color: #15486f;
      white-space: nowrap;
    }

    .card__add {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 40px;
      margin-top: 12px;
      border: 1px dashed var(--ws-border-strong, #a9b3c2);
      border-radius: 6px;
      background: var(--ws-surface, #fff);
      color: var(--ws-scope-accent, #2068a8);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .card__add:hover { background: var(--ws-hover, #eef1f6); }

    .ico {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--ws-text-faint, #8d9aae);
      font-size: 13px;
      cursor: pointer;
    }
    .ico:hover { background: var(--ws-hover, #eef1f6); color: var(--ws-text, #1b2330); }
    .ico:disabled { opacity: 0.3; cursor: default; }
    .ico:disabled:hover { background: transparent; color: var(--ws-text-faint, #8d9aae); }
  `,
})
export class StepCard {
  protected readonly store = inject(WorkflowStudioStore);

  readonly step = input.required<Step>();
  readonly index = input.required<number>();
  readonly segmentId = input.required<string>();
  readonly totalSteps = input.required<number>();

  protected readonly selected = computed(() => this.store.isSelected(this.step().id));
  protected readonly collapsed = computed(() => !this.store.isExpanded(this.step().id));
  protected readonly isOptional = computed(() => this.step().requirement === RequirementLevel.Optional);

  protected typeLabel(action: Action): string {
    return ACTION_TYPE_CATALOG[action.config.actionType].label;
  }
}
