import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-card.component.html',
  styleUrl: './print-card.component.css'
})
export class PrintCardComponent implements OnChanges {
  @Input() student: any = null;
  public qrCodeUrl: string = '';
  private backendUrl = 'http://localhost:5000/';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student) {
      if (this.student.studentProfile && this.student.studentProfile.qrCodeId) {
        // Generate QR code URL via free external API based on qrCodeId
        this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.student.studentProfile.qrCodeId}`;
      }
    }
  }

  public getProfileImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return this.backendUrl + imagePath.substring(1);
    return this.backendUrl + imagePath;
  }

  public getAcademicYear(): string {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0 is January, 11 is December
    
    // If we are before September (month 8), it's the previous academic year ending this year
    if (currentMonth < 8) {
      return `${currentYear - 1} - ${currentYear}`;
    } else {
      // If we are in or after September, it's the new academic year starting this year
      return `${currentYear} - ${currentYear + 1}`;
    }
  }
}
