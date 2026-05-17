import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Store authentication state globally to update UI instantly
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  // Check if token exists in local storage
  private hasToken(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  // Get current user role
  public getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }

  // Handle user login and store the token
  public login(credentials: any): Observable<any> {
    return this.apiService.post<any>('/auth/login', credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('jwt_token', response.token);
          
          // Store the user ID and Role if the backend sends it
          if (response.user) {
            if (response.user.id) localStorage.setItem('user_id', response.user.id.toString());
            if (response.user.role) localStorage.setItem('user_role', response.user.role);
          }
          
          // Notify the application that the user is now authenticated
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  // Clear session and redirect to login page
  public logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    
    // Notify the application that the user is disconnected
    this.isAuthenticatedSubject.next(false);
    
    // Redirect to login route
    this.router.navigate(['/login']);
  }
}
