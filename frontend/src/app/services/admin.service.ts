import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getPatients(): Observable<any> {
    return this.http.get(`${this.apiUrl}/patients`, { headers: this.getHeaders() });
  }

  getDoctors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors`, { headers: this.getHeaders() });
  }

  getComplaints(): Observable<any> {
    return this.http.get(`${this.apiUrl}/complaints`, { headers: this.getHeaders() });
  }

  toggleDoctorStatus(doctorId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/doctors/${doctorId}/toggle-status`, {}, { headers: this.getHeaders() });
  }

  deleteDoctor(doctorId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/doctors/${doctorId}`, { headers: this.getHeaders() });
  }
}
