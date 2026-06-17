import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ActionTypeCatalogEntry } from '@app/models';
import { ActionCatalogApi } from './api-contract';
import { SEED_ACTION_CATALOG } from './fake-data';

/** In-memory {@link ActionCatalogApi}. */
@Injectable()
export class MockActionCatalogApi extends ActionCatalogApi {
  override getCatalog(): Observable<readonly ActionTypeCatalogEntry[]> {
    return of(structuredClone(SEED_ACTION_CATALOG)).pipe(delay(150));
  }
}
