import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveEditComponent } from './archive-edit.component';

describe('ArchiveEditComponent', () => {
  let component: ArchiveEditComponent;
  let fixture: ComponentFixture<ArchiveEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchiveEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
