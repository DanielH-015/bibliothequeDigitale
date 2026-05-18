import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css'
})
export class CatalogueComponent implements OnInit {
  public books: any[] = [];
  public isLoading = true;
  
  // Active tab state: 'list' or 'add'
  public activeTab: 'list' | 'add' = 'list';
  
  // Form state
  public newBook = {
    title: '',
    author: '',
    isbn: '',
    availableCopies: 1,
    category: '',
    location: ''
  };

  constructor(
    private apiService: ApiService, 
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/books').subscribe({
      next: (data) => {
        this.books = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching books:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
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
    this.newBook = { title: '', author: '', isbn: '', availableCopies: 1, category: '', location: '' };
  }

  saveBook(): void {
    if (!this.newBook.title || !this.newBook.author) {
      this.toastService.showError("Title and Author are required.");
      return;
    }

    this.apiService.post('/books', this.newBook).subscribe({
      next: () => {
        this.toastService.showSuccess("Book added successfully!");
        this.resetForm();
        this.setActiveTab('list');
        this.fetchBooks(); // Refresh list
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.showError("Failed to add book. Make sure ISBN is unique.");
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteBook(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete this book?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.delete(`/books/${id}`).subscribe({
          next: () => {
            this.toastService.showSuccess('Book deleted successfully!');
            this.fetchBooks(); // Refresh list
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.toastService.showError("Cannot delete book. It might have active loans.");
            console.error(err);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
