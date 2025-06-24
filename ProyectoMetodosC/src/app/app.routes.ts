import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { FlujoMaximoComponent } from './pages/flujo-maximo/flujo-maximo';
import { ComponentPert } from './pages/component-pert/component-pert';
import { VogelComponent } from './pages/vogel/vogel.component';

export const routes: Routes = [
  { 
    path: '',
    component: HomeComponent,
    title: 'Home'
  },
  {
    path: 'programa1',
    component: FlujoMaximoComponent,
    title: 'Flujo Máximo'
  },
  {
    path: 'programa2',
    component: ComponentPert,
    title: 'PERT Probabilístico'
  }
  ,
  {
    path: 'programa3',
    component: VogelComponent,
    title: 'Vogel'
  }
];