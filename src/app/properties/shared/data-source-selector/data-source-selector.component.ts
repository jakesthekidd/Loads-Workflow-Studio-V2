import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { ConditionFieldRef, ConditionSourceType } from '@app/models';

// ─── Icons (currentColor so they inherit text color) ─────────────────────────

const SEGMENT_SVG = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.88647 8.73218C5.25674 8.7312 5.98485 8.7319 6.39331 8.74487C6.79981 8.75779 6.90748 8.78187 7.02222 8.84058C7.26893 8.96683 7.44242 9.14523 7.57202 9.40112C7.5984 9.45322 7.6155 9.51653 7.62769 9.61597C7.63982 9.71513 7.64809 9.85769 7.65405 10.072C7.666 10.5019 7.6687 11.2346 7.6687 12.5183C7.6687 13.8017 7.666 14.5338 7.65405 14.9636C7.64809 15.1779 7.63981 15.3205 7.62769 15.4197C7.6155 15.5191 7.59839 15.5824 7.57202 15.6345C7.44195 15.8913 7.26837 16.0686 7.01929 16.196C6.90251 16.2558 6.80094 16.2804 6.3894 16.2917C5.97659 16.3031 5.23415 16.3006 3.82202 16.2937L0.868896 16.28L0.837646 16.2791L0.811279 16.2615L0.587646 16.1033C0.453327 16.0086 0.290556 15.831 0.221436 15.699C0.191979 15.6427 0.167079 15.5901 0.14917 15.4968C0.132211 15.4084 0.122045 15.2839 0.11499 15.0818C0.100842 14.6763 0.100342 13.9353 0.100342 12.4919V9.50952L0.11792 9.48413L0.244873 9.29956C0.40902 9.06193 0.565097 8.92248 0.791748 8.81714C0.841756 8.7939 0.917451 8.78095 1.02417 8.77124C1.13505 8.76116 1.29342 8.75341 1.51929 8.7478C1.97212 8.73657 2.70462 8.73302 3.88647 8.73218ZM12.5173 8.73218C13.8879 8.7312 14.6167 8.73189 15.0251 8.74487C15.431 8.75778 15.5385 8.78203 15.6531 8.84058C15.8999 8.96683 16.0742 9.14518 16.2039 9.40112C16.2302 9.4532 16.2464 9.5166 16.2585 9.61597C16.2707 9.71513 16.2799 9.85763 16.2859 10.072C16.2978 10.5019 16.2996 11.2346 16.2996 12.5183C16.2996 13.8017 16.2978 14.5338 16.2859 14.9636C16.2799 15.178 16.2707 15.3205 16.2585 15.4197C16.2464 15.519 16.2302 15.5824 16.2039 15.6345C16.0738 15.8912 15.9001 16.0687 15.6511 16.196C15.5343 16.2558 15.4328 16.2804 15.0212 16.2917C14.6085 16.3031 13.8655 16.3006 12.4529 16.2937L9.50073 16.28L9.46851 16.2791L9.44312 16.2615L9.21851 16.1033C9.08423 16.0086 8.92235 15.8309 8.85327 15.699C8.82379 15.6427 8.79893 15.5902 8.78101 15.4968C8.76404 15.4084 8.75291 15.2839 8.74585 15.0818C8.7317 14.6763 8.7312 13.9353 8.7312 12.4919V9.50952L8.74878 9.48413L8.87671 9.29956C9.04083 9.062 9.19695 8.92246 9.42358 8.81714C9.47353 8.79398 9.54865 8.78094 9.65503 8.77124C9.76596 8.76114 9.92492 8.75341 10.1511 8.7478C10.6039 8.73657 11.3358 8.73302 12.5173 8.73218Z" fill="currentColor"/></svg>`;
const STEP_SVG = `<svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99767 8.01115C4.06119 7.93924 4.11905 7.86733 4.18257 7.80113C4.80081 7.17335 5.41338 6.53985 6.04296 5.92462C6.15072 5.81847 6.33336 5.73401 6.48196 5.73401C9.88171 5.72373 13.2826 5.7283 16.6823 5.72145C16.9364 5.72145 17.0011 5.80706 17 6.05246C16.9898 7.35483 16.9886 8.65606 17 9.95843C17.0022 10.2301 16.9058 10.2917 16.6551 10.2917C13.2644 10.2849 9.87377 10.2883 6.4831 10.2815C6.35491 10.2815 6.19383 10.2347 6.10535 10.149C5.42018 9.48131 4.74976 8.79874 4.07594 8.12073C4.05098 8.09562 4.03283 8.06138 3.99767 8.01115Z" fill="currentColor"/></svg>`;
const ACTION_SVG = `<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.44531 0C7.14841 0 10.8516 0 14.5547 0C14.6672 0.0261978 14.758 0.0825494 14.8242 0.18022C15.2944 0.874725 15.7657 1.56844 16.2367 2.26242C16.7389 3.00246 17.2423 3.74163 17.742 4.48325C17.8369 4.624 17.9578 4.75086 18 4.92308V5.02857C17.9792 5.10374 17.9488 5.17283 17.8984 5.23472C17.4642 5.76879 17.0314 6.304 16.5982 6.83886C15.8121 7.80967 15.026 8.78066 14.2399 9.75138C13.4122 10.7734 12.5844 11.7953 11.7567 12.8171C10.9557 13.8062 10.1542 14.7946 9.35473 15.7849C9.27466 15.884 9.19081 15.9713 9.06152 15.9999H8.93848C8.81112 15.9712 8.72622 15.8875 8.648 15.7884C8.44919 15.5368 8.24546 15.289 8.04357 15.0397C7.24351 14.052 6.44326 13.0644 5.64328 12.0765C4.75752 10.9828 3.87211 9.88888 2.98644 8.79516C2.03985 7.62637 1.09336 6.45749 0.146074 5.28932C0.0818262 5.21029 0.0197754 5.13169 0 5.02857V4.92308C0.0246973 4.86576 0.0420996 4.80378 0.075498 4.75209C0.17543 4.59719 0.281777 4.44642 0.3854 4.29389C1.31546 2.92466 2.24552 1.55543 3.17522 0.185934C3.22251 0.116308 3.27973 0.0597802 3.35856 0.0282198C3.38669 0.016967 3.41631 0.00931868 3.44531 0Z" fill="currentColor"/></svg>`;

export interface DssWorkflowAction { id: string; label: string; actionType: string; }
export interface DssWorkflowStep   { id: string; label: string; actions: DssWorkflowAction[]; }
export interface DssWorkflowSegment{ id: string; label: string; steps: DssWorkflowStep[]; }
export interface DssWorkflowData   { segments: DssWorkflowSegment[]; }
export interface DssGeotabItem     { id: string; label: string; }
export interface DssJsonNode {
  key: string;
  type: 'object' | 'array' | 'string' | 'numeric' | 'date-time' | 'boolean';
  children?: DssJsonNode[];
  isArray?: boolean;
}

@Component({
  selector: 'ws-data-source-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule],
  template: `
    <div class="dss-wrap" [class.dss-wrap--open]="open">

      <button *ngIf="!embedded" type="button" class="dss-trigger"
        [class.dss-trigger--open]="open" (click)="toggle()">
        <span class="dss-trigger__label" [class.dss-trigger__label--placeholder]="!value">
          {{ value ? value.label : placeholder }}
        </span>
        <i class="pi" [ngClass]="open ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
      </button>

      <div *ngIf="open || embedded" class="dss-dialog" [class.dss-dialog--embedded]="embedded">

        <div class="dss-dialog__header">
          <div class="dss-dialog__title">Select Data Type</div>
          <div class="dss-tabs">
            <button *ngFor="let tab of visibleTabs()" type="button" class="dss-tab"
              [class.dss-tab--active]="activeTab === tab.id" (click)="setTab(tab.id)">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="dss-search">
          <i class="pi pi-search"></i>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search..." class="dss-search__input" />
        </div>

        <!-- Workflow -->
        <div *ngIf="activeTab === 'workflow'" class="dss-list">
          <ng-container *ngFor="let seg of filteredSegments()">
            <div class="dss-row dss-row--segment" (click)="toggleExpand('seg-' + seg.id)">
              <i class="pi" [ngClass]="isExpanded('seg-' + seg.id) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
              <span class="dss-row__icon" [innerHTML]="icons.segment"></span>
              <span class="dss-row__label">{{ seg.label }}</span>
            </div>
            <ng-container *ngIf="isExpanded('seg-' + seg.id)">
              <ng-container *ngFor="let step of seg.steps">
                <div class="dss-row dss-row--step" (click)="toggleExpand('step-' + step.id)">
                  <i class="pi" [ngClass]="isExpanded('step-' + step.id) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                  <span class="dss-row__icon" [innerHTML]="icons.step"></span>
                  <span class="dss-row__label">{{ step.label }}</span>
                </div>
                <ng-container *ngIf="isExpanded('step-' + step.id)">
                  <div *ngFor="let action of step.actions" class="dss-row dss-row--action"
                    [class.dss-row--selected]="isSelected(action.id)"
                    (click)="select({ source: 'workflow', id: action.id, label: action.label, type: action.actionType, path: [seg.label, step.label] })">
                    <span class="dss-row__icon" [innerHTML]="icons.action"></span>
                    <span class="dss-row__label">{{ action.label }}</span>
                    <span class="dss-action-pill">{{ action.actionType }}</span>
                  </div>
                </ng-container>
              </ng-container>
            </ng-container>
          </ng-container>
        </div>

        <!-- Geotab -->
        <div *ngIf="activeTab === 'geotab'" class="dss-list">
          <div *ngFor="let item of filteredGeotab()" class="dss-row dss-row--flat"
            [class.dss-row--selected]="isSelected(item.id)"
            (click)="select({ source: 'geotab', id: item.id, label: item.label })">
            <span class="dss-row__label">{{ item.label }}</span>
          </div>
        </div>

        <!-- JSON -->
        <div *ngIf="activeTab === 'json'" class="dss-list">
          <ng-container *ngTemplateOutlet="jsonNodes; context: { nodes: filteredJson(), depth: 0, path: [] }"></ng-container>
        </div>

        <ng-template #jsonNodes let-nodes="nodes" let-depth="depth" let-path="path">
          <ng-container *ngFor="let node of nodes">
            <div class="dss-json-row"
              [class.dss-json-row--object]="node.type === 'object'"
              [class.dss-json-row--selected]="isSelected(buildJsonId(path, node.key))"
              [style.paddingLeft.px]="12 + depth * 16"
              (click)="onJsonClick(node, path)">
              <i *ngIf="node.type === 'object' || node.type === 'array'" class="pi"
                [ngClass]="isExpanded('json-' + buildJsonId(path, node.key)) ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
              <span class="dss-json-key">"{{ node.key }}":</span>
              <span class="dss-json-type">{{ jsonTypeLabel(node) }}</span>
            </div>
            <ng-container *ngIf="(node.type === 'object' || node.type === 'array') && isExpanded('json-' + buildJsonId(path, node.key))">
              <ng-container *ngTemplateOutlet="jsonNodes; context: { nodes: node.children || [], depth: depth + 1, path: path.concat(node.key) }"></ng-container>
            </ng-container>
          </ng-container>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dss-wrap { position: relative; font-family: var(--p-font-family, sans-serif); }

    .dss-trigger {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 8px 12px;
      background: #fff; border: 1.5px solid var(--p-primary-500, #2474BB);
      border-radius: 6px; color: var(--p-primary-500, #2474BB);
      font-size: 13px; cursor: pointer;
    }
    .dss-trigger__label { flex: 1; text-align: left; font-weight: 500; color: var(--p-primary-500, #2474BB); }
    .dss-trigger__label--placeholder { color: var(--p-surface-400, #9CA3AF); font-weight: 400; }
    .dss-trigger i { font-size: 11px; }

    .dss-dialog {
      position: absolute; top: calc(100% + 6px); left: 0; width: 380px;
      max-height: 480px; background: #fff; border-radius: 8px;
      box-shadow: 0 10px 32px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08);
      display: flex; flex-direction: column; overflow: hidden; z-index: 1000;
    }
    .dss-dialog--embedded { position: static; top: auto; left: auto; width: 100%; box-shadow: none; border: 1px solid var(--p-surface-200, #E5E7EB); border-radius: 6px; }

    .dss-dialog__header { background: var(--p-surface-100, #F3F4F6); padding: 10px 12px 12px; }
    .dss-dialog__title { font-size: 11px; color: var(--p-surface-400, #6B7280); margin-bottom: 8px; }

    .dss-tabs { display: flex; background: #fff; border-radius: 6px; padding: 3px; border: 1px solid var(--p-surface-200, #E5E7EB); }
    .dss-tab {
      flex: 1; padding: 6px 10px; background: transparent; border: none;
      border-radius: 4px; color: var(--p-surface-400, #6B7280); font-size: 12px;
      font-weight: 600; cursor: pointer;
    }
    .dss-tab--active { background: var(--p-primary-500, #2474BB); color: #fff; }

    .dss-search { position: relative; padding: 10px 12px; border-bottom: 1px solid var(--p-surface-200, #E5E7EB); }
    .dss-search i { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: var(--p-surface-400, #9CA3AF); font-size: 12px; }
    .dss-search__input {
      width: 100%; padding: 7px 10px 7px 30px; border: 1px solid var(--p-surface-300, #D1D5DB);
      border-radius: 6px; background: #fff; font-size: 12px; outline: none; box-sizing: border-box;
    }
    .dss-search__input:focus { border-color: var(--p-primary-500, #2474BB); }

    .dss-list { flex: 1; overflow-y: auto; padding: 4px 0; }

    .dss-row {
      display: flex; align-items: center; gap: 7px; padding: 8px 12px;
      cursor: pointer; font-size: 12px; color: #111827;
    }
    .dss-row:hover { background: var(--p-surface-50, #F9FAFB); }
    .dss-row--selected { background: #EFF6FF; color: var(--p-primary-600, #1E40AF); font-weight: 600; }
    .dss-row__icon { display: inline-flex; align-items: center; width: 16px; height: 16px; color: var(--p-surface-400, #6B7280); flex-shrink: 0; }
    .dss-row__icon svg { width: 100%; height: 100%; }
    .dss-row__label { flex: 1; }
    .dss-row--step { padding-left: 24px; }
    .dss-row--action { padding-left: 44px; }
    .dss-action-pill {
      padding: 2px 8px; background: #DBEAFE; color: var(--p-primary-600, #1E40AF);
      border-radius: 10px; font-size: 10px; font-weight: 600;
    }

    .dss-json-row {
      display: flex; align-items: center; gap: 6px; padding: 6px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
      cursor: pointer;
    }
    .dss-json-row:hover { background: var(--p-surface-50, #F9FAFB); }
    .dss-json-row--selected { background: #EFF6FF; }
    .dss-json-key { padding: 2px 7px; background: #FEE2E2; color: #B91C1C; border-radius: 10px; font-weight: 600; }
    .dss-json-row--object .dss-json-key { background: var(--p-primary-500, #2474BB); color: #fff; }
    .dss-json-type { padding: 2px 7px; background: #D1FAE5; color: #047857; border-radius: 10px; font-weight: 600; }
  `],
})
export class DataSourceSelectorComponent {
  constructor(private sanitizer: DomSanitizer) {
    const c = (svg: string) => sanitizer.bypassSecurityTrustHtml(svg);
    this.icons = { segment: c(SEGMENT_SVG), step: c(STEP_SVG), action: c(ACTION_SVG) };
  }

  icons: { segment: SafeHtml; step: SafeHtml; action: SafeHtml };

  @Input() workflow: DssWorkflowData = { segments: [] };
  @Input() geotab: DssGeotabItem[] = [];
  @Input() json: DssJsonNode[] = [];
  @Input() value: ConditionFieldRef | null = null;
  @Input() placeholder = 'Select a value';
  @Input() activeTab: ConditionSourceType = 'workflow';
  @Input() embedded = false;
  @Input() showWorkflow = true;
  @Input() showGeotab = true;
  @Input() showJson = true;

  @Output() valueChange = new EventEmitter<ConditionFieldRef | null>();

  @ViewChild('dialog') dialog?: ElementRef;
  open = false;
  searchTerm = '';
  expanded = new Set<string>();

  visibleTabs(): { id: ConditionSourceType; label: string }[] {
    return [
      { id: 'workflow', label: 'Workflow' },
      { id: 'geotab',   label: 'Geotab'   },
      { id: 'json',     label: 'JSON'      },
    ].filter(t =>
      (t.id === 'workflow' && this.showWorkflow) ||
      (t.id === 'geotab'   && this.showGeotab)   ||
      (t.id === 'json'     && this.showJson)
    ) as { id: ConditionSourceType; label: string }[];
  }

  isSelected(id: string): boolean { return this.value?.id === id; }

  select(ref: ConditionFieldRef): void {
    this.value = ref;
    this.valueChange.emit(ref);
    if (!this.embedded) this.open = false;
  }

  toggle(): void { this.open ? this.open = false : this.open = true; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.open || this.embedded) return;
    const host = (this as any)._elementRef?.nativeElement as HTMLElement | undefined;
    if (host && !host.contains(e.target as Node)) this.open = false;
  }

  setTab(tab: ConditionSourceType): void { this.activeTab = tab; this.searchTerm = ''; }

  toggleExpand(key: string): void {
    this.expanded.has(key) ? this.expanded.delete(key) : this.expanded.add(key);
  }
  isExpanded(key: string): boolean { return this.expanded.has(key); }

  filteredSegments(): DssWorkflowSegment[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.workflow.segments;
    return this.workflow.segments
      .map(seg => ({
        ...seg,
        steps: seg.steps
          .map(step => ({ ...step, actions: step.actions.filter(a => a.label.toLowerCase().includes(q)) }))
          .filter(step => step.label.toLowerCase().includes(q) || step.actions.length > 0),
      }))
      .filter(seg => seg.label.toLowerCase().includes(q) || seg.steps.length > 0);
  }

  filteredGeotab(): DssGeotabItem[] {
    const q = this.searchTerm.trim().toLowerCase();
    return q ? this.geotab.filter(i => i.label.toLowerCase().includes(q)) : this.geotab;
  }

  filteredJson(): DssJsonNode[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.json;
    const filter = (nodes: DssJsonNode[]): DssJsonNode[] =>
      nodes.map(n => {
        if ((n.type === 'object' || n.type === 'array') && n.children) {
          const kids = filter(n.children);
          if (n.key.toLowerCase().includes(q) || kids.length) return { ...n, children: kids };
          return null;
        }
        return n.key.toLowerCase().includes(q) ? n : null;
      }).filter((n): n is DssJsonNode => n !== null);
    return filter(this.json);
  }

  buildJsonId(path: string[], key: string): string { return [...path, key].join('.'); }

  jsonTypeLabel(node: DssJsonNode): string {
    if (node.type === 'object')    return '{ }';
    if (node.type === 'array')     return '[ ]';
    if (node.type === 'numeric')   return '(Numeric)';
    if (node.type === 'date-time') return '(Date Time)';
    if (node.type === 'boolean')   return '(Boolean)';
    return '(String)';
  }

  onJsonClick(node: DssJsonNode, path: string[]): void {
    if (node.type === 'object' || node.type === 'array') {
      this.toggleExpand('json-' + this.buildJsonId(path, node.key));
    } else {
      this.select({ source: 'json', id: this.buildJsonId(path, node.key), label: node.key, type: node.type, path });
    }
  }
}
