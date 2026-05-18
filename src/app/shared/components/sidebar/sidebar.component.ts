import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  
  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // No longer fetching user data here. It's fully static.
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }
}
