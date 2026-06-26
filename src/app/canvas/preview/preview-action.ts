import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { Action, ACTION_TYPE_CATALOG, ActionType } from '@app/models';
import { PreviewRuntime } from './preview-runtime.service';

@Component({
  selector: 'ws-preview-action',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    InputTextModule, TextareaModule, InputNumberModule,
    SelectModule, MultiSelectModule, CheckboxModule, RadioButtonModule,
    DatePickerModule, SliderModule, ButtonModule,
  ],
  template: `
    <div class="pa" [class.pa--error]="isError()">
      @switch (cfg().actionType) {

        <!-- ── Input: TextField ──────────────────────────────────────── -->
        @case (ActionType.TextField) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          @if (cfg().type === 'paragraph') {
            <textarea
              pTextarea
              rows="3"
              class="pa__control"
              [placeholder]="action().label"
              [ngModel]="nv()"
              (ngModelChange)="set($event)"
            ></textarea>
          } @else {
            <input
              pInputText
              class="pa__control"
              [placeholder]="action().label"
              [ngModel]="nv()"
              (ngModelChange)="set($event)"
            />
          }
        }

        <!-- ── Input: NumericField ───────────────────────────────────── -->
        @case (ActionType.NumericField) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-inputnumber
            styleClass="w-full"
            [placeholder]="action().label"
            [ngModel]="nv()"
            (ngModelChange)="set($event)"
          />
        }

        <!-- ── Input: TemperatureField ──────────────────────────────── -->
        @case (ActionType.TemperatureField) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-inputnumber
            styleClass="w-full"
            suffix="°"
            [placeholder]="action().label"
            [ngModel]="nv()"
            (ngModelChange)="set($event)"
          />
        }

        <!-- ── Input: SingleSelectDropdown ──────────────────────────── -->
        @case (ActionType.SingleSelectDropdown) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-select
            styleClass="w-full"
            [placeholder]="cfg().placeholder || 'Select…'"
            [options]="dropdownOptions()"
            optionLabel="label"
            optionValue="value"
            [ngModel]="nv()"
            (ngModelChange)="set($event)"
          />
        }

        <!-- ── Input: MultiSelectDropdown ───────────────────────────── -->
        @case (ActionType.MultiSelectDropdown) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-multiselect
            styleClass="w-full"
            placeholder="Select…"
            [options]="dropdownOptions()"
            optionLabel="label"
            optionValue="value"
            [ngModel]="nv()"
            (ngModelChange)="set($event)"
          />
        }

        <!-- ── Input: RadioButton ────────────────────────────────────── -->
        @case (ActionType.RadioButton) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <div class="pa__radio-group">
            @for (opt of radioOptions(); track opt.value) {
              <div class="pa__radio-row">
                <p-radiobutton
                  [name]="action().id"
                  [value]="opt.value"
                  [ngModel]="nv()"
                  (ngModelChange)="set($event)"
                />
                <label class="pa__radio-label">{{ opt.label }}</label>
              </div>
            }
          </div>
        }

        <!-- ── Input: Checkbox ──────────────────────────────────────── -->
        @case (ActionType.Checkbox) {
          <label class="pa__label">{{ cfg().labelText || action().label }}{{ action().config.required ? ' *' : '' }}</label>
          @if (checkboxOptions().length) {
            <div class="pa__checkbox-group">
              @for (opt of checkboxOptions(); track opt.value) {
                <div class="pa__checkbox-row">
                  <p-checkbox
                    [name]="action().id"
                    [value]="opt.value"
                    [(ngModel)]="checkboxModel"
                    (ngModelChange)="set($event)"
                  />
                  <label class="pa__radio-label">{{ opt.label }}</label>
                </div>
              }
            </div>
          } @else {
            <div class="pa__checkbox-row">
              <p-checkbox
                [binary]="true"
                [ngModel]="nv()"
                (ngModelChange)="set($event)"
              />
              <label class="pa__radio-label">{{ action().label }}</label>
            </div>
          }
        }

        <!-- ── Input: Date ──────────────────────────────────────────── -->
        @case (ActionType.Date) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-datepicker styleClass="w-full" [ngModel]="nv()" (ngModelChange)="set($event)" />
        }

        <!-- ── Input: Datetime ──────────────────────────────────────── -->
        @case (ActionType.Datetime) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-datepicker styleClass="w-full" [showTime]="true" [ngModel]="nv()" (ngModelChange)="set($event)" />
        }

        <!-- ── Input: Time ──────────────────────────────────────────── -->
        @case (ActionType.Time) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-datepicker styleClass="w-full" [timeOnly]="true" [ngModel]="nv()" (ngModelChange)="set($event)" />
        }

        <!-- ── Input: MultiDateSelector ─────────────────────────────── -->
        @case (ActionType.MultiDateSelector) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <p-datepicker styleClass="w-full" selectionMode="multiple" [ngModel]="nv()" (ngModelChange)="set($event)" />
        }

        <!-- ── Input: TimeRangeSelector ─────────────────────────────── -->
        @case (ActionType.TimeRangeSelector) {
          <label class="pa__label">{{ action().label }}{{ action().config.required ? ' *' : '' }}</label>
          <div class="pa__time-range">
            <p-datepicker styleClass="w-full" [timeOnly]="true" placeholder="Start" [ngModel]="rangeStart()" (ngModelChange)="setRangeStart($event)" />
            <span class="pa__time-sep">to</span>
            <p-datepicker styleClass="w-full" [timeOnly]="true" placeholder="End" [ngModel]="rangeEnd()" (ngModelChange)="setRangeEnd($event)" />
          </div>
        }

        <!-- ── Input: Slider ────────────────────────────────────────── -->
        @case (ActionType.Slider) {
          <label class="pa__label">
            {{ cfg().labelText || action().label }}
            @if (nv() !== null && nv() !== undefined) { — {{ nv() }}{{ cfg().unitLabel ? ' ' + cfg().unitLabel : '' }} }
            {{ action().config.required ? ' *' : '' }}
          </label>
          <div class="pa__slider-row">
            @if (cfg().leftLabel) { <span class="pa__slider-cap">{{ cfg().leftLabel }}</span> }
            <p-slider
              class="pa__slider"
              [min]="cfg().min ?? 0"
              [max]="cfg().max ?? 100"
              [step]="cfg().step ?? 1"
              [ngModel]="nv() ?? cfg().defaultValue ?? cfg().min ?? 0"
              (ngModelChange)="set($event)"
            />
            @if (cfg().rightLabel) { <span class="pa__slider-cap">{{ cfg().rightLabel }}</span> }
          </div>
        }

        <!-- ── Input: Label (static heading text) ───────────────────── -->
        @case (ActionType.Label) {
          <p class="pa__label-text">{{ cfg().headingText || action().label }}</p>
        }

        <!-- ── Input: SimpleButton ──────────────────────────────────── -->
        @case (ActionType.SimpleButton) {
          <p-button [label]="cfg().buttonText || action().label" [outlined]="true" styleClass="w-full" />
        }

        <!-- ── Input: SideBySideButtons ─────────────────────────────── -->
        @case (ActionType.SideBySideButtons) {
          <div class="pa__sbs">
            <p-button [label]="cfg().button1Text || 'Option 1'" [outlined]="true" styleClass="flex-1" />
            <p-button [label]="cfg().button2Text || 'Option 2'" [outlined]="true" styleClass="flex-1" />
          </div>
        }

        <!-- ── NonInput: all other types → read-only chip ───────────── -->
        @default {
          <div class="pa__chip">
            <i class="pi {{ catalogIcon() }}"></i>
            <span>{{ catalogLabel() }}</span>
          </div>
        }

      }

      @if (isError()) {
        <span class="pa__error-hint">This field is required.</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }

    .pa { display: flex; flex-direction: column; gap: 4px; }

    .pa__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--p-surface-700, #334155);
      letter-spacing: 0.01em;
    }

    .pa__control { width: 100%; }
    .w-full { width: 100%; }
    .flex-1 { flex: 1 1 0; }

    .pa--error .pa__control,
    .pa--error input,
    .pa--error textarea {
      border-color: #ef4444 !important;
    }
    .pa__error-hint { font-size: 11px; color: #ef4444; }

    .pa__label-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--p-surface-800, #1e293b);
      margin: 0;
      padding: 2px 0;
    }

    .pa__radio-group, .pa__checkbox-group { display: flex; flex-direction: column; gap: 6px; }
    .pa__radio-row, .pa__checkbox-row { display: flex; align-items: center; gap: 8px; }
    .pa__radio-label { font-size: 13px; color: var(--p-surface-700, #334155); cursor: pointer; }

    .pa__sbs { display: flex; gap: 8px; }

    .pa__time-range { display: flex; align-items: center; gap: 8px; }
    .pa__time-sep { font-size: 12px; color: var(--p-surface-500, #64748b); white-space: nowrap; }

    .pa__slider-row { display: flex; align-items: center; gap: 8px; }
    .pa__slider { flex: 1; }
    .pa__slider-cap { font-size: 11px; color: var(--p-surface-500, #64748b); white-space: nowrap; }

    .pa__chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--p-surface-100, #f1f5f9);
      border: 1px solid var(--p-surface-200, #e2e8f0);
      color: var(--p-surface-600, #475569);
      font-size: 12px;
      font-weight: 500;
    }
    .pa__chip i { font-size: 13px; }
  `,
})
export class PreviewAction implements OnInit {
  readonly action = input.required<Action>();

  protected readonly runtime = inject(PreviewRuntime);
  protected readonly ActionType = ActionType;

  protected readonly nv = signal<unknown>(null);
  protected checkboxModel: string[] = [];

  ngOnInit(): void {
    const existing = this.runtime.getValue(this.action().id);
    if (existing !== undefined) {
      this.nv.set(existing);
      if (Array.isArray(existing)) this.checkboxModel = [...existing as string[]];
    }
  }

  protected set(val: unknown): void {
    this.nv.set(val);
    this.runtime.setValue(this.action().id, val);
  }

  protected readonly rangeStart = computed(() => {
    const v = this.runtime.getValue(this.action().id);
    return Array.isArray(v) ? (v[0] ?? null) : null;
  });
  protected readonly rangeEnd = computed(() => {
    const v = this.runtime.getValue(this.action().id);
    return Array.isArray(v) ? (v[1] ?? null) : null;
  });

  protected setRangeStart(val: unknown): void {
    const cur = this.runtime.getValue(this.action().id);
    const pair = Array.isArray(cur) ? [...cur] : [null, null];
    pair[0] = val;
    this.runtime.setValue(this.action().id, pair);
  }
  protected setRangeEnd(val: unknown): void {
    const cur = this.runtime.getValue(this.action().id);
    const pair = Array.isArray(cur) ? [...cur] : [null, null];
    pair[1] = val;
    this.runtime.setValue(this.action().id, pair);
  }

  protected readonly isError = computed(() => this.runtime.isFieldError(this.action()));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected readonly cfg = computed((): any => this.action().config);

  protected readonly dropdownOptions = computed(() => {
    const c = this.cfg();
    if (c.optionsSource?.kind === 'static') return c.optionsSource.options ?? [];
    return c.options ?? [];
  });

  protected readonly radioOptions   = computed(() => this.cfg().options ?? []);
  protected readonly checkboxOptions = computed(() => this.cfg().options ?? []);

  protected readonly catalogIcon  = computed(() => ACTION_TYPE_CATALOG[this.action().config.actionType]?.icon ?? 'pi-cog');
  protected readonly catalogLabel = computed(() => ACTION_TYPE_CATALOG[this.action().config.actionType]?.label ?? this.action().label);

  // Reset local value when the runtime is cleared (e.g., preview reset).
  private readonly _syncEffect = effect(() => {
    const val = this.runtime.values().get(this.action().id);
    if (val === undefined) untracked(() => this.nv.set(null));
  });
}
