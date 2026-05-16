import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { UsersComponent } from './features/users/users.component';
import { CatalogueComponent } from './features/catalogue/catalogue.component';
import { LoansComponent } from './features/loans/loans.component';
import { ScanResultComponent } from './features/loans/scan-result/scan-result.component';

export const routes: Routes = [
  // Public login route
  { path: 'login', component: LoginComponent },
  
  // Protected Admin Routes wrapped in the AdminLayoutComponent shell
  { 
    path: '', 
    component: AdminLayoutComponent,
    canActivate: [authGuard], // Guard protects all children routes
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'catalogue', component: CatalogueComponent },
      { path: 'loans', component: LoansComponent },
      { path: 'loans/student/:qrCode', component: ScanResultComponent }
    ]
  },
  
  // Catch-all route
  { path: '**', redirectTo: 'dashboard' }
];
