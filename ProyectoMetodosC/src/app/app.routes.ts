import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { FlujoMaximoComponent } from './pages/flujo-maximo/flujo-maximo';


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
  }
];