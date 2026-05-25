import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';
import { PrintCardComponent } from './print-card/print-card.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, PrintCardComponent],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  public activeTab: 'list' | 'add' = 'list';
  public students: any[] = [];
  public isLoading = true;
  public selectedStudentToPrint: any = null;
  public selectedStudentHistory: any = null;
  public studentLoans: any[] = [];
  public isHistoryLoading = false;

  public newStudentData = {
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    grade: '',
    password: 'password123'
  };

  constructor(
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  fetchStudents(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/students').subscribe({
      next: (data) => {
        this.students = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching students:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteStudent(id: number): void {
    Swal.fire({
      title: 'Delete Student?',
      text: "This action cannot be undone. Are you sure?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.delete(`/students/${id}`).subscribe({
          next: () => {
            this.toastService.showSuccess('Student deleted successfully!');
            this.fetchStudents(); // Refresh list
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.showError(err.error?.message || "Cannot delete student. They might have active loans.");
            console.error(err);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  setActiveTab(tab: 'list' | 'add'): void {
    this.activeTab = tab;
    if (tab === 'add') {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newStudentData = {
      matricule: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      grade: '',
      password: 'password123'
    };
  }

  submitStudent(): void {
    if (!this.newStudentData.matricule || !this.newStudentData.firstName || !this.newStudentData.lastName) {
      this.toastService.showError("Please fill in all required fields.");
      return;
    }

    this.apiService.post('/students', this.newStudentData).subscribe({
      next: () => {
        this.toastService.showSuccess("Student registered successfully!");
        this.setActiveTab('list');
        this.fetchStudents();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating student:', err);
        this.toastService.showError("An error occurred while creating the student.");
        this.cdr.detectChanges();
      }
    });
  }

  printCard(studentId: number): void {
    const student = this.students.find(s => s.id === studentId);
    if (student && student.isValid) {
      this.selectedStudentToPrint = student;
    } else {
      this.toastService.showError("Cannot print card: Student profile is not validated.");
    }
  }

  closePrintModal(): void {
    this.selectedStudentToPrint = null;
  }

  executePrint(): void {
    // A small timeout allows UI to settle before printing
    setTimeout(() => {
      window.print();
    }, 100);
  }

  // --- EDIT MODAL LOGIC ---
  public selectedStudentToEdit: any = null;
  public editStudentData = {
    id: 0,
    firstName: '',
    lastName: '',
    classroom: '',
    parentEmail: ''
  };
  public editSelectedFile: File | null = null;
  public editImagePreview: string | null = null;
  public isEditing = false;
  private backendUrl = 'http://localhost:5000/';

  public getProfileImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return this.backendUrl + imagePath.substring(1);
    return this.backendUrl + imagePath;
  }

  openEditModal(student: any): void {
    this.selectedStudentToEdit = student;
    this.editStudentData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      classroom: student.studentProfile?.classroom || '',
      parentEmail: student.studentProfile?.parentEmail || ''
    };
    
    if (student.profileImage) {
      this.editImagePreview = this.getProfileImageUrl(student.profileImage);
    } else {
      this.editImagePreview = null;
    }
    this.editSelectedFile = null;
  }

  closeEditModal(): void {
    this.selectedStudentToEdit = null;
    this.editSelectedFile = null;
    this.editImagePreview = null;
  }

  onEditFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editSelectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveStudentEdit(): void {
    this.isEditing = true;

    const formData = new FormData();
    formData.append('firstName', this.editStudentData.firstName);
    formData.append('lastName', this.editStudentData.lastName);
    formData.append('classroom', this.editStudentData.classroom);
    formData.append('parentEmail', this.editStudentData.parentEmail);

    if (this.editSelectedFile) {
      formData.append('profileImage', this.editSelectedFile);
    }

    this.apiService.put(`/students/${this.editStudentData.id}`, formData).subscribe({
      next: () => {
        this.toastService.showSuccess("Informations de l'élève mises à jour avec succès.");
        this.fetchStudents(); // Refresh table
        this.closeEditModal();
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Error updating student:', err);
        this.toastService.showError(err.error?.message || "Failed to update student.");
        this.isEditing = false;
      }
    });
  }

  // --- HISTORY LOGIC ---
  viewStudentHistory(studentId: number): void {
    const student = this.students.find(s => s.id === studentId);
    if (!student || !student.studentProfile) {
      this.toastService.showError('Profil étudiant introuvable.');
      return;
    }
    
    this.selectedStudentHistory = student;
    this.isHistoryLoading = true;
    
    this.apiService.get<any[]>(`/loans/student/${student.studentProfile.id}`).subscribe({
      next: (loans) => {
        this.studentLoans = loans;
        this.isHistoryLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch history', err);
        this.toastService.showError('Failed to load student history.');
        this.isHistoryLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeHistoryModal(): void {
    this.selectedStudentHistory = null;
    this.studentLoans = [];
  }
}
