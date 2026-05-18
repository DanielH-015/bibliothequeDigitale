import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.css'
})
export class LoansComponent implements OnInit, OnDestroy {
  public isScanActive: boolean = false;
  private scanSubscription?: Subscription;

  // Tabs management
  public activeTab: 'scanner' | 'list' | 'history' = 'scanner';

  // Loans data
  public activeLoans: any[] = [];
  public isLoadingLoans = false;
  
  // History data
  public historyLoans: any[] = [];
  public filteredHistoryLoans: any[] = [];
  public isLoadingHistory = false;
  public historyFilters = {
    date: '',
    bookTitle: '',
    studentName: ''
  };
  
  public today = new Date();

  constructor(
    private socketService: SocketService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchActiveLoans();
  }

  ngOnDestroy(): void {
    this.cancelScan();
  }

  // --- TAB MANAGEMENT ---
  switchTab(tab: 'scanner' | 'list' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'scanner') {
      this.fetchActiveLoans(); // Refresh in background
    } else if (tab === 'list') {
      this.cancelScan(); // Stop radar if navigating to list
      this.fetchActiveLoans();
    } else if (tab === 'history') {
      this.cancelScan();
      this.fetchHistoryLoans();
    }
  }

  // --- SCANNER LOGIC ---
  public activateScan(): void {
    this.isScanActive = true;
    this.socketService.connect();
    
    this.scanSubscription = this.socketService.listen<any>('scan-received').subscribe(
      (studentData) => {
        this.cancelScan();
        this.router.navigate(['/loans/student', studentData.studentId]);
      }
    );
  }
  
  public cancelScan(): void {
    this.isScanActive = false;
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
    }
    this.socketService.disconnect();
  }

  // --- LOANS LIST LOGIC ---
  fetchActiveLoans(): void {
    this.isLoadingLoans = true;
    this.apiService.get<any[]>('/loans').subscribe({
      next: (data) => {
        // Filter to only show active loans
        this.activeLoans = data.filter(loan => loan.status === 'ACTIVE');
        this.isLoadingLoans = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching loans", err);
        this.isLoadingLoans = false;
        this.cdr.detectChanges();
      }
    });
  }

  markAsReturned(loanId: number): void {
    Swal.fire({
      title: 'Confirm Return',
      text: "Has the student physically returned this book?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, returned!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.put(`/loans/${loanId}/return`, {}).subscribe({
          next: () => {
            this.toastService.showSuccess('Book marked as returned!');
            this.fetchActiveLoans(); // Refresh list
            if (this.activeTab === 'history') this.fetchHistoryLoans();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.showError("Failed to return book.");
            console.error(err);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  isOverdue(dueDateString: string | null): boolean {
    if (!dueDateString) return false;
    
    const dueDate = new Date(dueDateString);
    // Remove time component from today for fair comparison
    const todayStr = this.today.toISOString().split('T')[0];
    const dueStr = dueDate.toISOString().split('T')[0];
    
    return dueStr < todayStr;
  }

  // --- HISTORY LOGIC ---
  fetchHistoryLoans(): void {
    this.isLoadingHistory = true;
    this.apiService.get<any[]>('/loans').subscribe({
      next: (data) => {
        this.historyLoans = data;
        this.applyHistoryFilters();
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching loan history", err);
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyHistoryFilters(): void {
    this.filteredHistoryLoans = this.historyLoans.filter(loan => {
      let matches = true;

      // Filter by Date
      if (this.historyFilters.date) {
        const filterDate = new Date(this.historyFilters.date).toISOString().split('T')[0];
        const loanDate = new Date(loan.loanDate).toISOString().split('T')[0];
        if (loanDate !== filterDate) matches = false;
      }

      // Filter by Book Title
      if (this.historyFilters.bookTitle && loan.book) {
        if (!loan.book.title.toLowerCase().includes(this.historyFilters.bookTitle.toLowerCase())) {
          matches = false;
        }
      }

      // Filter by Student Name
      if (this.historyFilters.studentName && loan.student && loan.student.user) {
        const fullName = `${loan.student.user.firstName} ${loan.student.user.lastName}`.toLowerCase();
        if (!fullName.includes(this.historyFilters.studentName.toLowerCase())) {
          matches = false;
        }
      }

      return matches;
    });
  }
}
