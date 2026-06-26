import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnChanges,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  BlockingCondition,
  ConditionGroup,
  OrderEnforcement,
  RequirementLevel,
  Step,
} from '@app/models';
import { WorkflowStudioStore } from '@app/services';
import { PanelShellComponent } from '../shared/panel-shell/panel-shell.component';
import { PropertySectionComponent } from '../shared/property-section/property-section.component';
import { PropertyToggleRowComponent } from '../shared/property-toggle-row/property-toggle-row.component';
import { StatusMessageCardComponent } from '../shared/status-message-card/status-message-card.component';
import { ConditionsSectionComponent } from '../shared/conditions-section/conditions-section.component';

interface StepDraft {
  required: boolean;
  visible: boolean;
  enforcedOrder: boolean;
  makePrompt: boolean;
  form: boolean;
  statusMessageEnabled: boolean;
  selectedMessages: string[];
  condition: ConditionGroup | undefined;
  blocker: BlockingCondition | undefined;
}

function draftFromStep(step: Step): StepDraft {
  return {
    required: step.requirement === RequirementLevel.Required,
    visible: true,
    enforcedOrder: step.orderEnforcement === OrderEnforcement.Enforced,
    makePrompt: !!step.prompt,
    form: false,
    statusMessageEnabled: !!step.statusMessage,
    selectedMessages: step.statusMessage ? [step.statusMessage] : [],
    condition: step.condition,
    blocker: step.blocker,
  };
}

@Component({
  selector: 'ws-step-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: flex; flex: 1 1 auto; min-height: 0; }`,
  imports: [
    PanelShellComponent,
    PropertySectionComponent,
    PropertyToggleRowComponent,
    StatusMessageCardComponent,
    ConditionsSectionComponent,
  ],
  template: `
    <ws-panel-shell
      [title]="step().label"
      (titleChanged)="store.updateStepLabel(step().id, $event)"
      (save)="onSave()"
      (cancel)="store.closeProperties()"
    >
      <ws-property-section title="Define Action">
        <ws-property-toggle-row label="REQUIRED" [(value)]="draft().required" (valueChange)="patch('required', $event)" />
        <ws-property-toggle-row label="Visible" [(value)]="draft().visible" (valueChange)="patch('visible', $event)" />
        <ws-property-toggle-row label="Enforced Order" [(value)]="draft().enforcedOrder" (valueChange)="patch('enforcedOrder', $event)" />
        <ws-property-toggle-row label="Make Prompt" [(value)]="draft().makePrompt" (valueChange)="patch('makePrompt', $event)" />
        <ws-property-toggle-row label="Form" [(value)]="draft().form" (valueChange)="patch('form', $event)" />
      </ws-property-section>

      <ws-property-section title="Settings">
        <ws-status-message-card
          [(enabled)]="draft().statusMessageEnabled"
          [(selectedMessages)]="draft().selectedMessages"
        />
      </ws-property-section>

      <ws-conditions-section
        [condition]="draft().condition"
        [blocker]="draft().blocker"
        (conditionChange)="patch('condition', $event)"
        (blockerChange)="patch('blocker', $event)"
      />
    </ws-panel-shell>
  `,
})
export class StepPropertiesComponent implements OnChanges {
  protected readonly store = inject(WorkflowStudioStore);

  readonly step = input.required<Step>();

  private readonly conditionsRef = viewChild(ConditionsSectionComponent, { read: ElementRef });

  constructor() {
    effect(() => {
      if (this.store.propertiesPanelScrollTarget() !== 'conditions') return;
      const el = this.conditionsRef();
      if (!el) return;
      untracked(() => this.store.propertiesPanelScrollTarget.set(null));
      setTimeout(() => el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    });
  }

  protected readonly draft = signal<StepDraft>({ required: false, visible: true, enforcedOrder: false, makePrompt: false, form: false, statusMessageEnabled: false, selectedMessages: [], condition: undefined, blocker: undefined });

  ngOnChanges(): void {
    this.draft.set(draftFromStep(this.step()));
  }

  protected patch<K extends keyof StepDraft>(key: K, value: StepDraft[K]): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected onSave(): void {
    const d = this.draft();
    this.store.updateStep(this.step().id, {
      requirement: d.required ? RequirementLevel.Required : RequirementLevel.Optional,
      orderEnforcement: d.enforcedOrder ? OrderEnforcement.Enforced : OrderEnforcement.Unenforced,
      prompt: d.makePrompt ? (this.step().prompt ?? 'Prompt') : undefined,
      statusMessage: d.statusMessageEnabled ? (d.selectedMessages[0] ?? undefined) : undefined,
      condition: d.condition,
      blocker: d.blocker,
    });
    this.store.closeProperties();
  }
}
