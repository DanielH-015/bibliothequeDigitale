import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent implements OnInit {
  public activeTab: 'list' | 'add' = 'list';
  public students: any[] = [];
  public isLoading = true;

  public newStudentData = {
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    grade: ''
  };

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

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
    if (confirm("Are you sure you want to delete this student profile?")) {
      this.apiService.delete(`/students/${id}`).subscribe({
        next: () => {
          this.fetchStudents(); // Refresh list
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert("Cannot delete student. They might have active loans.");
          console.error(err);
          this.cdr.detectChanges();
        }
      });
    }
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
      grade: ''
    };
  }

  submitStudent(): void {
    if (!this.newStudentData.matricule || !this.newStudentData.firstName || !this.newStudentData.lastName) {
      alert("Please fill in all required fields (Matricule, First Name, Last Name).");
      return;
    }

    this.apiService.post('/students', this.newStudentData).subscribe({
      next: () => {
        alert("Student registered successfully!");
        this.setActiveTab('list');
        this.fetchStudents();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating student:', err);
        alert("An error occurred while creating the student.");
        this.cdr.detectChanges();
      }
    });
  }
}
