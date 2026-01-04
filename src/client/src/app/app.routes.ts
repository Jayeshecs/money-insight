import { Routes } from '@angular/router';
import { ImportComponent } from './features/dashboard/import.component';

export const routes: Routes = [
  { path: '', redirectTo: '/import', pathMatch: 'full' },
  { path: 'import', component: ImportComponent },
  { path: 'transactions', loadComponent: () => import('./features/dashboard/transactions.component').then(m => m.TransactionsComponent) }
];
