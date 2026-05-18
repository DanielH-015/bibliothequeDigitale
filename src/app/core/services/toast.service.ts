import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  showSuccess(message: string): void {
    this.Toast.fire({
      icon: 'success',
      title: message
    });
  }

  showError(message: string): void {
    this.Toast.fire({
      icon: 'error',
      title: message
    });
  }

  showInfo(message: string): void {
    this.Toast.fire({
      icon: 'info',
      title: message
    });
  }
}
