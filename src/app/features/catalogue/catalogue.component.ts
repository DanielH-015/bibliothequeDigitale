import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

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
  
  // Modal state
  public isModalOpen = false;
  
  // Form state
  public newBook = {
    title: '',
    author: '',
    isbn: '',
    availableCopies: 1,
    category: '',
    location: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.isLoading = true;
    this.apiService.get<any[]>('/books').subscribe({
      next: (data) => {
        this.books = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching books:', err);
        this.isLoading = false;
      }
    });
  }

  openAddModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    // Reset form
    this.newBook = { title: '', author: '', isbn: '', availableCopies: 1, category: '', location: '' };
  }

  saveBook(): void {
    if (!this.newBook.title || !this.newBook.author) {
      alert("Title and Author are required.");
      return;
    }

    this.apiService.post('/books', this.newBook).subscribe({
      next: () => {
        this.closeModal();
        this.fetchBooks(); // Refresh list
      },
      error: (err) => {
        alert("Failed to add book. Make sure ISBN is unique.");
        console.error(err);
      }
    });
  }

  deleteBook(id: number): void {
    if (confirm("Are you sure you want to delete this book?")) {
      this.apiService.delete(`/books/${id}`).subscribe({
        next: () => {
          this.fetchBooks(); // Refresh list
        },
        error: (err) => {
          alert("Cannot delete book. It might have active loans.");
          console.error(err);
        }
      });
    }
  }
}
