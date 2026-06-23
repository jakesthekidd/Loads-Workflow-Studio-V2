import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import {
  ConditionFieldRef,
  ConditionGroup,
  ConditionOperator,
  ConditionRule,
  ConditionStatement,
} from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { DataSourceSelectorComponent, DssGeotabItem, DssJsonNode } from '../data-source-selector/data-source-selector.component';

// ─── Local draft types ────────────────────────────────────────────────────────

interface RuleDraft {
  id: string;
  field: ConditionFieldRef | null;
  operator: ConditionOperator;
  value: string;
  connector: 'AND' | 'OR';
  selectorOpen: boolean;
}

interface StatementDraft {
  id: string;
  rules: RuleDraft[];
  connector: 'AND' | 'OR';
}

// ─── Operators ────────────────────────────────────────────────────────────────

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'IsEqualTo',      label: 'Is Equal To'       },
  { value: 'IsNotEqualTo',   label: 'Is Not Equal To'   },
  { value: 'Contains',       label: 'Contains'          },
  { value: 'DoesNotContain', label: 'Does Not Contain'  },
  { value: 'IsEmpty',        label: 'Is Empty'          },
  { value: 'IsNotEmpty',     label: 'Is Not Empty'      },
  { value: 'GreaterThan',    label: 'Greater Than'      },
  { value: 'LessThan',       label: 'Less Than'         },
];

const VALUE_LESS_OPERATORS: ConditionOperator[] = ['IsEmpty', 'IsNotEmpty'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newRule(): RuleDraft {
  return { id: crypto.randomUUID(), field: null, operator: 'IsEqualTo', value: '', connector: 'AND', selectorOpen: false };
}

function newStatement(): StatementDraft {
  return { id: crypto.randomUUID(), rules: [newRule()], connector: 'AND' };
}

function statementsFromGroup(g: ConditionGroup | undefined): StatementDraft[] {
  if (!g || !g.statements.length) return [newStatement()];
  return g.statements.map(s => ({
    id: s.id,
    connector: s.connector ?? 'AND',
    rules: s.rules.length
      ? s.rules.map(r => ({
          id: r.id,
          field: r.field,
          operator: r.operator,
          value: r.value == null ? '' : String(r.value),
          connector: r.connector ?? 'AND',
          selectorOpen: false,
        }))
      : [newRule()],
  }));
}


@Component({
  selector: 'ws-condition-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SelectModule, InputTextModule, DataSourceSelectorComponent],
  template: `
    <div class="cb-wrap">

      @for (stmt of statements(); track stmt.id; let si = $index; let lastStmt = $last) {

        <!-- ── Statement card ─────────────────────────────────────────── -->
        <div class="cb-stmt">

          @for (rule of stmt.rules; track rule.id; let ri = $index; let lastRule = $last) {

            <!-- Rule row -->
            <div class="cb-rule">
              <!-- Field picker trigger -->
              <div class="cb-field" [class.cb-field--set]="!!rule.field" (click)="toggleSelector(si, ri)">
                <span class="cb-field__label">{{ rule.field ? rule.field.label : 'Select a value' }}</span>
                @if (rule.field?.path?.length) {
                  <span class="cb-field__path">{{ rule.field!.path!.join(' › ') }}</span>
                }
                <i class="pi pi-chevron-down cb-field__chevron"></i>
              </div>

              <!-- Operator -->
              <p-select
                [options]="operators"
                optionLabel="label"
                optionValue="value"
                [ngModel]="rule.operator"
                (ngModelChange)="setOperator(si, ri, $event)"
                styleClass="cb-operator"
                appendTo="body"
              />

              <!-- Value -->
              @if (!valueLessOps.includes(rule.operator)) {
                <input
                  pInputText
                  class="cb-value"
                  [ngModel]="rule.value"
                  (ngModelChange)="setValue(si, ri, $event)"
                  placeholder="Value"
                />
              }

              <!-- Remove rule -->
              <button type="button" class="cb-remove-rule" (click)="removeRule(si, ri)" title="Remove condition">
                <i class="pi pi-times-circle"></i>
              </button>
            </div>

            <!-- Inline data source selector -->
            @if (rule.selectorOpen) {
              <div class="cb-selector-wrap">
                <ws-data-source-selector
                  [embedded]="true"
                  [workflow]="workflowData()"
                  [geotab]="geotabData"
                  [json]="jsonData"
                  [value]="rule.field"
                  (valueChange)="onFieldSelected(si, ri, $event)"
                />
              </div>
            }

            <!-- AND/OR connector between rules (not after last rule) -->
            @if (!lastRule) {
              <div class="cb-rule-connector">
                <button
                  type="button"
                  class="cb-conn-btn"
                  [class.cb-conn-btn--active]="rule.connector === 'AND'"
                  (click)="setRuleConnector(si, ri, 'AND')"
                >AND</button>
                <button
                  type="button"
                  class="cb-conn-btn"
                  [class.cb-conn-btn--active]="rule.connector === 'OR'"
                  (click)="setRuleConnector(si, ri, 'OR')"
                >OR</button>
              </div>
            }
          }

          <!-- Add condition to this statement -->
          <button type="button" class="cb-add-rule" (click)="addRule(si)">
            <i class="pi pi-plus-circle"></i> Condition
          </button>

        </div>
        <!-- /cb-stmt -->

        <!-- AND/OR connector between statements (not after last statement) -->
        @if (!lastStmt) {
          <div class="cb-stmt-connector">
            <div class="cb-stmt-connector__line"></div>
            <div class="cb-stmt-connector__pills">
              <button
                type="button"
                class="cb-conn-btn cb-conn-btn--inv"
                [class.cb-conn-btn--inv-active]="stmt.connector === 'AND'"
                (click)="setStmtConnector(si, 'AND')"
              >AND</button>
              <button
                type="button"
                class="cb-conn-btn cb-conn-btn--inv"
                [class.cb-conn-btn--inv-active]="stmt.connector === 'OR'"
                (click)="setStmtConnector(si, 'OR')"
              >OR</button>
            </div>
            <div class="cb-stmt-connector__line"></div>
          </div>
        }

      }

      <!-- Add Statement -->
      <div class="cb-add-stmt">
        <div class="cb-add-stmt__line"></div>
        <button type="button" class="cb-add-stmt__btn" (click)="addStatement()">
          <i class="pi pi-plus-circle"></i> Add Statement
        </button>
        <div class="cb-add-stmt__line"></div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 0; }

    .cb-wrap { display: flex; flex-direction: column; gap: 0; }

    /* ── Statement card ──────────────────────────────────────────────────── */
    .cb-stmt {
      display: flex; flex-direction: column; gap: 6px;
      background: #fff;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 12px;
    }

    /* ── Rule row ────────────────────────────────────────────────────────── */
    .cb-rule {
      display: flex; align-items: center; gap: 6px;
    }
    .cb-field {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px;
      padding: 5px 10px; border: 1px solid var(--p-surface-300, #D1D5DB);
      border-radius: 6px; background: #fff; cursor: pointer; position: relative;
    }
    .cb-field:hover { border-color: var(--p-primary-400, #60A5FA); }
    .cb-field--set { border-color: var(--p-primary-500, #2474BB); }
    .cb-field__label { font-size: 12px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cb-field__path { font-size: 10px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cb-field__chevron { font-size: 10px; color: #6B7280; position: absolute; right: 8px; top: 50%; transform: translateY(-50%); }

    :host ::ng-deep .cb-operator { min-width: 130px; }
    :host ::ng-deep .cb-operator .p-select { font-size: 12px; }

    .cb-value {
      width: 100px; padding: 6px 10px; border: 1px solid var(--p-surface-300, #D1D5DB);
      border-radius: 6px; font-size: 12px; background: #fff; outline: none;
    }
    .cb-value:focus { border-color: var(--p-primary-500, #2474BB); }

    .cb-remove-rule {
      padding: 4px; border: none; background: transparent;
      color: #9CA3AF; cursor: pointer; border-radius: 4px; flex-shrink: 0;
      font-size: 14px; line-height: 1;
    }
    .cb-remove-rule:hover { color: #DC2626; }

    /* ── Data source selector ───────────────────────────────────────────── */
    .cb-selector-wrap {
      border: 1px solid #CBD5E1;
      border-radius: 6px; overflow: hidden;
    }

    /* ── AND/OR connector between rules ─────────────────────────────────── */
    .cb-rule-connector {
      display: flex; align-items: center; gap: 2px;
      margin: 0 2px;
    }

    /* ── Shared connector pill buttons ──────────────────────────────────── */
    .cb-conn-btn {
      padding: 3px 10px; border: 1px solid #CBD5E1; background: #fff;
      border-radius: 4px; font-size: 11px; font-weight: 600;
      color: #6B7280; cursor: pointer;
    }
    .cb-conn-btn:hover { background: #EFF6FF; border-color: var(--p-primary-400, #60A5FA); color: var(--p-primary-500, #2474BB); }
    .cb-conn-btn--active {
      background: var(--p-primary-500, #2474BB);
      border-color: var(--p-primary-500, #2474BB);
      color: #fff;
    }
    .cb-conn-btn--active:hover {
      background: var(--p-primary-600, #1E5FA0);
      border-color: var(--p-primary-600, #1E5FA0);
      color: #fff;
    }

    /* ── Add condition to statement ─────────────────────────────────────── */
    .cb-add-rule {
      display: inline-flex; align-items: center; gap: 5px; padding: 4px 0;
      background: transparent; border: none; color: var(--p-primary-500, #2474BB);
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .cb-add-rule:hover { color: var(--p-primary-600, #1E5FA0); }
    .cb-add-rule i { font-size: 13px; }

    /* ── Statement-level AND/OR separator ───────────────────────────────── */
    .cb-stmt-connector {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 12px;
      background: #374151;
      border-radius: 6px;
    }
    .cb-stmt-connector__line { flex: 1; height: 1px; background: #4B5563; }
    .cb-stmt-connector__pills { display: flex; gap: 2px; }

    .cb-conn-btn--inv {
      background: transparent; border-color: #4B5563; color: #9CA3AF;
    }
    .cb-conn-btn--inv:hover { background: #4B5563; border-color: #6B7280; color: #E5E7EB; }
    .cb-conn-btn--inv-active {
      background: var(--p-primary-500, #2474BB);
      border-color: var(--p-primary-500, #2474BB);
      color: #fff;
    }
    .cb-conn-btn--inv-active:hover {
      background: var(--p-primary-600, #1E5FA0);
      border-color: var(--p-primary-600, #1E5FA0);
      color: #fff;
    }

    /* ── Add Statement ───────────────────────────────────────────────────── */
    .cb-add-stmt {
      display: flex; align-items: center; gap: 10px; padding: 4px 0;
    }
    .cb-add-stmt__line { flex: 1; height: 1px; background: #CBD5E1; }
    .cb-add-stmt__btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 8px; border: none; background: transparent;
      color: var(--p-primary-500, #2474BB); font-size: 12px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    .cb-add-stmt__btn:hover { color: var(--p-primary-600, #1E5FA0); }
    .cb-add-stmt__btn i { font-size: 13px; }
  `],
})
export class ConditionBuilderComponent implements OnChanges {
  private readonly store = inject(WorkflowStudioStore);

  readonly conditionGroup = input<ConditionGroup | undefined>(undefined);
  readonly conditionGroupChange = output<ConditionGroup>();

  protected readonly statements = signal<StatementDraft[]>([newStatement()]);
  protected readonly operators = OPERATORS;
  protected readonly valueLessOps = VALUE_LESS_OPERATORS;

  // Data sources for the field picker
  protected readonly workflowData = this.store.dssWorkflowData;
  protected readonly geotabData: DssGeotabItem[] = [
    { id: 'dotNumber',         label: 'DOT Number'               },
    { id: 'driveTime',         label: 'Drive Time'               },
    { id: 'dutyStatus',        label: 'Duty Status'              },
    { id: 'hosRuleset',        label: 'HOS Ruleset'              },
    { id: 'remainingDrive',    label: 'Remaining Drive Time'     },
    { id: 'trailerAttachment', label: 'Trailer Attachment Status'},
  ];
  protected readonly jsonData: DssJsonNode[] = [];

  // Track the last group we emitted so ngOnChanges can skip round-trips
  private _lastEmitted: ConditionGroup | undefined = undefined;

  ngOnChanges(): void {
    const g = this.conditionGroup();
    if (g !== undefined && g === this._lastEmitted) return;
    this.statements.set(statementsFromGroup(g));
  }

  // ── Statement-level operations ────────────────────────────────────────────

  protected addStatement(): void {
    this.statements.update(ss => [...ss, newStatement()]);
    // No emit — new statement is empty, nothing meaningful to push yet
  }

  protected removeStatement(si: number): void {
    this.statements.update(ss => ss.filter((_, i) => i !== si));
    this.emit();
  }

  protected setStmtConnector(si: number, conn: 'AND' | 'OR'): void {
    this.statements.update(ss => ss.map((s, i) => i === si ? { ...s, connector: conn } : s));
    this.emit();
  }

  // ── Rule-level operations ─────────────────────────────────────────────────

  protected addRule(si: number): void {
    this.statements.update(ss => ss.map((s, i) =>
      i === si ? { ...s, rules: [...s.rules, newRule()] } : s
    ));
    // No emit — new rule is empty
  }

  protected removeRule(si: number, ri: number): void {
    this.statements.update(ss => {
      const stmt = ss[si];
      if (stmt.rules.length > 1) {
        // Remove just the rule
        return ss.map((s, i) => i === si ? { ...s, rules: s.rules.filter((_, j) => j !== ri) } : s);
      } else if (ss.length > 1) {
        // Last rule in statement — remove the whole statement
        return ss.filter((_, i) => i !== si);
      }
      // Last rule in last statement — keep at minimum 1 empty rule
      return ss;
    });
    this.emit();
  }

  protected setOperator(si: number, ri: number, op: ConditionOperator): void {
    this.patchRule(si, ri, { operator: op });
    this.emit();
  }

  protected setValue(si: number, ri: number, val: string): void {
    this.patchRule(si, ri, { value: val });
    this.emit();
  }

  protected setRuleConnector(si: number, ri: number, conn: 'AND' | 'OR'): void {
    this.patchRule(si, ri, { connector: conn });
    this.emit();
  }

  protected toggleSelector(si: number, ri: number): void {
    this.statements.update(ss => ss.map((s, i) =>
      i !== si ? s : {
        ...s,
        rules: s.rules.map((r, j) => ({ ...r, selectorOpen: j === ri ? !r.selectorOpen : false }))
      }
    ));
  }

  protected onFieldSelected(si: number, ri: number, field: ConditionFieldRef | null): void {
    this.patchRule(si, ri, { field, selectorOpen: false });
    this.emit();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private patchRule(si: number, ri: number, patch: Partial<RuleDraft>): void {
    this.statements.update(ss => ss.map((s, i) =>
      i !== si ? s : { ...s, rules: s.rules.map((r, j) => j === ri ? { ...r, ...patch } : r) }
    ));
  }

  private emit(): void {
    const stmts = this.statements();
    const built: ConditionStatement[] = [];

    for (let si = 0; si < stmts.length; si++) {
      const s = stmts[si];
      const rules = s.rules.reduce<ConditionRule[]>((acc, r, ri) => {
        if (!r.field) return acc;
        acc.push({
          id: r.id,
          field: r.field,
          operator: r.operator,
          value: r.value,
          ...(ri < s.rules.length - 1 ? { connector: r.connector } : {}),
        });
        return acc;
      }, []);
      if (!rules.length) continue;
      built.push({
        id: s.id,
        rules,
        ...(si < stmts.length - 1 ? { connector: s.connector } : {}),
      });
    }

    if (!built.length) return;
    const group: ConditionGroup = { enabled: true, statements: built };
    this._lastEmitted = group;
    this.conditionGroupChange.emit(group);
  }
}
