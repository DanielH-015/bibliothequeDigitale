import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Base URL pointing to our Express Backend API
  private readonly baseUrl: string = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Helper method to append Authorization token to requests
  private getAuthHeaders(isFormData: boolean = false): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  // Perform a generic GET request
  public get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Perform a generic POST request
  public post<T>(endpoint: string, body: any): Observable<T> {
    const isFormData = body instanceof FormData;
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getAuthHeaders(isFormData)
    });
  }

  // Perform a generic PUT request
  public put<T>(endpoint: string, body: any): Observable<T> {
    const isFormData = body instanceof FormData;
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getAuthHeaders(isFormData)
    });
  }

  // Perform a generic DELETE request
  public delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders()
    });
  }
}
