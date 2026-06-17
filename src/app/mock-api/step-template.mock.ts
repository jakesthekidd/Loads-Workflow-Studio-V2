import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { StepBlueprint, StepTemplate } from '@app/models';
import { StepTemplateApi } from './api-contract';
import { SEED_STEP_TEMPLATES } from './fake-data';

/** In-memory {@link StepTemplateApi}. */
@Injectable()
export class MockStepTemplateApi extends StepTemplateApi {
  private readonly userTemplates: StepTemplate[] = [];

  override listStepTemplates(): Observable<readonly StepTemplate[]> {
    return of(structuredClone([...SEED_STEP_TEMPLATES, ...this.userTemplates])).pipe(delay(150));
  }

  override saveStepTemplate(blueprint: StepBlueprint, name: string): Observable<StepTemplate> {
    const tpl: StepTemplate = {
      id: `tpl-user-${this.userTemplates.length + 1}`,
      name,
      category: 'Created By you',
      origin: 'user',
      blueprint: structuredClone(blueprint),
    };
    this.userTemplates.push(tpl);
    return of(structuredClone(tpl)).pipe(delay(150));
  }
}
