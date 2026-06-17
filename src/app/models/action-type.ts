/**
 * Workflow Studio — the Action Type catalog.
 *
 * An {@link ActionType} identifies WHAT an Action does. Every type belongs to
 * exactly one {@link ActionCategory} (Input vs NonInput). The runtime/UI never
 * hard-codes a category off an action — it looks the type up in
 * {@link ACTION_TYPE_CATALOG}, the single source of truth shipped by the
 * (mock) .NET API.
 *
 * Type-specific configuration lives in `action-config.ts` as a discriminated
 * union keyed on the `actionType` field.
 */

import { ActionCategory } from './enums';

/** All known action types, including deferred ones. Const-object + union pattern. */
export const ActionType = {
  // ---- NON-INPUT: trigger a behavior or integration -----------------------
  CertLogs: 'CertLogs',
  AcceptWorkflow: 'AcceptWorkflow',
  RejectWorkflow: 'RejectWorkflow',
  StopActualization: 'StopActualization',
  SendCheckcall: 'SendCheckcall',
  LaunchGeotabSDK: 'LaunchGeotabSDK',
  LaunchCopilotSDK: 'LaunchCopilotSDK',
  LaunchScanSDK: 'LaunchScanSDK',
  LaunchEmailApp: 'LaunchEmailApp',
  LaunchSMS: 'LaunchSMS',
  LaunchPhoneApp: 'LaunchPhoneApp',
  BarcodeScanner: 'BarcodeScanner',
  TriggerGeofence: 'TriggerGeofence',
  TimerStopwatch: 'TimerStopwatch',
  GeneratePushAlert: 'GeneratePushAlert',
  GenerateEmailFromTFLO: 'GenerateEmailFromTFLO',
  GenerateSMSFromTFLO: 'GenerateSMSFromTFLO',
  GetDeviceLocation: 'GetDeviceLocation',
  GetELDLocation: 'GetELDLocation',
  LaunchWebview: 'LaunchWebview',

  // ---- INPUT: render a form control the driver fills in -------------------
  TextField: 'TextField',
  NumericField: 'NumericField',
  MultiSelectDropdown: 'MultiSelectDropdown',
  SingleSelectDropdown: 'SingleSelectDropdown',
  Label: 'Label',
  RadioButton: 'RadioButton',
  Checkbox: 'Checkbox',
  SimpleButton: 'SimpleButton',
  Date: 'Date',
  Datetime: 'Datetime',
  MultiDateSelector: 'MultiDateSelector',
  Time: 'Time',
  TimeRangeSelector: 'TimeRangeSelector',
  TemperatureField: 'TemperatureField',
  Slider: 'Slider',

  // ---- DEFERRED: enumerated for completeness, NOT wired in v1 --------------
  LaunchEBOL: 'LaunchEBOL', // deferred — not for v1
  LaunchEPOD: 'LaunchEPOD', // deferred — not for v1
} as const;
export type ActionType = (typeof ActionType)[keyof typeof ActionType];

/** Catalog entry describing a single action type for palette / properties UI. */
export interface ActionTypeCatalogEntry {
  readonly type: ActionType;
  readonly category: ActionCategory;
  /** Human-friendly name shown in the palette. */
  readonly label: string;
  /** Short description for tooltips / properties header. */
  readonly description: string;
  /** Excluded from v1 (LaunchEBOL / LaunchEPOD). Hidden from the palette. */
  readonly deferred?: boolean;
}

/**
 * The canonical catalog. In production this is served by the .NET API
 * (see `mock-api/action-catalog.mock.ts`); it lives here as the type-level
 * source of truth so the model and the mock data never drift.
 */
export const ACTION_TYPE_CATALOG: Readonly<Record<ActionType, ActionTypeCatalogEntry>> = {
  // NonInput
  CertLogs: { type: 'CertLogs', category: ActionCategory.NonInput, label: 'Cert Logs', description: 'Display certification log information to the driver.' },
  AcceptWorkflow: { type: 'AcceptWorkflow', category: ActionCategory.NonInput, label: 'Accept Workflow', description: 'Driver accepts the workflow assignment.' },
  RejectWorkflow: { type: 'RejectWorkflow', category: ActionCategory.NonInput, label: 'Reject Workflow', description: 'Driver rejects the workflow assignment.' },
  StopActualization: { type: 'StopActualization', category: ActionCategory.NonInput, label: 'Stop Actualization', description: 'Record arrival/departure actualization at a stop.' },
  SendCheckcall: { type: 'SendCheckcall', category: ActionCategory.NonInput, label: 'Send Checkcall', description: 'Send a status check-call to the back office.' },
  LaunchGeotabSDK: { type: 'LaunchGeotabSDK', category: ActionCategory.NonInput, label: 'Launch Geotab SDK', description: 'Open the embedded Geotab SDK experience.' },
  LaunchCopilotSDK: { type: 'LaunchCopilotSDK', category: ActionCategory.NonInput, label: 'Launch CoPilot SDK', description: 'Open the embedded CoPilot navigation SDK.' },
  LaunchScanSDK: { type: 'LaunchScanSDK', category: ActionCategory.NonInput, label: 'Launch Scan SDK', description: 'Open the embedded document-scanning SDK.' },
  LaunchEmailApp: { type: 'LaunchEmailApp', category: ActionCategory.NonInput, label: 'Launch Email App', description: 'Open the device email client.' },
  LaunchSMS: { type: 'LaunchSMS', category: ActionCategory.NonInput, label: 'Launch SMS', description: 'Open the device SMS composer.' },
  LaunchPhoneApp: { type: 'LaunchPhoneApp', category: ActionCategory.NonInput, label: 'Launch Phone App', description: 'Open the device dialer.' },
  BarcodeScanner: { type: 'BarcodeScanner', category: ActionCategory.NonInput, label: 'Barcode Scanner', description: 'Scan a barcode / QR code with the device camera.' },
  TriggerGeofence: { type: 'TriggerGeofence', category: ActionCategory.NonInput, label: 'Trigger Geofence', description: 'Fire when the device enters/exits a geofence.' },
  TimerStopwatch: { type: 'TimerStopwatch', category: ActionCategory.NonInput, label: 'Timer / Stopwatch', description: 'Start a countdown timer or elapsed-time stopwatch.' },
  GeneratePushAlert: { type: 'GeneratePushAlert', category: ActionCategory.NonInput, label: 'Generate Push Alert', description: 'Send a push notification to the device.' },
  GenerateEmailFromTFLO: { type: 'GenerateEmailFromTFLO', category: ActionCategory.NonInput, label: 'Generate Email (TFLO)', description: 'Send a server-generated email from Transflo.' },
  GenerateSMSFromTFLO: { type: 'GenerateSMSFromTFLO', category: ActionCategory.NonInput, label: 'Generate SMS (TFLO)', description: 'Send a server-generated SMS from Transflo.' },
  GetDeviceLocation: { type: 'GetDeviceLocation', category: ActionCategory.NonInput, label: 'Get Device Location', description: 'Capture the current GPS location from the device.' },
  GetELDLocation: { type: 'GetELDLocation', category: ActionCategory.NonInput, label: 'Get ELD Location', description: 'Capture the current location from the ELD.' },
  LaunchWebview: { type: 'LaunchWebview', category: ActionCategory.NonInput, label: 'Launch Webview', description: 'Open an in-app web view at a configured URL.' },

  // Input
  TextField: { type: 'TextField', category: ActionCategory.Input, label: 'Text Field', description: 'Free-text input.' },
  NumericField: { type: 'NumericField', category: ActionCategory.Input, label: 'Numeric Field', description: 'Numeric input with optional min/max.' },
  MultiSelectDropdown: { type: 'MultiSelectDropdown', category: ActionCategory.Input, label: 'Multi-Select Dropdown', description: 'Choose one or more options from a list.' },
  SingleSelectDropdown: { type: 'SingleSelectDropdown', category: ActionCategory.Input, label: 'Single-Select Dropdown', description: 'Choose exactly one option from a list.' },
  Label: { type: 'Label', category: ActionCategory.Input, label: 'Label', description: 'Static read-only text shown to the driver.' },
  RadioButton: { type: 'RadioButton', category: ActionCategory.Input, label: 'Radio Button', description: 'Single choice from a small set of options.' },
  Checkbox: { type: 'Checkbox', category: ActionCategory.Input, label: 'Checkbox', description: 'Boolean checkbox input.' },
  SimpleButton: { type: 'SimpleButton', category: ActionCategory.Input, label: 'Simple Button', description: 'A tappable button bound to an action.' },
  Date: { type: 'Date', category: ActionCategory.Input, label: 'Date', description: 'Date picker.' },
  Datetime: { type: 'Datetime', category: ActionCategory.Input, label: 'Date & Time', description: 'Combined date and time picker.' },
  MultiDateSelector: { type: 'MultiDateSelector', category: ActionCategory.Input, label: 'Multi-Date Selector', description: 'Select multiple dates.' },
  Time: { type: 'Time', category: ActionCategory.Input, label: 'Time', description: 'Time-of-day picker.' },
  TimeRangeSelector: { type: 'TimeRangeSelector', category: ActionCategory.Input, label: 'Time Range Selector', description: 'Select a start/end time range.' },
  TemperatureField: { type: 'TemperatureField', category: ActionCategory.Input, label: 'Temperature Field', description: 'Numeric temperature input with unit.' },
  Slider: { type: 'Slider', category: ActionCategory.Input, label: 'Slider', description: 'Numeric input via a slider with a min/max range.' },

  // Deferred
  LaunchEBOL: { type: 'LaunchEBOL', category: ActionCategory.NonInput, label: 'Launch eBOL', description: 'Open the electronic Bill of Lading.', deferred: true }, // deferred — not for v1
  LaunchEPOD: { type: 'LaunchEPOD', category: ActionCategory.NonInput, label: 'Launch ePOD', description: 'Open the electronic Proof of Delivery.', deferred: true }, // deferred — not for v1
};

/** All action types as an array (catalog order). */
export const ALL_ACTION_TYPES = Object.values(ActionType) as ActionType[];

/** Convenience: the category for a given action type. */
export function categoryOf(type: ActionType): ActionCategory {
  return ACTION_TYPE_CATALOG[type].category;
}
