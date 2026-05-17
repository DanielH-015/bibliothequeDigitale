import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  public activeLoansCount = 0;
  public totalStudents = 0;
  public isLoading = true;
  public errorMessage = '';

  public recentLoans: any[] = [];
  public topBooks: any[] = [];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchStatistics();
  }

  fetchStatistics(): void {
    forkJoin({
      books: this.apiService.get<any[]>('/books'),
      students: this.apiService.get<any[]>('/students'),
      loans: this.apiService.get<any[]>('/loans')
    }).subscribe({
      next: (results) => {
        this.totalBooks = results.books.length;
        this.totalStudents = results.students.length;
        
        const allLoans = results.loans;
        const activeLoans = allLoans.filter(loan => loan.status === 'ACTIVE');
        this.activeLoansCount = activeLoans.length;

        // Recent Active Loans (Top 5)
        // Sort by loanDate descending
        this.recentLoans = activeLoans
          .sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime())
          .slice(0, 5);

        // Calculate Most Borrowed Books
        const bookFrequencies: { [bookId: number]: { count: number, book: any } } = {};
        allLoans.forEach(loan => {
          if (loan.book) {
            if (!bookFrequencies[loan.book.id]) {
              bookFrequencies[loan.book.id] = { count: 0, book: loan.book };
            }
            bookFrequencies[loan.book.id].count++;
          }
        });

        this.topBooks = Object.values(bookFrequencies)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading statistics", err);
        this.errorMessage = "Failed to load statistics.";
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
