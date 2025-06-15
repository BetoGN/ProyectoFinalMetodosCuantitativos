import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlujoMaximo } from './flujo-maximo';

describe('FlujoMaximo', () => {
  let component: FlujoMaximo;
  let fixture: ComponentFixture<FlujoMaximo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlujoMaximo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlujoMaximo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
