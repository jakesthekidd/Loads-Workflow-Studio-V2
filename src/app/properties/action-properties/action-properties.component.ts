import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  signal,
} from '@angular/core';
import {
  AcceptWorkflowConfig,
  Action,
  ActionConfig,
  ActionType,
  BarcodeScannerConfig,
  BlockingCondition,
  CertLogsConfig,
  CheckboxConfig,
  ConditionGroup,
  GenerateEmailFromTFLOConfig,
  GeneratePushAlertConfig,
  GenerateSMSFromTFLOConfig,
  GetDeviceLocationConfig,
  GetELDLocationConfig,
  LabelConfig,
  LaunchWebviewConfig,
  MultiSelectDropdownConfig,
  RadioButtonConfig,
  RejectWorkflowConfig,
  SelectOption,
  SideBySideButtonsConfig,
  SimpleButtonConfig,
  SingleSelectDropdownConfig,
  SliderConfig,
  Step,
  StopActualizationConfig,
  TemperatureFieldConfig,
  TextFieldConfig,
  TimerStopwatchConfig,
  TriggerGeofenceConfig,
} from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { ACTION_TYPE_CATALOG } from '@app/models';
import { PanelShellComponent } from '../shared/panel-shell/panel-shell.component';
import { PropertySectionComponent } from '../shared/property-section/property-section.component';
import { PropertyToggleRowComponent } from '../shared/property-toggle-row/property-toggle-row.component';
import { AcceptWorkflowSettingsComponent } from './settings/accept-workflow-settings.component';
import { BarcodeScannerSettingsComponent } from './settings/barcode-scanner-settings.component';
import { CertLogsSettingsComponent } from './settings/cert-logs-settings.component';
import { GenerateEmailSettingsComponent } from './settings/generate-email-settings.component';
import { GeneratePushAlertSettingsComponent } from './settings/generate-push-alert-settings.component';
import { GenerateSmsSettingsComponent } from './settings/generate-sms-settings.component';
import { GetDeviceLocationSettingsComponent } from './settings/get-device-location-settings.component';
import { GetEldLocationSettingsComponent } from './settings/get-eld-location-settings.component';
import { LabelSettingsComponent } from './settings/label-settings.component';
import { LaunchWebviewSettingsComponent } from './settings/launch-webview-settings.component';
import { RadioCheckboxSettingsComponent } from './settings/radio-checkbox-settings.component';
import { RejectWorkflowSettingsComponent } from './settings/reject-workflow-settings.component';
import { SelectionDropdownSettingsComponent } from './settings/selection-dropdown-settings.component';
import { SideBySideButtonsSettingsComponent } from './settings/side-by-side-buttons-settings.component';
import { SimpleButtonSettingsComponent } from './settings/simple-button-settings.component';
import { SliderSettingsComponent } from './settings/slider-settings.component';
import { StopActualizationSettingsComponent } from './settings/stop-actualization-settings.component';
import { TemperatureFieldSettingsComponent } from './settings/temperature-field-settings.component';
import { TextFieldSettingsComponent } from './settings/text-field-settings.component';
import { TimerStopwatchSettingsComponent } from './settings/timer-stopwatch-settings.component';
import { TriggerGeofenceSettingsComponent } from './settings/trigger-geofence-settings.component';
import { ConditionsSectionComponent } from '../shared/conditions-section/conditions-section.component';

interface BaseDraft {
  required: boolean;
  visible: boolean;
  condition: ConditionGroup | undefined;
  blocker: BlockingCondition | undefined;
}

const NO_REQUIRED_TYPES = new Set<ActionType>([
  ActionType.Label,
  ActionType.TemperatureField,
  ActionType.SideBySideButtons,
]);

@Component({
  selector: 'ws-action-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PanelShellComponent,
    PropertySectionComponent,
    PropertyToggleRowComponent,
    AcceptWorkflowSettingsComponent,
    RejectWorkflowSettingsComponent,
    StopActualizationSettingsComponent,
    BarcodeScannerSettingsComponent,
    TriggerGeofenceSettingsComponent,
    GeneratePushAlertSettingsComponent,
    GenerateEmailSettingsComponent,
    GenerateSmsSettingsComponent,
    GetDeviceLocationSettingsComponent,
    GetEldLocationSettingsComponent,
    CertLogsSettingsComponent,
    SelectionDropdownSettingsComponent,
    RadioCheckboxSettingsComponent,
    TextFieldSettingsComponent,
    SliderSettingsComponent,
    SimpleButtonSettingsComponent,
    LaunchWebviewSettingsComponent,
    TimerStopwatchSettingsComponent,
    LabelSettingsComponent,
    SideBySideButtonsSettingsComponent,
    TemperatureFieldSettingsComponent,
    ConditionsSectionComponent,
  ],
  template: `
    <ws-panel-shell
      [title]="action().label"
      [typeBadge]="typeBadge()"
      (save)="onSave()"
      (cancel)="store.closeProperties()"
    >
      <!-- Define Action -->
      <ws-property-section title="Define Action">
        @if (!noRequired()) {
          <ws-property-toggle-row
            label="REQUIRED"
            [value]="baseDraft().required"
            (valueChange)="patchBase('required', $event)"
          />
        }
        <ws-property-toggle-row
          label="Visible"
          [value]="baseDraft().visible"
          (valueChange)="patchBase('visible', $event)"
        />
      </ws-property-section>

      <!-- Settings (type-specific) -->
      <ws-property-section title="Settings">
        @switch (action().config.actionType) {
          @case (ActionType.AcceptWorkflow) {
            <ws-accept-workflow-settings
              [(buttonText)]="acceptDraft().buttonText"
              [(buttonType)]="acceptDraft().buttonType"
            />
          }
          @case (ActionType.RejectWorkflow) {
            <ws-reject-workflow-settings
              [(buttonText)]="rejectDraft().buttonText"
              [(buttonType)]="rejectDraft().buttonType"
            />
          }
          @case (ActionType.StopActualization) {
            <ws-stop-actualization-settings
              [(trigger)]="stopDraft().trigger"
              [(geofenceId)]="stopDraft().geofenceId"
              [(promptManualConfirm)]="stopDraft().promptManualConfirm"
            />
          }
          @case (ActionType.BarcodeScanner) {
            <ws-barcode-scanner-settings
              [(repeatable)]="barcodeDraft().repeatable"
              [(labelText)]="barcodeDraft().labelText"
            />
          }
          @case (ActionType.TriggerGeofence) {
            <ws-trigger-geofence-settings
              [(trigger)]="geofenceDraft().trigger"
              [(dwellSeconds)]="geofenceDraft().dwellSeconds"
            />
          }
          @case (ActionType.GeneratePushAlert) {
            <ws-generate-push-alert-settings
              [(pushAlertText)]="pushAlertDraft().pushAlertText"
              [(trigger)]="pushAlertDraft().trigger"
            />
          }
          @case (ActionType.GenerateEmailFromTFLO) {
            <ws-generate-email-settings
              [(prePopulate)]="emailDraft().prePopulate"
              [(trigger)]="emailDraft().trigger"
              [(recipientType)]="emailDraft().recipientType"
              [(recipientValue)]="emailDraft().recipientValue"
              [(subject)]="emailDraft().subject"
              [(selectedActionIds)]="emailDraft().selectedActionIds"
              [(additionalBody)]="emailDraft().additionalBody"
            />
          }
          @case (ActionType.GenerateSMSFromTFLO) {
            <ws-generate-sms-settings
              [(prePopulate)]="smsDraft().prePopulate"
              [(trigger)]="smsDraft().trigger"
              [(recipientType)]="smsDraft().recipientType"
              [(recipientValue)]="smsDraft().recipientValue"
              [(subject)]="smsDraft().subject"
              [(selectedActionIds)]="smsDraft().selectedActionIds"
              [(additionalBody)]="smsDraft().additionalBody"
            />
          }
          @case (ActionType.GetDeviceLocation) {
            <ws-get-device-location-settings [(trigger)]="deviceLocationDraft().trigger" />
          }
          @case (ActionType.GetELDLocation) {
            <ws-get-eld-location-settings
              [(trigger)]="eldLocationDraft().trigger"
              [(geofenceId)]="eldLocationDraft().geofenceId"
              [(promptManualConfirm)]="eldLocationDraft().promptManualConfirm"
            />
          }
          @case (ActionType.CertLogs) {
            <ws-cert-logs-settings
              [(titleLabel)]="certLogsDraft().titleLabel"
              [(bodyTextLabel)]="certLogsDraft().bodyTextLabel"
            />
          }
          @case (ActionType.SingleSelectDropdown) {
            <ws-selection-dropdown-settings
              [(labelText)]="singleDropdownDraft().labelText"
              [(prePopulate)]="singleDropdownDraft().prePopulate"
              [(prePopulateSource)]="singleDropdownDraft().prePopulateSource"
              [(prePopulateValue)]="singleDropdownDraft().prePopulateValue"
              [(readOnly)]="singleDropdownDraft().readOnly"
              [(editableIfNull)]="singleDropdownDraft().editableIfNull"
              [(selectionType)]="singleDropdownDraft().selectionType"
              [(options)]="singleDropdownDraft().options"
            />
          }
          @case (ActionType.MultiSelectDropdown) {
            <ws-selection-dropdown-settings
              [(labelText)]="multiDropdownDraft().labelText"
              [(prePopulate)]="multiDropdownDraft().prePopulate"
              [(prePopulateSource)]="multiDropdownDraft().prePopulateSource"
              [(prePopulateValue)]="multiDropdownDraft().prePopulateValue"
              [(readOnly)]="multiDropdownDraft().readOnly"
              [(editableIfNull)]="multiDropdownDraft().editableIfNull"
              [(selectionType)]="multiDropdownDraft().selectionType"
              [(options)]="multiDropdownDraft().options"
            />
          }
          @case (ActionType.RadioButton) {
            <ws-radio-checkbox-settings
              [(labelText)]="radioButtonDraft().labelText"
              [(prePopulate)]="radioButtonDraft().prePopulate"
              [(prePopulateSource)]="radioButtonDraft().prePopulateSource"
              [(prePopulateValue)]="radioButtonDraft().prePopulateValue"
              [(readOnly)]="radioButtonDraft().readOnly"
              [(editableIfNull)]="radioButtonDraft().editableIfNull"
              [(selectionType)]="radioButtonDraft().selectionType"
              [(options)]="radioButtonDraft().options"
            />
          }
          @case (ActionType.Checkbox) {
            <ws-radio-checkbox-settings
              [(labelText)]="checkboxDraft().labelText"
              [(prePopulate)]="checkboxDraft().prePopulate"
              [(prePopulateSource)]="checkboxDraft().prePopulateSource"
              [(prePopulateValue)]="checkboxDraft().prePopulateValue"
              [(readOnly)]="checkboxDraft().readOnly"
              [(editableIfNull)]="checkboxDraft().editableIfNull"
              [(selectionType)]="checkboxDraft().selectionType"
              [(options)]="checkboxDraft().options"
            />
          }
          @case (ActionType.TextField) {
            <ws-text-field-settings
              [(labelText)]="textFieldDraft().labelText"
              [(prePopulate)]="textFieldDraft().prePopulate"
              [(prePopulateSource)]="textFieldDraft().prePopulateSource"
              [(prePopulateValue)]="textFieldDraft().prePopulateValue"
              [(readOnly)]="textFieldDraft().readOnly"
              [(editableIfNull)]="textFieldDraft().editableIfNull"
              [(type)]="textFieldDraft().type"
              [(dataType)]="textFieldDraft().dataType"
              [(minLengthEnabled)]="textFieldDraft().minLengthEnabled"
              [(minLength)]="textFieldDraft().minLength"
            />
          }
          @case (ActionType.Slider) {
            <ws-slider-settings
              [(labelText)]="sliderDraft().labelText"
              [(leftLabel)]="sliderDraft().leftLabel"
              [(rightLabel)]="sliderDraft().rightLabel"
              [(prePopulate)]="sliderDraft().prePopulate"
              [(min)]="sliderDraft().min"
              [(max)]="sliderDraft().max"
              [(displayType)]="sliderDraft().displayType"
            />
          }
          @case (ActionType.SimpleButton) {
            <ws-simple-button-settings
              [(buttonText)]="simpleButtonDraft().buttonText"
              [(buttonAction)]="simpleButtonDraft().buttonAction"
            />
          }
          @case (ActionType.LaunchWebview) {
            <ws-launch-webview-settings
              [(buttonText)]="launchWebviewDraft().buttonText"
              [(hyperLink)]="launchWebviewDraft().hyperLink"
            />
          }
          @case (ActionType.TimerStopwatch) {
            <ws-timer-stopwatch-settings
              [(startTriggerType)]="timerStopwatchDraft().startTriggerType"
              [(startGeofenceId)]="timerStopwatchDraft().startGeofenceId"
              [(stopTriggerType)]="timerStopwatchDraft().stopTriggerType"
              [(stopGeofenceId)]="timerStopwatchDraft().stopGeofenceId"
            />
          }
          @case (ActionType.Label) {
            <ws-label-settings [(headingText)]="labelDraft().headingText" />
          }
          @case (ActionType.SideBySideButtons) {
            <ws-side-by-side-buttons-settings
              [(button1Text)]="sideBySideButtonsDraft().button1Text"
              [(button1Action)]="sideBySideButtonsDraft().button1Action"
              [(button2Text)]="sideBySideButtonsDraft().button2Text"
              [(button2Action)]="sideBySideButtonsDraft().button2Action"
            />
          }
          @case (ActionType.TemperatureField) {
            <ws-temperature-field-settings
              [(labelText)]="temperatureFieldDraft().labelText"
              [(prePopulate)]="temperatureFieldDraft().prePopulate"
              [(prePopulateSource)]="temperatureFieldDraft().prePopulateSource"
              [(prePopulateValue)]="temperatureFieldDraft().prePopulateValue"
              [(readOnly)]="temperatureFieldDraft().readOnly"
              [(editableIfNull)]="temperatureFieldDraft().editableIfNull"
            />
          }
          @default {
            <p class="no-settings">No additional settings for this action type.</p>
          }
        }
      </ws-property-section>

      <ws-conditions-section
        [condition]="baseDraft().condition"
        [blocker]="baseDraft().blocker"
        (conditionChange)="patchBase('condition', $event)"
        (blockerChange)="patchBase('blocker', $event)"
      />
    </ws-panel-shell>
  `,
  styles: `
    :host { display: flex; flex: 1 1 auto; min-height: 0; }
    .no-settings {
      font-size: 14px;
      color: var(--p-surface-600, #a9b3c2);
      font-family: Roboto, sans-serif;
      margin: 0;
    }
  `,
})
export class ActionPropertiesComponent implements OnChanges {
  protected readonly store = inject(WorkflowStudioStore);
  protected readonly ActionType = ActionType;

  readonly action = input.required<Action>();
  readonly step = input.required<Step>();

  protected readonly typeBadge = () =>
    ACTION_TYPE_CATALOG[this.action().config.actionType]?.label ?? '';

  protected readonly noRequired = computed(() =>
    NO_REQUIRED_TYPES.has(this.action().config.actionType)
  );

  // ---- draft signals -------------------------------------------------------
  protected readonly baseDraft = signal<BaseDraft>({ required: false, visible: true, condition: undefined, blocker: undefined });

  // Existing types
  protected readonly acceptDraft = signal<{ buttonText: string; buttonType: 'simple' }>({ buttonText: 'Accept', buttonType: 'simple' });
  protected readonly rejectDraft = signal<{ buttonText: string; buttonType: 'simple' }>({ buttonText: 'Swipe to decline workflow', buttonType: 'simple' });
  protected readonly stopDraft = signal<{ trigger: string | undefined; geofenceId: string | undefined; promptManualConfirm: boolean }>({ trigger: undefined, geofenceId: undefined, promptManualConfirm: false });
  protected readonly barcodeDraft = signal<{ repeatable: boolean; labelText: string }>({ repeatable: false, labelText: '' });
  protected readonly geofenceDraft = signal<{ trigger: 'enter' | 'exit' | 'dwell' | undefined; dwellSeconds: number | undefined }>({ trigger: undefined, dwellSeconds: undefined });
  protected readonly pushAlertDraft = signal<{ pushAlertText: string; trigger: 'geofence' | undefined }>({ pushAlertText: '', trigger: undefined });
  protected readonly emailDraft = signal<{ prePopulate: boolean; trigger: 'geofence' | undefined; recipientType: 'json' | 'static'; recipientValue: string; subject: string; selectedActionIds: string[]; additionalBody: string }>({ prePopulate: false, trigger: undefined, recipientType: 'json', recipientValue: '', subject: '', selectedActionIds: [], additionalBody: '' });
  protected readonly smsDraft = signal<{ prePopulate: boolean; trigger: 'geofence' | undefined; recipientType: 'json' | 'static'; recipientValue: string; subject: string; selectedActionIds: string[]; additionalBody: string }>({ prePopulate: false, trigger: undefined, recipientType: 'json', recipientValue: '', subject: '', selectedActionIds: [], additionalBody: '' });
  protected readonly deviceLocationDraft = signal<{ trigger: 'geofence' | undefined }>({ trigger: undefined });
  protected readonly eldLocationDraft = signal<{ trigger: string | undefined; geofenceId: string | undefined; promptManualConfirm: boolean }>({ trigger: undefined, geofenceId: undefined, promptManualConfirm: false });
  protected readonly certLogsDraft = signal<{ titleLabel: string; bodyTextLabel: string }>({ titleLabel: '', bodyTextLabel: '' });

  // New types
  private dropdownDefaults(selectionType = 'Single-Select'): { labelText: string; prePopulate: boolean; prePopulateSource: 'json' | 'static'; prePopulateValue: string; readOnly: boolean; editableIfNull: boolean; selectionType: string; options: SelectOption[] } {
    return { labelText: '', prePopulate: false, prePopulateSource: 'json', prePopulateValue: '', readOnly: false, editableIfNull: false, selectionType, options: [] };
  }
  protected readonly singleDropdownDraft = signal(this.dropdownDefaults('Single-Select'));
  protected readonly multiDropdownDraft = signal(this.dropdownDefaults('Multi-Select'));
  protected readonly radioButtonDraft = signal(this.dropdownDefaults('Single-Select'));
  protected readonly checkboxDraft = signal(this.dropdownDefaults('Multi-Select'));

  protected readonly textFieldDraft = signal<{ labelText: string; prePopulate: boolean; prePopulateSource: 'json' | 'static'; prePopulateValue: string; readOnly: boolean; editableIfNull: boolean; type: string; dataType: string; minLengthEnabled: boolean; minLength: number | undefined }>({ labelText: '', prePopulate: false, prePopulateSource: 'json', prePopulateValue: '', readOnly: false, editableIfNull: false, type: 'Short Text', dataType: 'Alpha', minLengthEnabled: false, minLength: undefined });

  protected readonly sliderDraft = signal<{ labelText: string; leftLabel: string; rightLabel: string; prePopulate: boolean; min: number; max: number; displayType: string }>({ labelText: '', leftLabel: '', rightLabel: '', prePopulate: false, min: 0, max: 100, displayType: 'Numeric' });

  protected readonly simpleButtonDraft = signal<{ buttonText: string; buttonAction: string | undefined }>({ buttonText: '', buttonAction: undefined });

  protected readonly launchWebviewDraft = signal<{ buttonText: string; hyperLink: string }>({ buttonText: '', hyperLink: '' });

  protected readonly timerStopwatchDraft = signal<{ startTriggerType: string | undefined; startGeofenceId: string | undefined; stopTriggerType: string | undefined; stopGeofenceId: string | undefined }>({ startTriggerType: undefined, startGeofenceId: undefined, stopTriggerType: undefined, stopGeofenceId: undefined });

  protected readonly labelDraft = signal<{ headingText: string }>({ headingText: '' });

  protected readonly sideBySideButtonsDraft = signal<{ button1Text: string; button1Action: string | undefined; button2Text: string; button2Action: string | undefined }>({ button1Text: '', button1Action: undefined, button2Text: '', button2Action: undefined });

  protected readonly temperatureFieldDraft = signal<{ labelText: string; prePopulate: boolean; prePopulateSource: 'json' | 'static'; prePopulateValue: string; readOnly: boolean; editableIfNull: boolean }>({ labelText: '', prePopulate: false, prePopulateSource: 'json', prePopulateValue: '', readOnly: false, editableIfNull: false });

  ngOnChanges(): void {
    this.initDrafts();
  }

  protected patchBase<K extends keyof BaseDraft>(key: K, value: BaseDraft[K]): void {
    this.baseDraft.update((d) => ({ ...d, [key]: value }));
  }

  protected onSave(): void {
    const base = this.baseDraft();
    const config = this.buildConfig(base);
    this.store.updateActionConfig(this.action().id, config);
    this.store.closeProperties();
  }

  private initDrafts(): void {
    const cfg = this.action().config;
    this.baseDraft.set({
      required: cfg.required ?? false,
      visible: cfg.visible ?? true,
      condition: cfg.condition,
      blocker: cfg.blocker,
    });

    switch (cfg.actionType) {
      case ActionType.AcceptWorkflow: {
        const c = cfg as AcceptWorkflowConfig;
        this.acceptDraft.set({ buttonText: c.buttonText ?? 'Accept', buttonType: c.buttonType ?? 'simple' });
        break;
      }
      case ActionType.RejectWorkflow: {
        const c = cfg as RejectWorkflowConfig;
        this.rejectDraft.set({ buttonText: c.buttonText ?? 'Swipe to decline workflow', buttonType: c.buttonType ?? 'simple' });
        break;
      }
      case ActionType.StopActualization: {
        const c = cfg as StopActualizationConfig;
        this.stopDraft.set({ trigger: c.trigger, geofenceId: c.geofenceId, promptManualConfirm: c.promptManualConfirm ?? false });
        break;
      }
      case ActionType.BarcodeScanner: {
        const c = cfg as BarcodeScannerConfig;
        this.barcodeDraft.set({ repeatable: c.repeatable ?? false, labelText: c.labelText ?? '' });
        break;
      }
      case ActionType.TriggerGeofence: {
        const c = cfg as TriggerGeofenceConfig;
        this.geofenceDraft.set({ trigger: c.trigger, dwellSeconds: c.dwellSeconds });
        break;
      }
      case ActionType.GeneratePushAlert: {
        const c = cfg as GeneratePushAlertConfig;
        this.pushAlertDraft.set({ pushAlertText: c.pushAlertText ?? '', trigger: c.trigger });
        break;
      }
      case ActionType.GenerateEmailFromTFLO: {
        const c = cfg as GenerateEmailFromTFLOConfig;
        this.emailDraft.set({ prePopulate: c.prePopulate ?? false, trigger: c.trigger, recipientType: c.recipientType ?? 'json', recipientValue: c.recipientValue ?? '', subject: c.subject ?? '', selectedActionIds: c.selectedActionIds ? [...c.selectedActionIds] : [], additionalBody: c.additionalBody ?? '' });
        break;
      }
      case ActionType.GenerateSMSFromTFLO: {
        const c = cfg as GenerateSMSFromTFLOConfig;
        this.smsDraft.set({ prePopulate: c.prePopulate ?? false, trigger: c.trigger, recipientType: c.recipientType ?? 'json', recipientValue: c.recipientValue ?? '', subject: c.subject ?? '', selectedActionIds: c.selectedActionIds ? [...c.selectedActionIds] : [], additionalBody: c.additionalBody ?? '' });
        break;
      }
      case ActionType.GetDeviceLocation: {
        const c = cfg as GetDeviceLocationConfig;
        this.deviceLocationDraft.set({ trigger: c.trigger });
        break;
      }
      case ActionType.GetELDLocation: {
        const c = cfg as GetELDLocationConfig;
        this.eldLocationDraft.set({ trigger: c.trigger, geofenceId: c.geofenceId, promptManualConfirm: c.promptManualConfirm ?? false });
        break;
      }
      case ActionType.CertLogs: {
        const c = cfg as CertLogsConfig;
        this.certLogsDraft.set({ titleLabel: c.titleLabel ?? '', bodyTextLabel: c.bodyTextLabel ?? '' });
        break;
      }
      case ActionType.SingleSelectDropdown: {
        const c = cfg as SingleSelectDropdownConfig;
        this.singleDropdownDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false, selectionType: 'Single-Select', options: c.options ? [...c.options] : [] });
        break;
      }
      case ActionType.MultiSelectDropdown: {
        const c = cfg as MultiSelectDropdownConfig;
        this.multiDropdownDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false, selectionType: 'Multi-Select', options: c.options ? [...c.options] : [] });
        break;
      }
      case ActionType.RadioButton: {
        const c = cfg as RadioButtonConfig;
        this.radioButtonDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false, selectionType: 'Single-Select', options: c.options ? [...c.options] : [] });
        break;
      }
      case ActionType.Checkbox: {
        const c = cfg as CheckboxConfig;
        this.checkboxDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false, selectionType: 'Multi-Select', options: c.options ? [...c.options] : [] });
        break;
      }
      case ActionType.TextField: {
        const c = cfg as TextFieldConfig;
        this.textFieldDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false, type: c.type === 'paragraph' ? 'Paragraph' : 'Short Text', dataType: c.dataType === 'numeric' ? 'Numeric' : c.dataType === 'all' ? 'All' : 'Alpha', minLengthEnabled: c.minLengthEnabled ?? false, minLength: c.minLength });
        break;
      }
      case ActionType.Slider: {
        const c = cfg as SliderConfig;
        this.sliderDraft.set({ labelText: c.labelText ?? '', leftLabel: c.leftLabel ?? '', rightLabel: c.rightLabel ?? '', prePopulate: c.prePopulate ?? false, min: c.min ?? 0, max: c.max ?? 100, displayType: c.displayType === 'stars' ? 'Stars' : 'Numeric' });
        break;
      }
      case ActionType.SimpleButton: {
        const c = cfg as SimpleButtonConfig;
        this.simpleButtonDraft.set({ buttonText: c.buttonText ?? '', buttonAction: c.buttonAction });
        break;
      }
      case ActionType.LaunchWebview: {
        const c = cfg as LaunchWebviewConfig;
        this.launchWebviewDraft.set({ buttonText: c.buttonText ?? '', hyperLink: c.hyperLink ?? '' });
        break;
      }
      case ActionType.TimerStopwatch: {
        const c = cfg as TimerStopwatchConfig;
        this.timerStopwatchDraft.set({ startTriggerType: c.startTriggerType, startGeofenceId: c.startGeofenceId, stopTriggerType: c.stopTriggerType, stopGeofenceId: c.stopGeofenceId });
        break;
      }
      case ActionType.Label: {
        const c = cfg as LabelConfig;
        this.labelDraft.set({ headingText: c.headingText ?? '' });
        break;
      }
      case ActionType.SideBySideButtons: {
        const c = cfg as SideBySideButtonsConfig;
        this.sideBySideButtonsDraft.set({ button1Text: c.button1Text ?? '', button1Action: c.button1Action, button2Text: c.button2Text ?? '', button2Action: c.button2Action });
        break;
      }
      case ActionType.TemperatureField: {
        const c = cfg as TemperatureFieldConfig;
        this.temperatureFieldDraft.set({ labelText: c.labelText ?? '', prePopulate: c.prePopulate ?? false, prePopulateSource: (c.prePopulateSource as 'json' | 'static') ?? 'json', prePopulateValue: c.prePopulateValue ?? '', readOnly: c.readOnly ?? false, editableIfNull: c.editableIfNull ?? false });
        break;
      }
    }
  }

  private buildConfig(base: BaseDraft): ActionConfig {
    const existing = this.action().config;
    const baseFields = { required: base.required, visible: base.visible, condition: base.condition, blocker: base.blocker };

    switch (existing.actionType) {
      case ActionType.AcceptWorkflow: return { ...existing, ...baseFields, ...this.acceptDraft() };
      case ActionType.RejectWorkflow: return { ...existing, ...baseFields, ...this.rejectDraft() };
      case ActionType.StopActualization: {
        const d = this.stopDraft();
        const trigger = d.trigger === 'geofence' ? 'geofence' as const : undefined;
        return { ...existing, ...baseFields, trigger, geofenceId: d.geofenceId, promptManualConfirm: d.promptManualConfirm };
      }
      case ActionType.BarcodeScanner: return { ...existing, ...baseFields, ...this.barcodeDraft() };
      case ActionType.TriggerGeofence: return { ...existing, ...baseFields, ...this.geofenceDraft() };
      case ActionType.GeneratePushAlert: return { ...existing, ...baseFields, ...this.pushAlertDraft() };
      case ActionType.GenerateEmailFromTFLO: return { ...existing, ...baseFields, ...this.emailDraft() };
      case ActionType.GenerateSMSFromTFLO: return { ...existing, ...baseFields, ...this.smsDraft() };
      case ActionType.GetDeviceLocation: return { ...existing, ...baseFields, ...this.deviceLocationDraft() };
      case ActionType.GetELDLocation: {
        const d = this.eldLocationDraft();
        const trigger = d.trigger === 'geofence' ? 'geofence' as const : undefined;
        return { ...existing, ...baseFields, trigger, geofenceId: d.geofenceId, promptManualConfirm: d.promptManualConfirm };
      }
      case ActionType.CertLogs: return { ...existing, ...baseFields, ...this.certLogsDraft() };
      case ActionType.SingleSelectDropdown: {
        const d = this.singleDropdownDraft();
        return { ...existing, ...baseFields, labelText: d.labelText, options: d.options, prePopulate: d.prePopulate, prePopulateSource: d.prePopulateSource, prePopulateValue: d.prePopulateValue, readOnly: d.readOnly, editableIfNull: d.editableIfNull };
      }
      case ActionType.MultiSelectDropdown: {
        const d = this.multiDropdownDraft();
        return { ...existing, ...baseFields, labelText: d.labelText, options: d.options, prePopulate: d.prePopulate, prePopulateSource: d.prePopulateSource, prePopulateValue: d.prePopulateValue, readOnly: d.readOnly, editableIfNull: d.editableIfNull };
      }
      case ActionType.RadioButton: {
        const d = this.radioButtonDraft();
        return { ...existing, ...baseFields, labelText: d.labelText, options: d.options, prePopulate: d.prePopulate, prePopulateSource: d.prePopulateSource, prePopulateValue: d.prePopulateValue, readOnly: d.readOnly, editableIfNull: d.editableIfNull };
      }
      case ActionType.Checkbox: {
        const d = this.checkboxDraft();
        return { ...existing, ...baseFields, labelText: d.labelText, options: d.options, prePopulate: d.prePopulate, prePopulateSource: d.prePopulateSource, prePopulateValue: d.prePopulateValue, readOnly: d.readOnly, editableIfNull: d.editableIfNull };
      }
      case ActionType.TextField: {
        const d = this.textFieldDraft();
        const type = d.type === 'Paragraph' ? 'paragraph' : 'short';
        const dataType = d.dataType === 'Numeric' ? 'numeric' : d.dataType === 'All' ? 'all' : 'alpha';
        return { ...existing, ...baseFields, labelText: d.labelText, type, dataType, prePopulate: d.prePopulate, prePopulateSource: d.prePopulateSource, prePopulateValue: d.prePopulateValue, readOnly: d.readOnly, editableIfNull: d.editableIfNull, minLengthEnabled: d.minLengthEnabled, minLength: d.minLength } as ActionConfig;
      }
      case ActionType.Slider: {
        const d = this.sliderDraft();
        const displayType = d.displayType === 'Stars' ? 'stars' : 'numeric';
        return { ...existing, ...baseFields, labelText: d.labelText, leftLabel: d.leftLabel, rightLabel: d.rightLabel, prePopulate: d.prePopulate, min: d.min, max: d.max, displayType };
      }
      case ActionType.SimpleButton: return { ...existing, ...baseFields, ...this.simpleButtonDraft() };
      case ActionType.LaunchWebview: return { ...existing, ...baseFields, ...this.launchWebviewDraft() };
      case ActionType.TimerStopwatch: {
        const d = this.timerStopwatchDraft();
        const startTriggerType = d.startTriggerType === 'geofence' ? 'geofence' as const : undefined;
        const stopTriggerType = d.stopTriggerType === 'geofence' ? 'geofence' as const : undefined;
        return { ...existing, ...baseFields, startTriggerType, startGeofenceId: d.startGeofenceId, stopTriggerType, stopGeofenceId: d.stopGeofenceId };
      }
      case ActionType.Label: return { ...existing, ...baseFields, ...this.labelDraft() };
      case ActionType.SideBySideButtons: return { ...existing, ...baseFields, ...this.sideBySideButtonsDraft() };
      case ActionType.TemperatureField: return { ...existing, ...baseFields, ...this.temperatureFieldDraft() };
      default: return { ...existing, ...baseFields };
    }
  }
}
