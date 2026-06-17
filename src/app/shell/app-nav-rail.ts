import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

/**
 * Lightweight 66px global app-nav rail (dashboard / workflows / … / avatar).
 *
 * SKELETON: static. The Workflows item is shown active. Inert.
 * // TODO (Phase N): real routes + icons from the design system SideNav.
 */
@Component({
  selector: 'ws-app-nav-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarModule],
  template: `
    <nav class="ws-rail">
      <button class="ws-rail__item" type="button" aria-label="Dashboard">
        <i class="pi pi-chart-bar"></i>
      </button>
      <button class="ws-rail__item is-active" type="button" aria-label="Workflows" aria-current="page">
        <i class="pi pi-sitemap"></i>
      </button>
      <span class="ws-rail__spacer"></span>
      <button class="ws-rail__item" type="button" aria-label="Sign out">
        <i class="pi pi-sign-out"></i>
      </button>
      <p-avatar label="JS" shape="circle" />
    </nav>
  `,
  styles: `
    .ws-rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      width: 59px;
      padding: 14px 0;
      background: var(--ws-surface, #fff);
      border-right: 1px solid var(--ws-border, #c6ccd6);
    }
    .ws-rail__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 7px;
      background: transparent;
      color: var(--p-text-muted-color, #64748b);
      font-size: 17px;
      cursor: pointer;
    }
    .ws-rail__item:hover { background: var(--p-surface-100, #f1f5f9); }
    .ws-rail__item.is-active {
      background: var(--p-primary-50, #e9f1f8);
      color: var(--p-primary-500, #2474bb);
    }
    .ws-rail__spacer { flex: 1 1 auto; }
  `,
})
export class AppNavRail {}
