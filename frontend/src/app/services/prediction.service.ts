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
  ECOG_Performance_Status: number;
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
}
