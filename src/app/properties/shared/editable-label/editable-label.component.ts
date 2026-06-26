import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnChanges,
  output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Inline-editable label — view mode shows a span; edit mode shows an input.
 * The parent controls when edit mode is active via [editMode].
 * Emit (dblclick) on the host element to enter edit mode from outside.
 */
@Component({
  selector: 'ws-editable-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (editMode()) {
      <input
        #inputEl
        class="el-input"
        type="text"
        [ngModel]="draft()"
        (ngModelChange)="draft.set($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
        (click)="$event.stopPropagation()"
        (dblclick)="$event.stopPropagation()"
      />
    } @else {
      <span class="el-text"><ng-content /></span>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .el-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .el-input {
      width: 100%;
      min-width: 0;
      padding: 1px 4px;
      border: 1.5px solid var(--p-primary-500, #2474bb);
      border-radius: 3px;
      outline: none;
      background: #fff;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      line-height: 1.4;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--p-primary-500, #2474bb) 20%, transparent);
    }
  `,
})
export class EditableLabelComponent implements OnChanges, AfterViewChecked {
  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement>;

  readonly value = input.required<string>();
  readonly editMode = input(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  protected readonly draft = signal('');

  private needsFocus = false;
  private committed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editMode']?.currentValue === true) {
      this.draft.set(this.value());
      this.needsFocus = true;
      this.committed = false;
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsFocus && this.inputEl) {
      this.inputEl.nativeElement.focus();
      this.inputEl.nativeElement.select();
      this.needsFocus = false;
    }
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.committed = true;
      this.cancelled.emit();
    }
  }

  protected onBlur(): void {
    if (!this.committed) {
      this.commit();
    }
  }

  private commit(): void {
    this.committed = true;
    const trimmed = this.draft().trim();
    this.confirmed.emit(trimmed || this.value());
  }
}
