import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestartpassComponent } from './restartpass.component';

describe('RestartpassComponent', () => {
  let component: RestartpassComponent;
  let fixture: ComponentFixture<RestartpassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestartpassComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestartpassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
