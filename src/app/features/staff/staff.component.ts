import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent implements OnInit {
  public activeTab: 'list' | 'add' = 'list';
  public staffMembers: any[] = [];
  public isLoading = true;

  public isStaffModalOpen = false;
  public newStaffData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'LIBRARIAN'
  };

  constructor(
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchStaff();
  }

  fetchStaff(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/users').subscribe({
      next: (data) => {
        // filter out students if the backend returns all users
        this.staffMembers = data.filter(u => u.role === 'ADMIN' || u.role === 'LIBRARIAN');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching staff members:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStaffStatus(staff: any): void {
    const action = staff.isValid ? 'deactivate' : 'activate';
    
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${action} this staff member?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: `Yes, ${action}!`
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.put(`/users/${staff.id}`, { isValid: !staff.isValid }).subscribe({
          next: () => {
            this.toastService.showSuccess(`Staff member ${action}d successfully!`);
            this.fetchStaff();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.toastService.showError('Could not change staff status.');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  setActiveTab(tab: 'list' | 'add'): void {
    this.activeTab = tab;
    if (tab === 'add') {
      this.resetStaffForm();
    }
  }

  closeStaffModal(): void {
    this.isStaffModalOpen = false;
    this.resetStaffForm();
  }

  resetStaffForm(): void {
    this.newStaffData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'LIBRARIAN'
    };
  }

  submitStaff(): void {
    if (!this.newStaffData.email || !this.newStaffData.password || !this.newStaffData.firstName || !this.newStaffData.lastName) {
      this.toastService.showError("Please fill in all required fields.");
      return;
    }

    this.apiService.post('/users', this.newStaffData).subscribe({
      next: () => {
        this.toastService.showSuccess("Staff member created successfully!");
        this.setActiveTab('list');
        this.fetchStaff();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating staff member:', err);
        this.toastService.showError("An error occurred while creating the staff member.");
        this.cdr.detectChanges();
      }
    });
  }
}
