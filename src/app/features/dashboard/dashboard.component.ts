import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
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
  public isNotifying = false;

  public recentLoans: any[] = [];
  public topBooks: any[] = [];
  public overdueLoans: any[] = [];

  constructor(
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

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

        // Find Overdue Loans
        const now = new Date().getTime();
        this.overdueLoans = activeLoans.filter(loan => {
          const due = new Date(loan.dueDate).getTime();
          return due < now;
        });

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

  notifyStudent(loanId: number): void {
    if (this.isNotifying) return;
    this.isNotifying = true;
    this.cdr.detectChanges();

    this.apiService.post(`/loans/${loanId}/notify`, {}).subscribe({
      next: () => {
        this.toastService.showSuccess('Notification email sent successfully!');
        this.isNotifying = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to notify student:', err);
        this.toastService.showError('Failed to send notification email.');
        this.isNotifying = false;
        this.cdr.detectChanges();
      }
    });
  }
}
