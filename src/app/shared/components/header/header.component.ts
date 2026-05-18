import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  public currentUser: any = null;
  public isProfileModalOpen = false;
  private backendUrl = 'http://localhost:5000/';
  
  public profileData = {
    firstName: '',
    lastName: '',
    email: '',
    profileImage: ''
  };

  public selectedFile: File | null = null;
  public imagePreview: string | null = null;
  public isUploading = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchUserProfile();
  }

  fetchUserProfile(): void {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      this.apiService.get(`/users/${userId}`).subscribe({
        next: (user: any) => {
          this.currentUser = user;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch user profile', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  openProfileModal(): void {
    if (this.currentUser) {
      this.profileData = {
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        profileImage: this.currentUser.profileImage || ''
      };
      this.imagePreview = this.currentUser.profileImage || null;
      this.isProfileModalOpen = true;
    }
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    this.isUploading = true;

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('firstName', this.profileData.firstName);
    formData.append('lastName', this.profileData.lastName);
    formData.append('email', this.profileData.email);
    formData.append('role', this.currentUser.role);
    formData.append('isValid', String(this.currentUser.isValid));

    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    this.apiService.put(`/users/${userId}`, formData).subscribe({
      next: (updatedUser: any) => {
        this.toastService.showSuccess("Profile updated successfully!");
        this.currentUser = updatedUser;
        this.closeProfileModal();
        this.isUploading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastService.showError("Failed to update profile.");
        this.isUploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  public onLogout(): void {
    Swal.fire({
      title: 'Ready to leave?',
      text: "You will be logged out of your session.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  public getProfileImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return this.backendUrl + imagePath.substring(1);
    return this.backendUrl + imagePath;
  }
}
