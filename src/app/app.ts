import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Studio } from './studio/studio';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Studio],
  template: `<ws-studio />`,
})
export class App {}
