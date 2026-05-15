import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // Placeholder stats for the dashboard UI
  public totalBooks = 150;
  public activeLoans = 45;
  public totalStudents = 120;
}
