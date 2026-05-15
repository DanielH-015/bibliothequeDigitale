import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css'
})
export class CatalogueComponent implements OnInit {
  public books: any[] = [];
  public showAddForm: boolean = false;
  public bookForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      isbn: ['', Validators.required],
      stock: [1, [Validators.required, Validators.min(1)]],
      category: ['Fiction', Validators.required]
    });
  }

  ngOnInit(): void {
    // Placeholder logic for fetching books from API
  }

  public toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.bookForm.reset({ category: 'Fiction', stock: 1 });
    }
  }

  public onSubmit(): void {
    if (this.bookForm.invalid) return;

    console.log('Adding book:', this.bookForm.value);
    this.toggleAddForm();
    alert('Book added to catalogue! (UI Simulation)');
  }
}
