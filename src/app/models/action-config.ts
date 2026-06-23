/**
 * Workflow Studio — type-specific Action configuration.
 *
 * This is a DISCRIMINATED UNION keyed on the `actionType` field. Given an
 * `ActionConfig`, narrowing on `config.actionType` gives you the exact
 * type-specific shape with no casting:
 *
 *   if (config.actionType === ActionType.Slider) {
 *     config.min; config.max; // ✅ typed
 *   }
 *
 * STATUS OF THIS FILE
 *  - A handful of representative types have a fleshed-out config to establish
 *    the pattern (Slider, SingleSelectDropdown, TriggerGeofence, TimerStopwatch,
 *    GenerateEmailFromTFLO).
 *  - Every other type currently extends {@link BaseActionConfig} with only its
 *    discriminant and a `// TODO (Phase 2)` marker. Filling one in means adding
 *    its fields below the discriminant — nothing else changes, because the union
 *    is assembled mechanically at the bottom.
 */

import { ActionType } from './action-type';
import { BlockingCondition, ConditionGroup } from './entities';

/**
 * Fields common to every action's config. These map to the
 * **"Define Action"** block in the Action settings panel:
 *  - `required`   → the REQUIRED toggle (distinct from Step requirement).
 *  - `visible`    → the Visible toggle.
 *  - `condition`  → show/hide rule (evaluates to true = show).
 *  - `blocker`    → blocking condition (node locked until condition is true).
 */
export interface BaseActionConfig {
  readonly required?: boolean;
  readonly visible?: boolean;
  readonly condition?: ConditionGroup;
  readonly blocker?: BlockingCondition;
  /** Help text shown beneath the control / behavior on-device. */
  readonly helpText?: string;
}

/** A selectable option for choice-style inputs. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/** Where a choice control sources its options. */
export type OptionsSource =
  | { readonly kind: 'static'; readonly options: readonly SelectOption[] }
  | { readonly kind: 'remote'; readonly endpoint: string }; // resolved on-device from the API

// ---------------------------------------------------------------------------
// Seeded (representative) configs — the pattern to copy for the rest.
// ---------------------------------------------------------------------------

/** INPUT · Slider — numeric input across a bounded range. */
export interface SliderConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.Slider;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly defaultValue?: number;
  readonly unitLabel?: string;
  readonly labelText?: string;
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly displayType?: 'numeric' | 'stars';
  readonly prePopulate?: boolean;
}

/** INPUT · Single-select dropdown. */
export interface SingleSelectDropdownConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.SingleSelectDropdown;
  readonly optionsSource: OptionsSource;
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly labelText?: string;
  readonly options?: readonly SelectOption[];
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
}

/** INPUT · Multi-select dropdown. */
export interface MultiSelectDropdownConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.MultiSelectDropdown;
  readonly optionsSource: OptionsSource;
  readonly minSelections?: number;
  readonly maxSelections?: number;
  readonly labelText?: string;
  readonly options?: readonly SelectOption[];
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
}

/** NON-INPUT · Geofence trigger. */
export interface TriggerGeofenceConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.TriggerGeofence;
  readonly latitude: number;
  readonly longitude: number;
  /** Trigger radius in meters. */
  readonly radiusMeters: number;
  readonly trigger?: 'enter' | 'exit' | 'dwell';
  /** For `dwell`, how long (seconds) inside the fence before firing. */
  readonly dwellSeconds?: number;
}

/** NON-INPUT · Timer / stopwatch. */
export interface TimerStopwatchConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.TimerStopwatch;
  readonly mode?: 'countdown' | 'stopwatch';
  readonly durationSeconds?: number;
  readonly startTriggerType?: 'geofence';
  readonly startGeofenceId?: string;
  readonly stopTriggerType?: 'geofence';
  readonly stopGeofenceId?: string;
}

/** NON-INPUT · Generate Email (TFLO) — server-generated email from Transflo. */
export interface GenerateEmailFromTFLOConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.GenerateEmailFromTFLO;
  readonly prePopulate?: boolean;
  readonly trigger?: 'geofence';
  readonly recipientType?: 'json' | 'static';
  readonly recipientValue?: string;
  readonly subject?: string;
  readonly selectedActionIds?: readonly string[];
  readonly additionalBody?: string;
}

// ---------------------------------------------------------------------------
// Stubbed configs — consistent pattern; flesh out per phase.
// Each carries only its discriminant for now.
// ---------------------------------------------------------------------------

// NON-INPUT

/** NON-INPUT · Cert Logs — displays certification log info to the driver. */
export interface CertLogsConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.CertLogs;
  readonly titleLabel?: string;
  readonly bodyTextLabel?: string;
}

/** NON-INPUT · Accept Workflow — driver accepts the load/workflow. */
export interface AcceptWorkflowConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.AcceptWorkflow;
  readonly buttonText?: string;
  readonly buttonType?: 'simple';
}

/** NON-INPUT · Reject Workflow — driver declines the load/workflow. */
export interface RejectWorkflowConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.RejectWorkflow;
  readonly buttonText?: string;
  readonly buttonType?: 'simple';
}

/** NON-INPUT · Stop Actualization — records arrival/departure at a stop. */
export interface StopActualizationConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.StopActualization;
  readonly trigger?: 'geofence';
  readonly geofenceId?: string;
  readonly promptManualConfirm?: boolean;
}

export interface SendCheckcallConfig extends BaseActionConfig { readonly actionType: typeof ActionType.SendCheckcall; /* TODO (Phase 2) */ }
export interface LaunchGeotabSDKConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchGeotabSDK; /* TODO (Phase 2) */ }
export interface LaunchCopilotSDKConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchCopilotSDK; /* TODO (Phase 2) */ }
export interface LaunchScanSDKConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchScanSDK; /* TODO (Phase 2) */ }
export interface LaunchEmailAppConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchEmailApp; /* TODO (Phase 2) */ }
export interface LaunchSMSConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchSMS; /* TODO (Phase 2) */ }
export interface LaunchPhoneAppConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchPhoneApp; /* TODO (Phase 2) */ }

/** NON-INPUT · Barcode Scanner — prompts the driver to scan a barcode. */
export interface BarcodeScannerConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.BarcodeScanner;
  readonly repeatable?: boolean;
  readonly labelText?: string;
}

/** NON-INPUT · Generate Push Alert — sends a push notification to the device. */
export interface GeneratePushAlertConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.GeneratePushAlert;
  readonly pushAlertText?: string;
  readonly trigger?: 'geofence';
}

/** NON-INPUT · Generate SMS (TFLO) — server-generated SMS from Transflo. */
export interface GenerateSMSFromTFLOConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.GenerateSMSFromTFLO;
  readonly prePopulate?: boolean;
  readonly trigger?: 'geofence';
  readonly recipientType?: 'json' | 'static';
  readonly recipientValue?: string;
  readonly subject?: string;
  readonly selectedActionIds?: readonly string[];
  readonly additionalBody?: string;
}

/** NON-INPUT · Get Device Location — captures GPS location from the device. */
export interface GetDeviceLocationConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.GetDeviceLocation;
  readonly trigger?: 'geofence';
}

/** NON-INPUT · Get ELD Location — captures location from the ELD. */
export interface GetELDLocationConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.GetELDLocation;
  readonly trigger?: 'geofence';
  readonly geofenceId?: string;
  readonly promptManualConfirm?: boolean;
}

export interface LaunchWebviewConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.LaunchWebview;
  readonly buttonText?: string;
  readonly hyperLink?: string;
}

// INPUT
export interface TextFieldConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.TextField;
  readonly labelText?: string;
  readonly type?: 'short' | 'paragraph';
  readonly dataType?: 'alpha' | 'numeric' | 'all';
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
  readonly minLengthEnabled?: boolean;
  readonly minLength?: number;
}

export interface NumericFieldConfig extends BaseActionConfig { readonly actionType: typeof ActionType.NumericField; /* TODO (Phase 2) */ }

export interface LabelConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.Label;
  readonly headingText?: string;
}

export interface RadioButtonConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.RadioButton;
  readonly labelText?: string;
  readonly options?: readonly SelectOption[];
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
}

export interface CheckboxConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.Checkbox;
  readonly labelText?: string;
  readonly options?: readonly SelectOption[];
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
}

export interface SimpleButtonConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.SimpleButton;
  readonly buttonText?: string;
  readonly buttonAction?: string;
}

export interface SideBySideButtonsConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.SideBySideButtons;
  readonly button1Text?: string;
  readonly button1Action?: string;
  readonly button2Text?: string;
  readonly button2Action?: string;
}

export interface DateConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Date; /* TODO (Phase 2) */ }
export interface DatetimeConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Datetime; /* TODO (Phase 2) */ }
export interface MultiDateSelectorConfig extends BaseActionConfig { readonly actionType: typeof ActionType.MultiDateSelector; /* TODO (Phase 2) */ }
export interface TimeConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Time; /* TODO (Phase 2) */ }
export interface TimeRangeSelectorConfig extends BaseActionConfig { readonly actionType: typeof ActionType.TimeRangeSelector; /* TODO (Phase 2) */ }

export interface TemperatureFieldConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.TemperatureField;
  readonly labelText?: string;
  readonly prePopulate?: boolean;
  readonly prePopulateSource?: string;
  readonly prePopulateValue?: string;
  readonly readOnly?: boolean;
  readonly editableIfNull?: boolean;
}

// DEFERRED — not for v1
export interface LaunchEBOLConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchEBOL; /* deferred — not for v1 */ }
export interface LaunchEPODConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchEPOD; /* deferred — not for v1 */ }

// ---------------------------------------------------------------------------
// The union. Every config interface above must appear here exactly once.
// ---------------------------------------------------------------------------

export type ActionConfig =
  // NonInput
  | CertLogsConfig
  | AcceptWorkflowConfig
  | RejectWorkflowConfig
  | StopActualizationConfig
  | SendCheckcallConfig
  | LaunchGeotabSDKConfig
  | LaunchCopilotSDKConfig
  | LaunchScanSDKConfig
  | LaunchEmailAppConfig
  | LaunchSMSConfig
  | LaunchPhoneAppConfig
  | BarcodeScannerConfig
  | TriggerGeofenceConfig
  | TimerStopwatchConfig
  | GeneratePushAlertConfig
  | GenerateEmailFromTFLOConfig
  | GenerateSMSFromTFLOConfig
  | GetDeviceLocationConfig
  | GetELDLocationConfig
  | LaunchWebviewConfig
  // Input
  | TextFieldConfig
  | NumericFieldConfig
  | MultiSelectDropdownConfig
  | SingleSelectDropdownConfig
  | LabelConfig
  | RadioButtonConfig
  | CheckboxConfig
  | SimpleButtonConfig
  | SideBySideButtonsConfig
  | DateConfig
  | DatetimeConfig
  | MultiDateSelectorConfig
  | TimeConfig
  | TimeRangeSelectorConfig
  | TemperatureFieldConfig
  | SliderConfig
  // Deferred
  | LaunchEBOLConfig
  | LaunchEPODConfig;

/**
 * Helper type: extract the exact config shape for a given action type.
 *   ConfigFor<typeof ActionType.Slider> === SliderConfig
 */
export type ConfigFor<T extends ActionType> = Extract<ActionConfig, { actionType: T }>;
