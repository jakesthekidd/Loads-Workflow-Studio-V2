/**
 * Workflow Studio — seed data for the mock API.
 *
 * One fully-realized "Pick Up" workflow (segments → steps → actions, exercising
 * several action configs) plus a small second workflow so the switcher has more
 * than one row. Also the action catalog and a few step templates.
 *
 * This stands in for what the .NET API will serve. Kept deterministic (no
 * Date.now()/random) so it's stable across reloads.
 */

import {
  ACTION_TYPE_CATALOG,
  ActionType,
  ActionTypeCatalogEntry,
  NodeRuntimeState,
  OrderEnforcement,
  RequirementLevel,
  StepTemplate,
  Workflow,
  WorkflowStatus,
  WorkflowSummary,
} from '@app/models';

const NOW = '2026-06-16T12:00:00Z';

const PICK_UP: Workflow = {
  id: 'wf-pickup',
  name: 'Pick Up',
  description: 'Driver pickup workflow: pre-trip, arrival, fueling, and departure.',
  status: WorkflowStatus.Active,
  enabled: true,
  fleets: [{ id: 'flt-se', name: 'Southeast Fleet' }],
  isDefault: true,
  metadata: { createdAt: '2026-05-18T09:00:00Z', createdBy: 'jake.cummings', updatedAt: NOW, updatedBy: 'jake.cummings' },
  segments: [
    {
      id: 'seg-start-load',
      workflowId: 'wf-pickup',
      label: 'Start Load',
      requirement: RequirementLevel.Required,
      orderEnforcement: OrderEnforcement.Enforced,
      sortIndex: 0,
      
      statusMessage: 'Begin the load.',
      steps: [
        {
          id: 'stp-pretrip',
          segmentId: 'seg-start-load',
          label: 'Pre-Trip Inspection',
          requirement: RequirementLevel.Optional,
          orderEnforcement: OrderEnforcement.Enforced,
          sortIndex: 0,
          
          prompt: 'Complete the pre-trip inspection before departing.',
          runtimeState: NodeRuntimeState.Completed,
          actions: [
            { id: 'act-pt-head', stepId: 'stp-pretrip', label: 'Pre-Trip Checklist', sortIndex: 0, config: { actionType: ActionType.Label } },
            { id: 'act-pt-notes', stepId: 'stp-pretrip', label: 'Inspection Notes', sortIndex: 1, config: { actionType: ActionType.TextField, required: true, visible: true } },
            { id: 'act-pt-scan', stepId: 'stp-pretrip', label: 'Scan Trailer Tag', sortIndex: 2, config: { actionType: ActionType.BarcodeScanner } },
            {
              id: 'act-pt-trailer',
              stepId: 'stp-pretrip',
              label: 'Trailer Type',
              sortIndex: 3,
              config: {
                actionType: ActionType.SingleSelectDropdown,
                placeholder: 'Select trailer type',
                optionsSource: {
                  kind: 'static',
                  options: [
                    { value: 'dry', label: 'Dry Van' },
                    { value: 'reefer', label: 'Reefer' },
                    { value: 'flatbed', label: 'Flatbed' },
                  ],
                },
              },
            },
            { id: 'act-pt-geotab', stepId: 'stp-pretrip', label: 'Launch Geotab', sortIndex: 4, config: { actionType: ActionType.LaunchGeotabSDK } },
            { id: 'act-pt-submit', stepId: 'stp-pretrip', label: 'Submit', sortIndex: 5, config: { actionType: ActionType.SimpleButton } },
            { id: 'act-pt-sbs', stepId: 'stp-pretrip', label: 'Accept / Decline', sortIndex: 6, config: { actionType: ActionType.SideBySideButtons, button1Text: 'Accept', button2Text: 'Decline' } },
          ],
        },
        {
          id: 'stp-arrive-shipper',
          segmentId: 'seg-start-load',
          label: 'Arrive at Shipper',
          requirement: RequirementLevel.Required,
          orderEnforcement: OrderEnforcement.Enforced,
          sortIndex: 1,
          
          prompt: 'Confirm arrival at the shipper.',
          blocker: {
            enabled: true,
            message: 'Must be within the shipper geofence to continue.',
            condition: { enabled: true, statements: [{ id: 'blk-stmt-1', rules: [] }] },
          },
          runtimeState: NodeRuntimeState.Active,
          actions: [
            {
              id: 'act-as-geo',
              stepId: 'stp-arrive-shipper',
              label: 'Shipper Geofence',
              sortIndex: 0,
              config: { actionType: ActionType.TriggerGeofence, latitude: 33.749, longitude: -84.388, radiusMeters: 150, trigger: 'enter' },
            },
            { id: 'act-as-time', stepId: 'stp-arrive-shipper', label: 'Arrival Time', sortIndex: 1, config: { actionType: ActionType.Time, required: true } },
            { id: 'act-as-loc', stepId: 'stp-arrive-shipper', label: 'Capture Location', sortIndex: 2, config: { actionType: ActionType.GetDeviceLocation } },
          ],
        },
      ],
    },
    {
      id: 'seg-get-fuel',
      workflowId: 'wf-pickup',
      label: 'Get Fuel',
      requirement: RequirementLevel.Optional,
      orderEnforcement: OrderEnforcement.Unenforced,
      sortIndex: 1,
      
      steps: [
        {
          id: 'stp-fuel',
          segmentId: 'seg-get-fuel',
          label: 'Fuel Stop',
          requirement: RequirementLevel.Optional,
          orderEnforcement: OrderEnforcement.Unenforced,
          sortIndex: 0,
          
          actions: [
            { id: 'act-fu-gal', stepId: 'stp-fuel', label: 'Gallons', sortIndex: 0, config: { actionType: ActionType.NumericField } },
            { id: 'act-fu-lvl', stepId: 'stp-fuel', label: 'Tank Level', sortIndex: 1, config: { actionType: ActionType.Slider, min: 0, max: 100, step: 5, defaultValue: 50, unitLabel: '%' } },
            { id: 'act-fu-rcpt', stepId: 'stp-fuel', label: 'Scan Receipt', sortIndex: 2, config: { actionType: ActionType.BarcodeScanner } },
          ],
        },
      ],
    },
    {
      id: 'seg-end-load',
      workflowId: 'wf-pickup',
      label: 'End Load',
      requirement: RequirementLevel.Required,
      orderEnforcement: OrderEnforcement.Enforced,
      sortIndex: 2,
      
      steps: [
        {
          id: 'stp-depart',
          segmentId: 'seg-end-load',
          label: 'Depart Shipper',
          requirement: RequirementLevel.Required,
          orderEnforcement: OrderEnforcement.Enforced,
          sortIndex: 0,
          
          actions: [
            { id: 'act-dp-act', stepId: 'stp-depart', label: 'Record Departure', sortIndex: 0, config: { actionType: ActionType.StopActualization } },
            { id: 'act-dp-cc', stepId: 'stp-depart', label: 'Send Check-call', sortIndex: 1, config: { actionType: ActionType.SendCheckcall } },
          ],
        },
        {
          id: 'stp-pod',
          segmentId: 'seg-end-load',
          label: 'Proof of Delivery',
          requirement: RequirementLevel.Required,
          orderEnforcement: OrderEnforcement.Enforced,
          sortIndex: 1,
          
          actions: [
            { id: 'act-pod-head', stepId: 'stp-pod', label: 'POD', sortIndex: 0, config: { actionType: ActionType.Label } },
            { id: 'act-pod-cfm', stepId: 'stp-pod', label: 'Confirm Delivery', sortIndex: 1, config: { actionType: ActionType.Checkbox, required: true } },
            {
              id: 'act-pod-email',
              stepId: 'stp-pod',
              label: 'Email POD',
              sortIndex: 2,
              config: {
                actionType: ActionType.GenerateEmailFromTFLO,
                recipientType: 'static' as const,
                recipientValue: '{{shipper.email}}',
                subject: 'POD for load {{load.id}}',
                additionalBody: 'Proof of delivery attached for load {{load.id}}.',
              },
            },
          ],
        },
      ],
    },
  ],
};

const DROP_HOOK: Workflow = {
  id: 'wf-drophook',
  name: 'Drop & Hook',
  description: 'Drop the loaded trailer and hook an empty.',
  status: WorkflowStatus.Inactive,
  enabled: false,
  fleets: [{ id: 'flt-mw', name: 'Midwest Fleet' }],
  isDefault: false,
  metadata: { createdAt: '2026-05-20T10:00:00Z', createdBy: 'jake.cummings', updatedAt: NOW, updatedBy: 'jake.cummings' },
  segments: [
    {
      id: 'seg-dh-drop',
      workflowId: 'wf-drophook',
      label: 'Drop Trailer',
      requirement: RequirementLevel.Required,
      orderEnforcement: OrderEnforcement.Enforced,
      sortIndex: 0,
      
      steps: [
        {
          id: 'stp-dh-drop',
          segmentId: 'seg-dh-drop',
          label: 'Disconnect',
          requirement: RequirementLevel.Required,
          orderEnforcement: OrderEnforcement.Enforced,
          sortIndex: 0,
          
          actions: [
            { id: 'act-dh-loc', stepId: 'stp-dh-drop', label: 'Drop Location', sortIndex: 0, config: { actionType: ActionType.GetDeviceLocation } },
            { id: 'act-dh-cfm', stepId: 'stp-dh-drop', label: 'Confirm Disconnected', sortIndex: 1, config: { actionType: ActionType.Checkbox } },
          ],
        },
      ],
    },
  ],
};

/** All seed workflows, keyed by id. */
export const SEED_WORKFLOWS: readonly Workflow[] = [PICK_UP, DROP_HOOK];

/** Derive a summary row from a workflow. */
export function toSummary(w: Workflow): WorkflowSummary {
  return {
    id: w.id,
    name: w.name,
    description: w.description,
    status: w.status,
    enabled: w.enabled,
    isDefault: w.isDefault,
    fleetCount: w.fleets.length,
    updatedAt: w.metadata.updatedAt,
  };
}

/** The full action-type catalog (source of truth lives in the model). */
export const SEED_ACTION_CATALOG: readonly ActionTypeCatalogEntry[] = Object.values(ACTION_TYPE_CATALOG);

/** A few step templates for the Template Steps picker. */
export const SEED_STEP_TEMPLATES: readonly StepTemplate[] = [
  {
    id: 'tpl-begin-load',
    name: 'Begin Load',
    category: 'Stops (Loads)',
    origin: 'system',
    description: 'Standard load start with check-in.',
    blueprint: {
      label: 'Begin Load',
      requirement: RequirementLevel.Required,
      orderEnforcement: OrderEnforcement.Enforced,
      
      actions: [
        { label: 'Check In', config: { actionType: ActionType.SimpleButton } },
        { label: 'Capture Location', config: { actionType: ActionType.GetDeviceLocation } },
      ],
    },
  },
  {
    id: 'tpl-arrive-shipper',
    name: 'Arrive at Shipper',
    category: 'Stops (Loads)',
    origin: 'system',
    description: 'Geofenced arrival at the shipper.',
    blueprint: {
      label: 'Arrive at Shipper',
      requirement: RequirementLevel.Required,
      orderEnforcement: OrderEnforcement.Enforced,
      
      actions: [
        { label: 'Shipper Geofence', config: { actionType: ActionType.TriggerGeofence, latitude: 0, longitude: 0, radiusMeters: 150, trigger: 'enter' } },
        { label: 'Arrival Time', config: { actionType: ActionType.Time } },
      ],
    },
  },
  {
    id: 'tpl-weigh-station',
    name: 'Weigh Station',
    category: 'Stops (Loads)',
    origin: 'system',
    description: 'Capture a scale weight.',
    blueprint: {
      label: 'Weigh Station',
      requirement: RequirementLevel.Optional,
      orderEnforcement: OrderEnforcement.Unenforced,
      
      actions: [{ label: 'Gross Weight', config: { actionType: ActionType.NumericField } }],
    },
  },
];
