import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/user';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  getUserSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`, { headers: this.getHeaders() });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData, { headers: this.getHeaders() });
  }

  updateNotifications(notificationsData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications`, notificationsData, { headers: this.getHeaders() });
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData, { headers: this.getHeaders() });
  }
}
