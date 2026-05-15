import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  public staffList: any[] = [];
  public studentList: any[] = [];
  public showAddForm: boolean = false;
  public userForm: FormGroup;
  public activeTab: 'staff' | 'students' = 'staff';

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    // Initialize form for adding a new admin/librarian
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['LIBRARIAN', Validators.required]
    });
  }

  ngOnInit(): void {
    // Placeholder: we will fetch real data from the API later
  }

  // Toggle the form visibility
  public toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.userForm.reset({ role: 'LIBRARIAN' });
    }
  }

  // Switch between Staff and Students tabs
  public setTab(tab: 'staff' | 'students'): void {
    this.activeTab = tab;
  }

  // Handle form submission
  public onSubmit(): void {
    if (this.userForm.invalid) return;

    // Placeholder: send data to backend later
    console.log('Adding new user:', this.userForm.value);
    
    this.toggleAddForm();
    alert('User added successfully (UI Simulation)');
  }
}
