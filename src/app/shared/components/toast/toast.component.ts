import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" class="toast-message" [ngClass]="toast.type">
        <i class="fas" [ngClass]="{
          'fa-check-circle': toast.type === 'success',
          'fa-exclamation-circle': toast.type === 'error',
          'fa-info-circle': toast.type === 'info'
        }"></i>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .toast-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out forwards, fadeOut 0.3s ease-out 2.7s forwards;
      max-width: 400px;
    }

    .toast-message.success { background-color: #10B981; }
    .toast-message.error { background-color: #EF4444; }
    .toast-message.info { background-color: #3B82F6; }

    .toast-message i { font-size: 18px; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toastState$.subscribe(toast => {
      this.toasts.push(toast);
      // Remove after 3 seconds
      setTimeout(() => {
        this.toasts.shift();
      }, 3000);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
