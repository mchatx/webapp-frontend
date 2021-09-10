import { TestBed } from '@angular/core/testing';

import { TsugeGushiService } from './tsuge-gushi.service';

describe('TsugeGushiService', () => {
  let service: TsugeGushiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TsugeGushiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
