import { TestBed } from '@angular/core/testing';

import { SyncFromLocalDBService } from './sync-from-local-db.service';

describe('SyncFromLocalDBService', () => {
  let service: SyncFromLocalDBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncFromLocalDBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
