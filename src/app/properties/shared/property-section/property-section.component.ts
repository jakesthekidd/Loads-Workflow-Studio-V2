import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ws-property-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="section">
      <button class="section__header" type="button" (click)="toggle()">
        <span class="section__title">{{ title() }}</span>
        <span class="section__header-actions" (click)="$event.stopPropagation()">
          <ng-content select="[sectionAction]" />
        </span>
        <i class="pi" [class.pi-chevron-up]="open()" [class.pi-chevron-down]="!open()"></i>
      </button>
      @if (open()) {
        <div class="section__body">
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; width: 100%; }

    .section__header {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: white;
      border: none;
      border-bottom: 1px solid var(--p-surface-border, #e2e6eb);
      cursor: pointer;
      gap: 8px;
      text-align: left;
    }

    .section__title {
      font-size: 16px;
      font-weight: 700;
      font-family: Roboto, sans-serif;
      color: #000;
      flex: 1 1 auto;
    }
    .section__header-actions {
      display: flex; align-items: center; gap: 4px; margin-right: 4px;
    }

    .section__header i {
      color: #606061;
      font-size: 14px;
    }

    .section__body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 16px 16px 32px;
    }
  `,
})
export class PropertySectionComponent {
  readonly title = input.required<string>();
  protected readonly open = signal(true);

  protected toggle(): void {
    this.open.update((v) => !v);
  }
}
