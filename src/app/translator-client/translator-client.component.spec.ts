import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslatorClientComponent } from './translator-client.component';

describe('TranslatorClientComponent', () => {
  let component: TranslatorClientComponent;
  let fixture: ComponentFixture<TranslatorClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TranslatorClientComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslatorClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
