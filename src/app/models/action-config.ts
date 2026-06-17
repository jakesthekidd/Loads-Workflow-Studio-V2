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

/**
 * Fields common to every action's config. These three map to the
 * **"Define Action"** block in the Action settings panel (see docs/canvas.md):
 *  - `required`   → the REQUIRED toggle (distinct from Step requirement).
 *  - `visible`    → the Visible toggle. Confirmed: *nearly every* action has this.
 *  - `conditional`→ the Conditional toggle. A confirmed requirement, but the
 *                   rule language / evaluation is still under design — modeled
 *                   as DATA only for now (no logic this phase).
 */
export interface BaseActionConfig {
  readonly required?: boolean;
  readonly visible?: boolean;
  readonly conditional?: ConditionalRule;
  /** Help text shown beneath the control / behavior on-device. */
  readonly helpText?: string;
}

/**
 * Placeholder for an action's conditional (show/hide) rule. The expression
 * model is intentionally unresolved — see docs/data-model.md. Data only.
 */
export interface ConditionalRule {
  readonly enabled: boolean;
  // TODO (Phase N): operands / operators referencing other actions' values.
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
}

/** INPUT · Single-select dropdown. */
export interface SingleSelectDropdownConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.SingleSelectDropdown;
  readonly optionsSource: OptionsSource;
  readonly defaultValue?: string;
  readonly placeholder?: string;
}

/** INPUT · Multi-select dropdown. */
export interface MultiSelectDropdownConfig extends BaseActionConfig {
  readonly actionType: typeof ActionType.MultiSelectDropdown;
  readonly optionsSource: OptionsSource;
  readonly minSelections?: number;
  readonly maxSelections?: number;
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
  readonly mode: 'countdown' | 'stopwatch';
  /** For countdown mode, the starting duration in seconds. */
  readonly durationSeconds?: number;
  /** What starts the timer. */
  readonly startTrigger: 'manual' | 'stepEnter' | 'geofence';
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
}

export interface LaunchWebviewConfig extends BaseActionConfig { readonly actionType: typeof ActionType.LaunchWebview; /* TODO (Phase 2) */ }

// INPUT
export interface TextFieldConfig extends BaseActionConfig { readonly actionType: typeof ActionType.TextField; /* TODO (Phase 2) */ }
export interface NumericFieldConfig extends BaseActionConfig { readonly actionType: typeof ActionType.NumericField; /* TODO (Phase 2) */ }
export interface LabelConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Label; /* TODO (Phase 2) */ }
export interface RadioButtonConfig extends BaseActionConfig { readonly actionType: typeof ActionType.RadioButton; /* TODO (Phase 2) */ }
export interface CheckboxConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Checkbox; /* TODO (Phase 2) */ }
export interface SimpleButtonConfig extends BaseActionConfig { readonly actionType: typeof ActionType.SimpleButton; /* TODO (Phase 2) */ }
export interface DateConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Date; /* TODO (Phase 2) */ }
export interface DatetimeConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Datetime; /* TODO (Phase 2) */ }
export interface MultiDateSelectorConfig extends BaseActionConfig { readonly actionType: typeof ActionType.MultiDateSelector; /* TODO (Phase 2) */ }
export interface TimeConfig extends BaseActionConfig { readonly actionType: typeof ActionType.Time; /* TODO (Phase 2) */ }
export interface TimeRangeSelectorConfig extends BaseActionConfig { readonly actionType: typeof ActionType.TimeRangeSelector; /* TODO (Phase 2) */ }
export interface TemperatureFieldConfig extends BaseActionConfig { readonly actionType: typeof ActionType.TemperatureField; /* TODO (Phase 2) */ }

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
