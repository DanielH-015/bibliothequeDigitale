import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.css'
})
export class LoansComponent implements OnInit, OnDestroy {
  public loans: any[] = [];
  public isScanActive: boolean = false;
  private scanSubscription?: Subscription;

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {}

  // Automatically disconnect if the user navigates to another page
  ngOnDestroy(): void {
    this.cancelScan();
  }

  public activateScan(): void {
    this.isScanActive = true;
    
    // Connect to the Socket server
    this.socketService.connect();
    
    // Start listening for the 'scan-received' event coming from the server
    this.scanSubscription = this.socketService.listen<any>('scan-received').subscribe(
      (studentData) => {
        console.log('Data received from mobile scanner:', studentData);
        alert(`Mobile Scan Successful! Student ID: ${studentData.studentId}`);
        
        // Stop the radar animation and disconnect
        this.cancelScan();
      }
    );
  }
  
  public cancelScan(): void {
    this.isScanActive = false;
    
    // Unsubscribe from the event to prevent memory leaks
    if (this.scanSubscription) {
      this.scanSubscription.unsubscribe();
    }
    
    // Disconnect the socket safely
    this.socketService.disconnect();
  }
}
