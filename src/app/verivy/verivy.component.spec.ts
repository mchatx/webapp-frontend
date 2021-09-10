import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerivyComponent } from './verivy.component';

describe('VerivyComponent', () => {
  let component: VerivyComponent;
  let fixture: ComponentFixture<VerivyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerivyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerivyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
