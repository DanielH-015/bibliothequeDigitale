import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

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
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Display a specific message 403 or 401
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

  fetchCatalogue(): void {
    this.apiService.get<any[]>('/books').subscribe({
      next: (data) => {
        this.books = data.filter(b => b.availableCopies > 0);
        this.cdr.detectChanges();
      },
      error: () => console.error("Failed to load books")
    });
  }

  confirmLoan(): void {
    if (!this.selectedBookId || !this.studentData) return;

    // Calculate the due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const payload = {
      studentId: this.studentData.id, // Local ID (Student table)
      bookId: this.selectedBookId,
      dueDate: dueDate.toISOString()
    };

    this.apiService.post<any>('/loans', payload).subscribe({
      next: () => {
        alert("Success! The book has been loaned.");
        this.router.navigate(['/loans']);
      },
      error: (err) => {
        alert("Error while processing the loan.");
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }
}
