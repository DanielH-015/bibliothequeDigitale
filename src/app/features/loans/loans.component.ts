import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
import { ApiService } from '../../core/services/api.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.css'
})
export class LoansComponent implements OnInit, OnDestroy {
  public isScanActive: boolean = false;
  private scanSubscription?: Subscription;

  // Tabs management
  public activeTab: 'scanner' | 'list' = 'scanner';

  // Loans data
  public activeLoans: any[] = [];
  public isLoadingLoans = false;
  
  public today = new Date();

  constructor(
    private socketService: SocketService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchActiveLoans();
  }

  ngOnDestroy(): void {
    this.cancelScan();
  }

  // --- TAB MANAGEMENT ---
  switchTab(tab: 'scanner' | 'list'): void {
    this.activeTab = tab;
    if (tab === 'scanner') {
      this.fetchActiveLoans(); // Refresh in background
    } else {
      this.cancelScan(); // Stop radar if navigating to list
      this.fetchActiveLoans();
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
    if (confirm("Confirm that the student has returned this book?")) {
      this.apiService.put(`/loans/${loanId}/return`, {}).subscribe({
        next: () => {
          this.fetchActiveLoans(); // Refresh list
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert("Failed to return book.");
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  isOverdue(dueDateString: string | null): boolean {
    if (!dueDateString) return false;
    
    const dueDate = new Date(dueDateString);
    // Remove time component from today for fair comparison
    const todayStr = this.today.toISOString().split('T')[0];
    const dueStr = dueDate.toISOString().split('T')[0];
    
    return dueStr < todayStr;
  }
}
