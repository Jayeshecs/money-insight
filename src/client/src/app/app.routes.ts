import { Routes } from '@angular/router';
import { ImportComponent } from './features/dashboard/import.component';

export const routes: Routes = [
  { path: '', redirectTo: '/import', pathMatch: 'full' },
  { path: 'import', component: ImportComponent },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      ),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions-list.component').then(
        m => m.TransactionsListComponent
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        m => m.SettingsComponent
      ),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback/auth-callback.component').then(
        m => m.AuthCallbackComponent
      ),
  },
];


