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

  // File upload state
  public selectedCoverImage: File | null = null;
  public editSelectedCoverImage: File | null = null;
  public imagePreview: string | null = null;
  public editImagePreview: string | null = null;

  // Edit State
  public selectedBookToEdit: any = null;
  public isEditing = false;
  
  private backendUrl = 'http://localhost:5000/';

  public getCoverImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return this.backendUrl + imagePath.substring(1);
    return this.backendUrl + imagePath;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCoverImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onEditFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editSelectedCoverImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  resetForm(): void {
    this.newBook = { title: '', author: '', isbn: '', availableCopies: 1, category: '', location: '' };
    this.selectedCoverImage = null;
    this.imagePreview = null;
  }

  saveBook(): void {
    if (!this.newBook.title || !this.newBook.author || !this.newBook.isbn || !this.newBook.category) {
      this.toastService.showError("Title, Author, ISBN, and Category are required fields.");
      return;
    }

    const formData = new FormData();
    formData.append('title', this.newBook.title);
    formData.append('author', this.newBook.author);
    formData.append('isbn', this.newBook.isbn);
    formData.append('availableCopies', this.newBook.availableCopies.toString());
    formData.append('category', this.newBook.category);
    formData.append('location', this.newBook.location);
    if (this.selectedCoverImage) {
      formData.append('coverImage', this.selectedCoverImage);
    }

    this.apiService.post('/books', formData).subscribe({
      next: () => {
        this.toastService.showSuccess("Book added successfully!");
        this.resetForm();
        this.setActiveTab('list');
        this.fetchBooks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMessage = err.error?.message || "Failed to add book. Make sure ISBN is unique.";
        this.toastService.showError(errorMessage);
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(book: any): void {
    this.selectedBookToEdit = book;
    this.newBook = {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      availableCopies: book.availableCopies,
      category: book.category || '',
      location: book.location || ''
    };
    if (book.coverImage) {
      this.editImagePreview = this.getCoverImageUrl(book.coverImage);
    } else {
      this.editImagePreview = null;
    }
    this.editSelectedCoverImage = null;
  }

  closeEditModal(): void {
    this.selectedBookToEdit = null;
    this.editSelectedCoverImage = null;
    this.editImagePreview = null;
    this.resetForm();
  }

  saveBookEdit(): void {
    if (!this.newBook.title || !this.newBook.author || !this.newBook.isbn || !this.newBook.category) {
      this.toastService.showError("Title, Author, ISBN, and Category are required fields.");
      return;
    }

    this.isEditing = true;
    const formData = new FormData();
    formData.append('title', this.newBook.title);
    formData.append('author', this.newBook.author);
    formData.append('isbn', this.newBook.isbn);
    formData.append('availableCopies', this.newBook.availableCopies.toString());
    formData.append('category', this.newBook.category);
    formData.append('location', this.newBook.location);
    if (this.editSelectedCoverImage) {
      formData.append('coverImage', this.editSelectedCoverImage);
    }

    this.apiService.put(`/books/${this.selectedBookToEdit.id}`, formData).subscribe({
      next: () => {
        this.toastService.showSuccess("Book updated successfully!");
        this.fetchBooks();
        this.closeEditModal();
        this.isEditing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMessage = err.error?.message || "Failed to update book.";
        this.toastService.showError(errorMessage);
        console.error(err);
        this.isEditing = false;
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
