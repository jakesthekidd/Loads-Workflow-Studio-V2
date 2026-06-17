import {
  ChangeDetectionStrategy,
  Component,
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
  CertLogsConfig,
  GenerateEmailFromTFLOConfig,
  GeneratePushAlertConfig,
  GenerateSMSFromTFLOConfig,
  GetDeviceLocationConfig,
  GetELDLocationConfig,
  RejectWorkflowConfig,
  Step,
  StopActualizationConfig,
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
import { RejectWorkflowSettingsComponent } from './settings/reject-workflow-settings.component';
import { StopActualizationSettingsComponent } from './settings/stop-actualization-settings.component';
import { TriggerGeofenceSettingsComponent } from './settings/trigger-geofence-settings.component';

interface BaseDraft {
  required: boolean;
  visible: boolean;
}

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
  ],
  template: `
    <ws-panel-shell
      [title]="action().label"
      [stepName]="step().label"
      [typeBadge]="typeBadge()"
      (save)="onSave()"
      (cancel)="store.closeProperties()"
    >
      <!-- Define Action (common to all types) -->
      <ws-property-section title="Define Action">
        <ws-property-toggle-row
          label="REQUIRED"
          [value]="baseDraft().required"
          (valueChange)="patchBase('required', $event)"
        />
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
            <ws-get-eld-location-settings [(trigger)]="eldLocationDraft().trigger" />
          }
          @case (ActionType.CertLogs) {
            <ws-cert-logs-settings
              [(titleLabel)]="certLogsDraft().titleLabel"
              [(bodyTextLabel)]="certLogsDraft().bodyTextLabel"
            />
          }
          @default {
            <p class="no-settings">No additional settings for this action type.</p>
          }
        }
      </ws-property-section>
    </ws-panel-shell>
  `,
  styles: `
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

  // ---- draft signals -------------------------------------------------------
  protected readonly baseDraft = signal<BaseDraft>({ required: false, visible: true });

  protected readonly acceptDraft = signal<{ buttonText: string; buttonType: 'simple' }>({ buttonText: 'Accept', buttonType: 'simple' });
  protected readonly rejectDraft = signal<{ buttonText: string; buttonType: 'simple' }>({ buttonText: 'Swipe to decline workflow', buttonType: 'simple' });
  protected readonly stopDraft = signal<{ trigger: 'geofence' | undefined; geofenceId: string | undefined; promptManualConfirm: boolean }>({ trigger: undefined, geofenceId: undefined, promptManualConfirm: false });
  protected readonly barcodeDraft = signal<{ repeatable: boolean; labelText: string }>({ repeatable: false, labelText: '' });
  protected readonly geofenceDraft = signal<{ trigger: 'enter' | 'exit' | 'dwell' | undefined; dwellSeconds: number | undefined }>({ trigger: undefined, dwellSeconds: undefined });
  protected readonly pushAlertDraft = signal<{ pushAlertText: string; trigger: 'geofence' | undefined }>({ pushAlertText: '', trigger: undefined });
  protected readonly emailDraft = signal<{ prePopulate: boolean; trigger: 'geofence' | undefined; recipientType: 'json' | 'static'; recipientValue: string; subject: string; selectedActionIds: string[]; additionalBody: string }>({ prePopulate: false, trigger: undefined, recipientType: 'json', recipientValue: '', subject: '', selectedActionIds: [], additionalBody: '' });
  protected readonly smsDraft = signal<{ prePopulate: boolean; trigger: 'geofence' | undefined; recipientType: 'json' | 'static'; recipientValue: string; subject: string; selectedActionIds: string[]; additionalBody: string }>({ prePopulate: false, trigger: undefined, recipientType: 'json', recipientValue: '', subject: '', selectedActionIds: [], additionalBody: '' });
  protected readonly deviceLocationDraft = signal<{ trigger: 'geofence' | undefined }>({ trigger: undefined });
  protected readonly eldLocationDraft = signal<{ trigger: 'geofence' | undefined }>({ trigger: undefined });
  protected readonly certLogsDraft = signal<{ titleLabel: string; bodyTextLabel: string }>({ titleLabel: '', bodyTextLabel: '' });

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
        this.eldLocationDraft.set({ trigger: c.trigger });
        break;
      }
      case ActionType.CertLogs: {
        const c = cfg as CertLogsConfig;
        this.certLogsDraft.set({ titleLabel: c.titleLabel ?? '', bodyTextLabel: c.bodyTextLabel ?? '' });
        break;
      }
    }
  }

  private buildConfig(base: BaseDraft): ActionConfig {
    const existing = this.action().config;
    const baseFields = { required: base.required, visible: base.visible };

    switch (existing.actionType) {
      case ActionType.AcceptWorkflow: return { ...existing, ...baseFields, ...this.acceptDraft() };
      case ActionType.RejectWorkflow: return { ...existing, ...baseFields, ...this.rejectDraft() };
      case ActionType.StopActualization: return { ...existing, ...baseFields, ...this.stopDraft() };
      case ActionType.BarcodeScanner: return { ...existing, ...baseFields, ...this.barcodeDraft() };
      case ActionType.TriggerGeofence: return { ...existing, ...baseFields, ...this.geofenceDraft() };
      case ActionType.GeneratePushAlert: return { ...existing, ...baseFields, ...this.pushAlertDraft() };
      case ActionType.GenerateEmailFromTFLO: return { ...existing, ...baseFields, ...this.emailDraft() };
      case ActionType.GenerateSMSFromTFLO: return { ...existing, ...baseFields, ...this.smsDraft() };
      case ActionType.GetDeviceLocation: return { ...existing, ...baseFields, ...this.deviceLocationDraft() };
      case ActionType.GetELDLocation: return { ...existing, ...baseFields, ...this.eldLocationDraft() };
      case ActionType.CertLogs: return { ...existing, ...baseFields, ...this.certLogsDraft() };
      default: return { ...existing, ...baseFields };
    }
  }
}
