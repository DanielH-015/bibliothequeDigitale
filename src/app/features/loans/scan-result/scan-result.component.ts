import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-scan-result',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-result.component.html',
  styleUrl: './scan-result.component.css'
})
export class ScanResultComponent implements OnInit {
  public studentData: any = null;
  public books: any[] = [];
  public selectedBookId: number | null = null;
  public isLoading: boolean = true;
  public errorMessage: string = '';

  // Dashboard states
  public activeTab: 'new-loan' | 'reservations' | 'history' = 'new-loan';
  public reservations: any[] = [];
  public loans: any[] = [];
  public activeLoansCount: number = 0;
  public MAX_LOANS = 3;
  public today = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  private backendUrl = 'http://localhost:5000/';

  public getProfileImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return this.backendUrl + imagePath.substring(1);
    return this.backendUrl + imagePath;
  }

  ngOnInit(): void {
    const qrCode = this.route.snapshot.paramMap.get('qrCode');
    if (qrCode) {
      this.fetchStudentProfile(qrCode);
      this.fetchCatalogue();
    } else {
      this.errorMessage = "Invalid or Missing QR Code.";
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  fetchStudentProfile(qrCode: string): void {
    this.apiService.get<any>(`/students/scan/${qrCode}`).subscribe({
      next: (data) => {
        this.studentData = data;
        
        // Fetch their specific data
        this.fetchStudentLoans(this.studentData.id);
        this.fetchStudentReservations(this.studentData.id);
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = "Session expirée. Veuillez vous reconnecter.";
        } else {
          this.errorMessage = "Élève non trouvé ou QR Code non reconnu.";
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchStudentLoans(studentId: number): void {
    this.apiService.get<any[]>(`/loans/student/${studentId}`).subscribe({
      next: (data) => {
        this.loans = data;
        this.activeLoansCount = this.loans.filter(l => l.status === 'ACTIVE').length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to load loans", err);
        this.isLoading = false;
      }
    });
  }

  fetchStudentReservations(studentId: number): void {
    this.apiService.get<any[]>(`/reservations/student/${studentId}`).subscribe({
      next: (data) => {
        this.reservations = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to load reservations", err);
      }
    });
  }

  fetchCatalogue(): void {
    this.apiService.get<any[]>('/books').subscribe({
      next: (data) => {
        this.books = data.filter(b => b.availableCopies > 0);
        this.cdr.detectChanges();
      },
      error: () => console.error("Failed to load books")
    });
  }

  switchTab(tab: 'new-loan' | 'reservations' | 'history'): void {
    this.activeTab = tab;
  }

  // --- ACTIONS ---

  confirmLoan(): void {
    if (!this.selectedBookId || !this.studentData) return;
    
    if (this.activeLoansCount >= this.MAX_LOANS) {
      this.toastService.showError(`Limite atteinte. L'élève a déjà ${this.MAX_LOANS} emprunts actifs.`);
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const payload = {
      studentId: this.studentData.id,
      bookId: this.selectedBookId,
      dueDate: dueDate.toISOString()
    };

    this.apiService.post<any>('/loans', payload).subscribe({
      next: () => {
        this.toastService.showSuccess("Livre emprunté avec succès !");
        this.selectedBookId = null;
        this.fetchStudentLoans(this.studentData.id); // Refresh data
        this.fetchCatalogue(); // Refresh book count
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.showError("Erreur lors de l'emprunt.");
      }
    });
  }

  validateReservation(reservationId: number): void {
    if (this.activeLoansCount >= this.MAX_LOANS) {
      this.toastService.showError(`Impossible de valider. L'élève a déjà ${this.MAX_LOANS} emprunts actifs.`);
      return;
    }

    this.apiService.put(`/reservations/${reservationId}/validate`, {}).subscribe({
      next: () => {
        this.toastService.showSuccess("Réservation validée ! Un nouvel emprunt a été créé.");
        this.fetchStudentReservations(this.studentData.id);
        this.fetchStudentLoans(this.studentData.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.showError(err.error?.message || "Failed to validate reservation.");
      }
    });
  }

  cancelReservation(reservationId: number): void {
    Swal.fire({
      title: 'Annuler la réservation ?',
      text: "Cela supprimera la réservation et rendra le livre disponible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Oui, annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.delete(`/reservations/${reservationId}`).subscribe({
          next: () => {
            this.toastService.showSuccess("Réservation annulée.");
            this.fetchStudentReservations(this.studentData.id);
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.showError("Failed to cancel reservation.");
          }
        });
      }
    });
  }

  sendReminder(loan: any): void {
    Swal.fire({
      title: 'Envoyer un rappel ?',
      html: `Envoyer un email de rappel à <b>${this.studentData.user?.email || 'l\'élève'}</b> pour le livre "<b>${loan.book.title}</b>" ?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#64748B',
      confirmButtonText: '<i class="fas fa-paper-plane"></i> Envoyer'
    }).then((result) => {
      if (result.isConfirmed) {
        // Mock email sending
        setTimeout(() => {
          this.toastService.showSuccess("L'email de rappel a été envoyé à l'élève.");
        }, 800);
      }
    });
  }

  isOverdue(dueDateString: string | null): boolean {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const todayStr = this.today.toISOString().split('T')[0];
    const dueStr = dueDate.toISOString().split('T')[0];
    return dueStr < todayStr;
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }
}
