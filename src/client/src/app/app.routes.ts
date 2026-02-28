import { Routes } from '@angular/router';
import { ImportComponent } from './features/dashboard/import.component';

export const routes: Routes = [
  { path: '', redirectTo: '/import', pathMatch: 'full' },
  { path: 'import', component: ImportComponent },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/auth-callback/auth-callback.component').then(
        m => m.AuthCallbackComponent
      ),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/dashboard/transactions.component').then(
        m => m.TransactionsComponent
      ),
  },
];
