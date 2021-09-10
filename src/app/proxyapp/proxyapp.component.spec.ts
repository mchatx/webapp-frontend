import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProxyappComponent } from './proxyapp.component';

describe('ProxyappComponent', () => {
  let component: ProxyappComponent;
  let fixture: ComponentFixture<ProxyappComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProxyappComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProxyappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
