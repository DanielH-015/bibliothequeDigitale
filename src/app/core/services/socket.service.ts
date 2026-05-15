import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  private readonly serverUrl = 'http://172.20.10.2:5000';

  constructor() {
    // Initialize the connection configuration, but don't connect automatically
    this.socket = io(this.serverUrl, {
      autoConnect: false 
    });
  }

  // Explicitly connect to the WebSocket server
  public connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Disconnect from the WebSocket server to save resources
  public disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Create an Observable that listens for our specific event (scan-received)
  public listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });
      
      // Cleanup logic when the component stops listening
      return () => {
        this.socket.off(eventName);
      };
    });
  }
}
