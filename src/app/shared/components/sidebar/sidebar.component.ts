import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  public currentUser: any = null;

  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      this.apiService.get(`/users/${userId}`).subscribe({
        next: (user: any) => {
          this.currentUser = user;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch user profile for sidebar', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }
}
