import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  unreadCount?: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<Doctor[]> {
    return this.http
      .get<{ success: boolean; data: Doctor[] }>(`${this.apiUrl}/doctors`)
      .pipe(map(r => r.data));
  }

  submitComplaint(doctorId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/patient/complaints`, { doctorId, reason });
  }
}
