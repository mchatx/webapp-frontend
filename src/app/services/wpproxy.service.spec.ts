import { TestBed } from '@angular/core/testing';

import { WPproxyService } from './wpproxy.service';

describe('WPproxyService', () => {
  let service: WPproxyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WPproxyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
