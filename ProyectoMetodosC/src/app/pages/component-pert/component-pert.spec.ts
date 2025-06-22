import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentPert } from './component-pert';

describe('ComponentPert', () => {
  let component: ComponentPert;
  let fixture: ComponentFixture<ComponentPert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentPert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentPert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
