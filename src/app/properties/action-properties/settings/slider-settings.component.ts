import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PrePopulatedCardComponent } from '../../shared/pre-populated-card/pre-populated-card.component';
import { SegmentedButtonGroupComponent } from '../../shared/segmented-button-group/segmented-button-group.component';

@Component({
  selector: 'ws-slider-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, InputNumberModule, PrePopulatedCardComponent, SegmentedButtonGroupComponent],
  template: `
    <div class="field">
      <label class="field__label">Label Text</label>
      <input pInputText [(ngModel)]="labelText" placeholder="Set Drop Down Label Text" class="field__input" />
    </div>

    <div class="field">
      <label class="field__label">Left & Right Labels</label>
      <div class="pair">
        <input pInputText [(ngModel)]="leftLabel" placeholder="Left Label" class="field__input" />
        <input pInputText [(ngModel)]="rightLabel" placeholder="Right Label" class="field__input" />
      </div>
    </div>

    <ws-pre-populated-card [(enabled)]="prePopulate" />

    <div class="field">
      <label class="field__label">Min & Max</label>
      <div class="pair">
        <p-inputnumber [(ngModel)]="min" placeholder="Set Minimum" styleClass="pair__input" />
        <p-inputnumber [(ngModel)]="max" placeholder="Set Maximum" styleClass="pair__input" />
      </div>
    </div>

    <div class="field">
      <label class="field__label">Type*</label>
      <ws-segmented-button-group [options]="typeOptions" [(value)]="displayType" />
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field__label { font-size: 12px; font-family: Roboto, sans-serif; color: #000; font-weight: 300; }
    .field__input { flex: 1; min-width: 0; font-size: 14px; }
    .pair { display: flex; gap: 8px; width: 100%; }
    :host ::ng-deep .pair__input { flex: 1; min-width: 0; }
    :host ::ng-deep .pair__input .p-inputnumber { width: 100%; }
    :host ::ng-deep .pair__input .p-inputnumber-input { width: 100%; }
  `,
})
export class SliderSettingsComponent {
  readonly labelText = model<string>('');
  readonly leftLabel = model<string>('');
  readonly rightLabel = model<string>('');
  readonly prePopulate = model<boolean>(false);
  readonly min = model<number>(0);
  readonly max = model<number>(100);
  readonly displayType = model<string>('Numeric');

  protected readonly typeOptions = ['Numeric', 'Stars'];
}
