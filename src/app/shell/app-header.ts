import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

/**
 * Lightweight global header (logo · Dashboard · apps · avatar).
 *
 * SKELETON: static chrome only. The real portal likely supplies this via the
 * design system's HeaderToolbar; this is a stand-in so the studio sits in
 * context. Links/buttons are inert. // TODO (Phase N): wire nav + real logo.
 */
@Component({
  selector: 'ws-app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarModule],
  template: `
    <header class="ws-header">
      <span class="ws-header__brand">TRANSFLO</span>
      <nav class="ws-header__right">
        <a class="ws-header__link" href="#" (click)="$event.preventDefault()">Dashboard</a>
        <button class="ws-header__icon" type="button" aria-label="Apps">
          <i class="pi pi-th-large"></i>
        </button>
        <p-avatar label="JS" shape="circle" />
      </nav>
    </header>
  `,
  styles: `
    .ws-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 57px;
      padding: 0 20px;
      background: var(--ws-surface, #fff);
      border-bottom: 1px solid var(--ws-border, #c6ccd6);
    }
    .ws-header__brand {
      font-weight: 800;
      font-style: italic;
      font-size: 19px;
      letter-spacing: 0.5px;
      color: var(--p-primary-500, #2474bb);
    }
    .ws-header__right {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .ws-header__link {
      color: var(--p-primary-500, #2474bb);
      font-weight: 600;
      text-decoration: none;
    }
    .ws-header__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--p-text-color, #1e293b);
      cursor: pointer;
    }
    .ws-header__icon:hover { background: var(--p-surface-100, #f1f5f9); }
  `,
})
export class AppHeader {}
