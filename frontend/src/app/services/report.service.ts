import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface MedicalReport {
  id: number;
  patientId: number;
  doctorId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  status: string;
  createdAt: string;
  doctor?: { firstName: string; lastName: string };
  patient?: { firstName: string; lastName: string };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  uploadReport(doctorId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('doctorId', doctorId.toString());
    formData.append('report', file);
    return this.http.post(`${this.apiUrl}/reports/upload`, formData);
  }

  getPatientReports(): Observable<MedicalReport[]> {
    return this.http.get<{ success: boolean, data: MedicalReport[] }>(`${this.apiUrl}/reports/patient`).pipe(
      map(res => res.data)
    );
  }

  getAllDoctorReports(): Observable<MedicalReport[]> {
    return this.http.get<{ success: boolean, data: MedicalReport[] }>(`${this.apiUrl}/reports/doctor-all`).pipe(
      map(res => res.data)
    );
  }

  getDoctorReports(patientId: number): Observable<MedicalReport[]> {
    return this.http.get<{ success: boolean, data: MedicalReport[] }>(`${this.apiUrl}/reports/doctor/${patientId}`).pipe(
      map(res => res.data)
    );
  }

  parseReport(reportId: number): Observable<any> {
    return this.http.post<{ success: boolean, data: any }>(`${this.apiUrl}/reports/${reportId}/parse`, {}).pipe(
      map(res => res.data)
    );
  }

  getReportFile(reportId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}/file`, { responseType: 'blob' });
  }

  deleteReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reports/${reportId}`);
  }

  updateReportStatus(reportId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reports/${reportId}/status`, { status });
  }
}

