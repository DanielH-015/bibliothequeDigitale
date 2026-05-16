import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  public students: any[] = [];
  public isLoading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  fetchStudents(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/students').subscribe({
      next: (data) => {
        this.students = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching students:', err);
        this.isLoading = false;
      }
    });
  }

  deleteStudent(id: number): void {
    if (confirm("Are you sure you want to delete this student profile?")) {
      this.apiService.delete(`/students/${id}`).subscribe({
        next: () => {
          this.fetchStudents(); // Refresh list
        },
        error: (err) => {
          alert("Cannot delete student. They might have active loans.");
          console.error(err);
        }
      });
    }
  }
}
