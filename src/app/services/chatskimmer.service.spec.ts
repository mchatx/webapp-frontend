import { TestBed } from '@angular/core/testing';

import { ChatskimmerService } from './chatskimmer.service';

describe('ChatskimmerService', () => {
  let service: ChatskimmerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatskimmerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
