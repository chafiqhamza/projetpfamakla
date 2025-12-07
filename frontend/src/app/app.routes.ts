import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'meals',
    loadComponent: () => import('./pages/meals/meals.component').then(m => m.MealsComponent)
  },
  {
    path: 'water',
    loadComponent: () => import('./pages/water/water.component').then(m => m.WaterComponent)
  },
  {
    path: 'foods',
    loadComponent: () => import('./pages/foods/foods.component').then(m => m.FoodsComponent)
  },
  {
    path: 'analysis',
    loadComponent: () => import('./pages/analysis/analysis.component').then(m => m.AnalysisComponent)
  },
  {
    path: 'diagnostic',
    loadComponent: () => import('./pages/diagnostic/diagnostic.component').then(m => m.DiagnosticComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

