import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PredictionResult {
  prediction: string;
  predictionId: number;
}

export interface PatientPrediction {
  id: number;
  createdAt: string;
  result: string;
  patient: { id: number; firstName: string; lastName: string; email: string };
  Age: number;
  Tumor_Size_mm: number;
  Smoking_History: number;
  Smoking_Pack_Years: number;
  Calcium_Level: number;
  ECOG_Performance_Status: number;
  status: string;
  updatedAt?: string;
}

export interface PatientOwnPrediction {
  id: number;
  createdAt: string;
  result: string;
  doctorId: number;
  doctor: { id: number; firstName: string; lastName: string; email: string };
  Age: number;
  Tumor_Size_mm: number;
  Smoking_History: number;
  Smoking_Pack_Years: number;
  Calcium_Level: number;
  status: string;
  updatedAt?: string;
}

export interface PatientStats {
  total: number;
  completed: number;
  pending: number;
}

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  predict(payload: { doctorId: number; [key: string]: number }): Observable<PredictionResult> {
    return this.http
      .post<{ success: boolean; data: PredictionResult }>(`${this.apiUrl}/predict`, payload)
      .pipe(map(r => r.data));
  }

  getDoctorPredictions(): Observable<PatientPrediction[]> {
    return this.http
      .get<{ success: boolean; data: PatientPrediction[] }>(`${this.apiUrl}/doctor/predictions`)
      .pipe(map(r => r.data));
  }

  getPatientPredictions(): Observable<{ predictions: PatientOwnPrediction[]; stats: PatientStats }> {
    return this.http
      .get<{ success: boolean; data: { predictions: PatientOwnPrediction[]; stats: PatientStats } }>(`${this.apiUrl}/patient/predictions`)
      .pipe(map(r => r.data));
  }

  getAssignedDoctor(): Observable<{ id: number; firstName: string; lastName: string; email: string, unreadCount?: number } | null> {
    return this.http
      .get<{ success: boolean; data: { id: number; firstName: string; lastName: string; email: string, unreadCount?: number } | null }>(`${this.apiUrl}/patient/assigned-doctor`)
      .pipe(map(r => r.data));
  }

  assignDoctor(doctorId: number): Observable<{ id: number; firstName: string; lastName: string; email: string } | null> {
    return this.http
      .post<{ success: boolean; data: { id: number; firstName: string; lastName: string; email: string } | null }>(`${this.apiUrl}/patient/assign-doctor`, { doctorId })
      .pipe(map(r => r.data));
  }

  updatePredictionStatus(predictionId: number, status: string): Observable<any> {
    return this.http
      .patch<{ success: boolean; data: any }>(`${this.apiUrl}/doctor/predictions/${predictionId}/status`, { status })
      .pipe(map(r => r.data));
  }

  getDoctorPatients(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${this.apiUrl}/doctor/patients`)
      .pipe(map(r => r.data));
  }
}
