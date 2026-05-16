import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public totalBooks = 0;
  public activeLoans = 0;
  public totalStudents = 0;
  public isLoading = true;
  public errorMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchStatistics();
  }

  fetchStatistics(): void {
    // Execute 3 request at the same time
    forkJoin({
      books: this.apiService.get<any[]>('/books'),
      students: this.apiService.get<any[]>('/students'),
      loans: this.apiService.get<any[]>('/loans')
    }).subscribe({
      next: (results) => {
        this.totalBooks = results.books.length;
        this.totalStudents = results.students.length;
        // vet actives loans 
        this.activeLoans = results.loans.filter(loan => loan.status === 'ACTIVE').length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des statistiques", err);
        this.errorMessage = "Impossible de charger les statistiques.";
        this.isLoading = false;
      }
    });
  }
}
