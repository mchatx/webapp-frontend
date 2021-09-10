import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveDetailComponent } from './archive-detail.component';

describe('ArchiveDetailComponent', () => {
  let component: ArchiveDetailComponent;
  let fixture: ComponentFixture<ArchiveDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchiveDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
