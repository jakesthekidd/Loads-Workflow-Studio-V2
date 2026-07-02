import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ACTION_TYPE_CATALOG, Action, ActionCategory, ActionType, RequirementLevel, Step } from '@app/models';
import { WorkflowStudioStore } from '@app/services';

@Component({
  selector: 'ws-step-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-scene" [style.height.px]="cardHeight()" (dragover)="onDragOver($event)" (dragleave)="onDragLeave()" (drop)="onDrop($event)">
      <div class="card-flipper" [class.is-flipped]="flipped()">

        <!-- ── FRONT FACE — driver-facing form components ─────────────────── -->
        <div class="card-face card-face--front">
          <div class="card" [class.is-selected]="selected()" [class.has-selected-action]="hasSelectedAction()" [class.is-dragover]="isDragover()">
            <header class="card__head" (click)="store.select(step().id)">
              <button class="card__chev" type="button" [class.card__chev--collapsed]="collapsed()" (click)="$event.stopPropagation(); store.toggleExpand(step().id)" [attr.aria-label]="collapsed() ? 'Expand step' : 'Collapse step'"><i class="pi pi-chevron-down"></i></button>
              <span class="card__title"><span class="card__num">Step {{ index() }}:</span> {{ step().label }}</span>
              <span class="card__head-actions" (click)="$event.stopPropagation()">
                <button class="ico" type="button" [disabled]="index() === 1" (click)="store.reorderStep(segmentId(), index() - 1, index() - 2)" aria-label="Move step up"><i class="pi pi-arrow-up"></i></button>
                <button class="ico" type="button" [disabled]="index() === totalSteps()" (click)="store.reorderStep(segmentId(), index() - 1, index())" aria-label="Move step down"><i class="pi pi-arrow-down"></i></button>
                <span class="pill" [class.pill--optional]="isOptional()" [class.pill--required]="!isOptional()">{{ step().requirement }}</span>
                <button
                  type="button"
                  class="cond-btn"
                  [class.cond-btn--cond]="hasCondition() && !hasBlocker()"
                  [class.cond-btn--blk]="hasBlocker() && !hasCondition()"
                  [class.cond-btn--both]="hasCondition() && hasBlocker()"
                  [title]="condBtnTitle()"
                  (click)="store.openConditions(step().id)"
                >
                  @if (hasCondition() && hasBlocker()) {
                    <i class="pi pi-share-alt cond-icon--cond"></i>
                    <i class="pi pi-ban cond-icon--blk"></i>
                  } @else if (hasCondition()) {
                    <i class="pi pi-share-alt"></i>
                  } @else if (hasBlocker()) {
                    <i class="pi pi-ban"></i>
                  } @else {
                    <i class="pi pi-share-alt"></i>
                  }
                </button>
                <button class="ico" type="button" (click)="store.openProperties(step().id)" aria-label="Step properties"><i class="pi pi-ellipsis-v"></i></button>
              </span>
            </header>

            @if (!collapsed()) {
              <div class="card__rows">
                @for (action of frontActions(); track action.id; let fIdx = $index) {
                  <div class="row" [class.is-selected]="store.isSelected(action.id)" (click)="store.select(action.id)">
                    <span class="row__label">{{ action.label }}</span>
                    @if (action.config.required) { <span class="row__req" aria-label="Required">•</span> }
                    <span class="row__spacer"></span>
                    <span class="tag">{{ typeLabel(action) }}</span>
                    <span class="row__reorder">
                      <button class="ico" type="button" [disabled]="fIdx === 0" (click)="$event.stopPropagation(); store.reorderAction(step().id, gIdx(action), gIdx(frontActions()[fIdx - 1]))" aria-label="Move action up"><i class="pi pi-arrow-up"></i></button>
                      <button class="ico" type="button" [disabled]="fIdx === frontActions().length - 1" (click)="$event.stopPropagation(); store.reorderAction(step().id, gIdx(action), gIdx(frontActions()[fIdx + 1]))" aria-label="Move action down"><i class="pi pi-arrow-down"></i></button>
                    </span>
                    <button
                      type="button"
                      class="cond-btn cond-btn--sm"
                      [class.cond-btn--cond]="actionHasCondition(action) && !actionHasBlocker(action)"
                      [class.cond-btn--blk]="actionHasBlocker(action) && !actionHasCondition(action)"
                      [class.cond-btn--both]="actionHasCondition(action) && actionHasBlocker(action)"
                      [title]="actionCondTitle(action)"
                      (click)="$event.stopPropagation(); store.openConditions(action.id)"
                    >
                      @if (actionHasCondition(action) && actionHasBlocker(action)) {
                        <i class="pi pi-share-alt cond-icon--cond"></i>
                        <i class="pi pi-ban cond-icon--blk"></i>
                      } @else if (actionHasCondition(action)) {
                        <i class="pi pi-share-alt"></i>
                      } @else if (actionHasBlocker(action)) {
                        <i class="pi pi-ban"></i>
                      } @else {
                        <i class="pi pi-share-alt"></i>
                      }
                    </button>
                    <button class="ico" type="button" (click)="$event.stopPropagation(); store.openProperties(action.id)" aria-label="Action properties"><i class="pi pi-ellipsis-v"></i></button>
                  </div>
                }
              </div>

              <button class="card__add" type="button" (click)="$event.stopPropagation(); store.openActionLibrary(step().id, inputCategory)">
                <i class="pi pi-plus-circle"></i>
                Add Driver Action
              </button>
              <button class="card__flip" type="button" [title]="backActions().length ? backNames() : ''" (click)="$event.stopPropagation(); flipped.set(true)">
                View Backend Actions
                @if (backActions().length > 0) {
                  <span class="card__flip-count">{{ backActions().length }}</span>
                }
                <i class="pi pi-sync"></i>
              </button>
            }
          </div>
        </div>

        <!-- ── BACK FACE — backend / system actions ───────────────────────── -->
        <div class="card-face card-face--back">
          <div class="card card--dark" [class.is-selected]="selected()" [class.has-selected-action]="hasSelectedAction()" [class.is-dragover]="isDragover()">
            <header class="card__head card__head--dark" (click)="store.select(step().id)">
              <button class="card__chev card__chev--dark" type="button" [class.card__chev--collapsed]="collapsed()" (click)="$event.stopPropagation(); store.toggleExpand(step().id)" [attr.aria-label]="collapsed() ? 'Expand step' : 'Collapse step'"><i class="pi pi-chevron-down"></i></button>
              <span class="card__title card__title--dark"><span class="card__num card__num--dark">Step {{ index() }}:</span> {{ step().label }}</span>
              <span class="card__head-actions" (click)="$event.stopPropagation()">
                <button class="ico ico--dark" type="button" [disabled]="index() === 1" (click)="store.reorderStep(segmentId(), index() - 1, index() - 2)" aria-label="Move step up"><i class="pi pi-arrow-up"></i></button>
                <button class="ico ico--dark" type="button" [disabled]="index() === totalSteps()" (click)="store.reorderStep(segmentId(), index() - 1, index())" aria-label="Move step down"><i class="pi pi-arrow-down"></i></button>
                <span class="pill" [class.pill--optional]="isOptional()" [class.pill--required]="!isOptional()">{{ step().requirement }}</span>
                <button
                  type="button"
                  class="cond-btn cond-btn--dark"
                  [class.cond-btn--cond]="hasCondition() && !hasBlocker()"
                  [class.cond-btn--blk]="hasBlocker() && !hasCondition()"
                  [class.cond-btn--both]="hasCondition() && hasBlocker()"
                  [title]="condBtnTitle()"
                  (click)="store.openConditions(step().id)"
                >
                  @if (hasCondition() && hasBlocker()) {
                    <i class="pi pi-share-alt cond-icon--cond"></i>
                    <i class="pi pi-ban cond-icon--blk"></i>
                  } @else if (hasCondition()) {
                    <i class="pi pi-share-alt"></i>
                  } @else if (hasBlocker()) {
                    <i class="pi pi-ban"></i>
                  } @else {
                    <i class="pi pi-share-alt"></i>
                  }
                </button>
                <button class="ico ico--dark" type="button" (click)="store.openProperties(step().id)" aria-label="Step properties"><i class="pi pi-ellipsis-v"></i></button>
              </span>
            </header>

            @if (!collapsed()) {
              <div class="card__rows">
                @for (action of backActions(); track action.id; let bIdx = $index) {
                  <div class="row row--dark" [class.is-selected]="store.isSelected(action.id)" (click)="store.select(action.id)">
                    <span class="row__label row__label--dark">{{ action.label }}</span>
                    @if (action.config.required) { <span class="row__req" aria-label="Required">•</span> }
                    <span class="row__spacer"></span>
                    <span class="tag tag--dark">{{ typeLabel(action) }}</span>
                    <span class="row__reorder">
                      <button class="ico ico--dark" type="button" [disabled]="bIdx === 0" (click)="$event.stopPropagation(); store.reorderAction(step().id, gIdx(action), gIdx(backActions()[bIdx - 1]))" aria-label="Move action up"><i class="pi pi-arrow-up"></i></button>
                      <button class="ico ico--dark" type="button" [disabled]="bIdx === backActions().length - 1" (click)="$event.stopPropagation(); store.reorderAction(step().id, gIdx(action), gIdx(backActions()[bIdx + 1]))" aria-label="Move action down"><i class="pi pi-arrow-down"></i></button>
                    </span>
                    <button
                      type="button"
                      class="cond-btn cond-btn--sm cond-btn--dark"
                      [class.cond-btn--cond]="actionHasCondition(action) && !actionHasBlocker(action)"
                      [class.cond-btn--blk]="actionHasBlocker(action) && !actionHasCondition(action)"
                      [class.cond-btn--both]="actionHasCondition(action) && actionHasBlocker(action)"
                      [title]="actionCondTitle(action)"
                      (click)="$event.stopPropagation(); store.openConditions(action.id)"
                    >
                      @if (actionHasCondition(action) && actionHasBlocker(action)) {
                        <i class="pi pi-share-alt cond-icon--cond"></i>
                        <i class="pi pi-ban cond-icon--blk"></i>
                      } @else if (actionHasCondition(action)) {
                        <i class="pi pi-share-alt"></i>
                      } @else if (actionHasBlocker(action)) {
                        <i class="pi pi-ban"></i>
                      } @else {
                        <i class="pi pi-share-alt"></i>
                      }
                    </button>
                    <button class="ico ico--dark" type="button" (click)="$event.stopPropagation(); store.openProperties(action.id)" aria-label="Action properties"><i class="pi pi-ellipsis-v"></i></button>
                  </div>
                }
              </div>

              <button class="card__add card__add--dark" type="button" (click)="$event.stopPropagation(); store.openActionLibrary(step().id, nonInputCategory)">
                <i class="pi pi-plus-circle"></i>
                Add Backend Action
              </button>
              <button class="card__flip card__flip--dark" type="button" [title]="frontActions().length ? frontNames() : ''" (click)="$event.stopPropagation(); flipped.set(false)">
                View Driver Actions
                @if (frontActions().length > 0) {
                  <span class="card__flip-count card__flip-count--dark">{{ frontActions().length }}</span>
                }
                <i class="pi pi-sync"></i>
              </button>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: `
    :host { display: block; width: 460px; }

    /* ── 3-D flip scene ──────────────────────────────────────────────────── */
    .card-scene {
      perspective: 1200px;
      width: 460px;
    }
    .card-flipper {
      position: relative;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      transition: transform 380ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-flipper.is-flipped { transform: rotateY(180deg); }

    .card-face {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .card-face--back { transform: rotateY(180deg); }

    /* ── Base card ───────────────────────────────────────────────────────── */
    .card {
      background: var(--ws-surface, #fff);
      border: 1px solid var(--ws-border, #c6ccd6);
      border-left: 4px solid var(--ws-border-strong, #a9b3c2);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgb(20 30 50 / 10%), 0 1px 2px rgb(20 30 50 / 8%);
      padding: 12px;
      height: 100%;
      box-sizing: border-box;
    }
    .card.is-selected {
      border-color: var(--ws-sel-border, #3ba6d6);
      border-left-color: var(--ws-sel-accent, #72cdf4);
      box-shadow:
        0 0 0 3px var(--ws-sel-bg, #e3f5fd),
        0 0 0 5px var(--ws-sel-border, #3ba6d6),
        0 8px 24px rgb(20 30 50 / 20%);
    }
    .card.has-selected-action {
      border-color: var(--ws-sel-border, #3ba6d6);
      border-left-color: var(--ws-sel-accent, #72cdf4);
      box-shadow:
        0 0 0 2px var(--ws-sel-bg, #e3f5fd),
        0 6px 16px rgb(20 30 50 / 14%);
    }
    .card.is-dragover {
      border-color: var(--p-primary-400, #4da6d9);
      border-left-color: var(--p-primary-400, #4da6d9);
      box-shadow:
        0 0 0 3px var(--ws-sel-bg, #e3f5fd),
        0 0 0 5px var(--p-primary-400, #4da6d9),
        0 8px 24px rgb(20 30 50 / 20%);
    }

    /* ── Dark card (back face) ───────────────────────────────────────────── */
    .card--dark {
      background: #1e2d44;
      border-color: #2a3f5e;
      border-left-color: #3a5580;
    }
    .card--dark.is-selected {
      border-color: var(--ws-sel-border, #3ba6d6);
      border-left-color: var(--ws-sel-accent, #72cdf4);
    }
    .card--dark.has-selected-action {
      border-color: var(--ws-sel-border, #3ba6d6);
      border-left-color: var(--ws-sel-accent, #72cdf4);
    }
    .card--dark.is-dragover {
      border-color: var(--p-primary-400, #4da6d9);
      border-left-color: var(--p-primary-400, #4da6d9);
    }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .card__head { display: flex; align-items: center; gap: 8px; height: 40px; cursor: pointer; }
    .card__chev { border: none; background: transparent; color: var(--ws-text, #1b2330); cursor: pointer; padding: 0 2px; transition: transform 200ms ease; }
    .card__chev--dark { color: #a8bedb; }
    .card__chev--collapsed { transform: rotate(-90deg); }
    .card__title { font-size: 14px; color: var(--ws-text, #1b2330); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card__title--dark { color: #c8d8ec; }
    .card__num { font-weight: 600; color: var(--ws-text-muted, #5a626f); }
    .card__num--dark { color: #7a9bbf; }
    .card__head-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }

    /* ── Count pill inside the flip button ───────────────────────────────── */
    .card__flip-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      background: var(--p-primary-500, #2474bb);
      color: #fff;
    }
    .card__flip-count--dark {
      background: #7cc3e8;
      color: #1e2d44;
    }

    /* ── Pill ────────────────────────────────────────────────────────────── */
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

    /* ── Action rows ─────────────────────────────────────────────────────── */
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
    .row--dark { border-color: #2a3f5e; }
    .row--dark:hover { background: #243554; }
    .row--dark.is-selected { background: rgba(59,166,214,0.15); border-color: var(--ws-sel-border, #3ba6d6); }
    .row__label { font-size: 13px; font-weight: 500; color: var(--ws-text, #1b2330); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row__label--dark { color: #c8d8ec; }
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
    .tag--dark { background: #243554; color: #a8bedb; }

    /* ── Add action button ───────────────────────────────────────────────── */
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
    .card__add--dark { background: #243554; border-color: #3a5580; color: #7cc3e8; }
    .card__add--dark:hover { background: #2c4060; }

    /* ── Flip toggle button ──────────────────────────────────────────────── */
    .card__flip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 44px;
      margin-top: 8px;
      border: 1px solid var(--ws-border, #c6ccd6);
      border-radius: 8px;
      background: var(--p-surface-100, #f1f5f9);
      color: var(--ws-text-muted, #5a626f);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .card__flip:hover { background: var(--p-surface-200, #e2e8f0); color: var(--ws-text, #1b2330); }
    .card__flip--dark { background: #243554; border-color: #3a5580; color: #a8bedb; }
    .card__flip--dark:hover { background: #2c4060; color: #c8d8ec; }

    /* ── Condition state button ──────────────────────────────────────────── */
    .cond-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 2px;
      min-width: 26px; height: 26px; padding: 0 5px;
      border: none; border-radius: 4px;
      background: transparent; color: var(--ws-text-faint, #8d9aae);
      font-size: 11px; cursor: pointer; flex-shrink: 0;
    }
    .cond-btn:hover { background: var(--ws-hover, #eef1f6); color: var(--ws-text, #1b2330); }
    .cond-btn--dark { color: #7a9bbf; }
    .cond-btn--dark:hover { background: #243554; color: #c8d8ec; }
    /* Conditional-only: pink */
    .cond-btn--cond { background: #FCE7F3; color: #9D174D; }
    .cond-btn--cond:hover { background: #FBCFE8; }
    /* Blocker-only: orange */
    .cond-btn--blk { background: #FFEDD5; color: #C2410C; }
    .cond-btn--blk:hover { background: #FED7AA; }
    /* Both — each icon keeps its own color chip */
    .cond-btn--both { background: transparent; padding: 0 3px; }
    .cond-btn--both:hover { background: var(--ws-hover, #eef1f6); }
    .cond-icon--cond { color: #9D174D; background: #FCE7F3; border-radius: 3px; padding: 2px 3px; line-height: 1; }
    .cond-icon--blk  { color: #C2410C; background: #FFEDD5; border-radius: 3px; padding: 2px 3px; line-height: 1; }
    /* Smaller variant for action rows */
    .cond-btn--sm { min-width: 22px; height: 22px; font-size: 10px; }

    /* ── Icon button ─────────────────────────────────────────────────────── */
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
    .ico--dark { color: #7a9bbf; }
    .ico--dark:hover { background: #243554; color: #c8d8ec; }
    .ico--dark:disabled:hover { background: transparent; color: #7a9bbf; }
  `,
})
export class StepCard {
  protected readonly store = inject(WorkflowStudioStore);

  readonly step = input.required<Step>();
  readonly index = input.required<number>();
  readonly segmentId = input.required<string>();
  readonly totalSteps = input.required<number>();

  protected readonly inputCategory = ActionCategory.Input;
  protected readonly nonInputCategory = ActionCategory.NonInput;

  protected readonly flipped = signal(false);

  protected readonly frontActions = computed(() =>
    this.step().actions.filter(
      a => ACTION_TYPE_CATALOG[a.config.actionType]?.category === ActionCategory.Input,
    ),
  );
  protected readonly backActions = computed(() =>
    this.step().actions.filter(
      a => ACTION_TYPE_CATALOG[a.config.actionType]?.category === ActionCategory.NonInput,
    ),
  );

  protected readonly frontNames = computed(() =>
    this.frontActions().map(a => a.label).join('\n'),
  );
  protected readonly backNames = computed(() =>
    this.backActions().map(a => a.label).join('\n'),
  );

  /** Height of the card-scene, in px. Driven by the larger face so the card never
   *  reflows when flipping — Foblex doesn't observe ResizeObserver on flip. */
  protected readonly cardHeight = computed(() => {
    if (this.collapsed()) return 64;
    const rows = Math.max(this.frontActions().length, this.backActions().length);
    // 118 = base card height (header + add btn + padding/borders)
    // 52  = flip button (44px height + 8px margin-top)
    return 118 + 52 + 52 * rows;
  });

  protected readonly selected = computed(() => this.store.isSelected(this.step().id));
  protected readonly collapsed = computed(() => !this.store.isExpanded(this.step().id));
  protected readonly isOptional = computed(() => this.step().requirement === RequirementLevel.Optional);
  protected readonly hasSelectedAction = computed(() =>
    this.step().actions.some((a) => this.store.isSelected(a.id)),
  );
  protected readonly hasCondition = computed(() => !!this.step().condition?.enabled);
  protected readonly hasBlocker   = computed(() => !!this.step().blocker?.enabled);

  protected readonly condBtnTitle = computed(() => {
    const c = this.hasCondition(), b = this.hasBlocker();
    if (c && b) return 'Has conditional + blocker — click to edit';
    if (c) return 'Has conditional — click to edit';
    if (b) return 'Has blocker — click to edit';
    return 'Set conditions';
  });

  protected actionHasCondition(action: Action): boolean {
    return !!action.config.condition?.enabled;
  }
  protected actionHasBlocker(action: Action): boolean {
    return !!action.config.blocker?.enabled;
  }
  protected actionCondTitle(action: Action): string {
    const c = this.actionHasCondition(action), b = this.actionHasBlocker(action);
    if (c && b) return 'Has conditional + blocker — click to edit';
    if (c) return 'Has conditional — click to edit';
    if (b) return 'Has blocker — click to edit';
    return 'Set conditions';
  }

  protected typeLabel(action: Action): string {
    return ACTION_TYPE_CATALOG[action.config.actionType].label;
  }

  /** Global index of an action within step().actions (used for reorder calls). */
  protected gIdx(action: Action | undefined): number {
    if (!action) return -1;
    return this.step().actions.findIndex(a => a.id === action.id);
  }

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  protected readonly isDragover = signal(false);

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragover.set(true);
  }

  protected onDragLeave(): void {
    this.isDragover.set(false);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragover.set(false);
    const type = e.dataTransfer?.getData('text/ws-action-type') as ActionType | undefined;
    if (!type) return;
    const cat = ACTION_TYPE_CATALOG[type]?.category;
    if (cat === ActionCategory.NonInput) this.flipped.set(true);
    else if (cat === ActionCategory.Input) this.flipped.set(false);
    this.store.addAction(this.step().id, type);
  }
}
