import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnChanges,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { BlockingCondition, ConditionGroup, ConditionStatement } from '@app/models';
import { PropertySectionComponent } from '../property-section/property-section.component';
import { ConditionBuilderComponent } from '../condition-builder/condition-builder.component';

interface ConditionsDraft {
  conditionalEnabled: boolean;
  condition: ConditionGroup | undefined;
  blockerEnabled: boolean;
  blockerMessage: string;
  blockerCondition: ConditionGroup | undefined;
}

function emptyGroup(): ConditionGroup {
  const stmt: ConditionStatement = { id: crypto.randomUUID(), rules: [] };
  return { enabled: true, statements: [stmt] };
}

function draftFromInputs(c: ConditionGroup | undefined, b: BlockingCondition | undefined): ConditionsDraft {
  return {
    conditionalEnabled: !!c?.enabled,
    condition: c,
    blockerEnabled: !!b?.enabled,
    blockerMessage: b?.message ?? '',
    blockerCondition: b?.condition,
  };
}

@Component({
  selector: 'ws-conditions-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    InputTextModule,
    ToggleSwitchModule,
    DialogModule,
    PropertySectionComponent,
    ConditionBuilderComponent,
  ],
  template: `
    <ws-property-section title="Conditions">

      <!-- Expand button lives in the section header via the sectionAction slot -->
      <button
        sectionAction
        type="button"
        class="cs-expand-btn"
        title="Open in expanded dialog"
        (click)="openDialog()"
      >
        <i class="pi pi-expand"></i>
      </button>

      <!-- ── Conditional (show/hide) ─────────────────────────────────────── -->
      <div class="cs-row">
        <div class="cs-row__label-group">
          <span class="cs-row__label">Conditional</span>
          <span class="cs-row__hint">Show only when condition is met</span>
        </div>
        <p-toggleswitch
          [ngModel]="draft().conditionalEnabled"
          (ngModelChange)="patch('conditionalEnabled', $event)"
        />
      </div>

      @if (draft().conditionalEnabled) {
        <div class="cs-builder-wrap">
          <ws-condition-builder
            [conditionGroup]="draft().condition"
            (conditionGroupChange)="patch('condition', $event)"
          />
        </div>
      }

      <div class="cs-divider"></div>

      <!-- ── Blocker ─────────────────────────────────────────────────────── -->
      <div class="cs-row">
        <div class="cs-row__label-group">
          <span class="cs-row__label">Blocker</span>
          <span class="cs-row__hint">Lock until condition is met</span>
        </div>
        <p-toggleswitch
          [ngModel]="draft().blockerEnabled"
          (ngModelChange)="patch('blockerEnabled', $event)"
        />
      </div>

      @if (draft().blockerEnabled) {
        <div class="cs-builder-wrap">
          <div class="cs-field">
            <label class="cs-field__label">Message shown while blocked</label>
            <input
              pInputText
              [ngModel]="draft().blockerMessage"
              (ngModelChange)="patch('blockerMessage', $event)"
              placeholder="e.g. Load must be delivered before completing this step"
              class="cs-field__input"
            />
          </div>
          <ws-condition-builder
            [conditionGroup]="draft().blockerCondition"
            (conditionGroupChange)="patch('blockerCondition', $event)"
          />
        </div>
      }

    </ws-property-section>

    <!-- ── Expanded conditions dialog ──────────────────────────────────── -->
    <p-dialog
      header="Conditions"
      [visible]="dialogOpen()"
      (visibleChange)="onDialogVisibleChange($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{width: '700px', maxHeight: '90vh'}"
      styleClass="cs-dialog"
      appendTo="body"
    >
      <div class="cs-dialog-body">

        <!-- Conditional section -->
        <div class="cs-dialog-section">
          <div class="cs-dialog-section__head">
            <div class="cs-dialog-section__title-group">
              <span class="cs-dialog-section__title">Conditional</span>
              <span class="cs-dialog-section__hint">Show only when condition is met</span>
            </div>
            <p-toggleswitch
              [ngModel]="dialogDraft().conditionalEnabled"
              (ngModelChange)="patchDialog('conditionalEnabled', $event)"
            />
          </div>
          @if (dialogDraft().conditionalEnabled) {
            <div class="cs-dialog-builder">
              <ws-condition-builder
                [conditionGroup]="dialogDraft().condition"
                (conditionGroupChange)="patchDialog('condition', $event)"
              />
            </div>
          }
        </div>

        <div class="cs-dialog-divider"></div>

        <!-- Blocker section -->
        <div class="cs-dialog-section">
          <div class="cs-dialog-section__head">
            <div class="cs-dialog-section__title-group">
              <span class="cs-dialog-section__title">Blocker</span>
              <span class="cs-dialog-section__hint">Lock until condition is met</span>
            </div>
            <p-toggleswitch
              [ngModel]="dialogDraft().blockerEnabled"
              (ngModelChange)="patchDialog('blockerEnabled', $event)"
            />
          </div>
          @if (dialogDraft().blockerEnabled) {
            <div class="cs-dialog-builder">
              <div class="cs-field">
                <label class="cs-field__label">Message shown while blocked</label>
                <input
                  pInputText
                  [ngModel]="dialogDraft().blockerMessage"
                  (ngModelChange)="patchDialog('blockerMessage', $event)"
                  placeholder="e.g. Load must be delivered before completing this step"
                  class="cs-field__input"
                />
              </div>
              <ws-condition-builder
                [conditionGroup]="dialogDraft().blockerCondition"
                (conditionGroupChange)="patchDialog('blockerCondition', $event)"
              />
            </div>
          }
        </div>

      </div>

      <ng-template pTemplate="footer">
        <div class="cs-dialog-footer">
          <button type="button" class="cs-dialog-btn cs-dialog-btn--cancel" (click)="cancelDialog()">Cancel</button>
          <button type="button" class="cs-dialog-btn cs-dialog-btn--save" (click)="saveDialog()">Apply</button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host { display: block; }

    /* ── Expand button in section header ─────────────────────────────── */
    .cs-expand-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border: none; border-radius: 4px;
      background: transparent; color: #6B7280; cursor: pointer; font-size: 12px;
    }
    .cs-expand-btn:hover { background: var(--p-surface-100, #F3F4F6); color: #111827; }

    /* ── Panel section content ──────────────────────────────────────── */
    .cs-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .cs-row__label-group { display: flex; flex-direction: column; gap: 2px; }
    .cs-row__label { font-size: 13px; font-weight: 600; color: #111827; }
    .cs-row__hint { font-size: 11px; color: #6B7280; }

    .cs-divider {
      height: 1px; background: #CBD5E1; margin: 4px 0;
    }

    .cs-builder-wrap {
      display: flex; flex-direction: column; gap: 10px;
      padding: 12px 14px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
    }

    .cs-field { display: flex; flex-direction: column; gap: 4px; }
    .cs-field__label { font-size: 11px; font-weight: 600; color: #374151; }
    .cs-field__input { width: 100%; font-size: 12px; }

    /* ── Dialog styles ──────────────────────────────────────────────── */
    .cs-dialog-body {
      display: flex; flex-direction: column; gap: 20px;
      padding: 4px 0;
    }

    .cs-dialog-section { display: flex; flex-direction: column; gap: 12px; }
    .cs-dialog-section__head {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .cs-dialog-section__title-group { display: flex; flex-direction: column; gap: 2px; }
    .cs-dialog-section__title { font-size: 14px; font-weight: 600; color: #111827; }
    .cs-dialog-section__hint { font-size: 12px; color: #6B7280; }

    .cs-dialog-divider { height: 1px; background: #CBD5E1; }

    .cs-dialog-builder {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px 16px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
    }

    .cs-dialog-footer {
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .cs-dialog-btn {
      padding: 8px 20px; border-radius: 6px; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .cs-dialog-btn--cancel {
      background: #F3F4F6; color: #374151; border: 1px solid #D1D5DB;
    }
    .cs-dialog-btn--cancel:hover { background: #E5E7EB; }
    .cs-dialog-btn--save {
      background: var(--p-primary-500, #2474BB); color: #fff;
    }
    .cs-dialog-btn--save:hover { background: var(--p-primary-600, #1E5FA0); }
  `],
})
export class ConditionsSectionComponent implements OnChanges {
  readonly condition = input<ConditionGroup | undefined>(undefined);
  readonly blocker   = input<BlockingCondition | undefined>(undefined);

  readonly conditionChange = output<ConditionGroup | undefined>();
  readonly blockerChange   = output<BlockingCondition | undefined>();

  protected readonly draft = signal<ConditionsDraft>({
    conditionalEnabled: false,
    condition: undefined,
    blockerEnabled: false,
    blockerMessage: '',
    blockerCondition: undefined,
  });

  protected readonly dialogOpen = signal(false);
  protected readonly dialogDraft = signal<ConditionsDraft>({
    conditionalEnabled: false,
    condition: undefined,
    blockerEnabled: false,
    blockerMessage: '',
    blockerCondition: undefined,
  });

  ngOnChanges(): void {
    this.draft.set(draftFromInputs(this.condition(), this.blocker()));
  }

  protected patch<K extends keyof ConditionsDraft>(key: K, value: ConditionsDraft[K]): void {
    this.draft.update(d => ({ ...d, [key]: value }));
    this.emit();
  }

  protected patchDialog<K extends keyof ConditionsDraft>(key: K, value: ConditionsDraft[K]): void {
    this.dialogDraft.update(d => ({ ...d, [key]: value }));
  }

  protected openDialog(): void {
    this.dialogDraft.set({ ...this.draft() });
    this.dialogOpen.set(true);
  }

  protected onDialogVisibleChange(visible: boolean): void {
    if (!visible) this.dialogOpen.set(false);
  }

  protected cancelDialog(): void {
    this.dialogOpen.set(false);
  }

  protected saveDialog(): void {
    this.draft.set({ ...this.dialogDraft() });
    this.emit();
    this.dialogOpen.set(false);
  }

  private emit(): void {
    const d = this.draft();

    const condition: ConditionGroup | undefined = d.conditionalEnabled
      ? (d.condition ?? emptyGroup())
      : undefined;

    const blocker: BlockingCondition | undefined = d.blockerEnabled
      ? {
          enabled: true,
          message: d.blockerMessage || undefined,
          condition: d.blockerCondition ?? emptyGroup(),
        }
      : undefined;

    this.conditionChange.emit(condition);
    this.blockerChange.emit(blocker);
  }
}
