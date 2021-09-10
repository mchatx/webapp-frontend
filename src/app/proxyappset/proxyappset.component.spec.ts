import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProxyappsetComponent } from './proxyappset.component';

describe('ProxyappsetComponent', () => {
  let component: ProxyappsetComponent;
  let fixture: ComponentFixture<ProxyappsetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProxyappsetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProxyappsetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
