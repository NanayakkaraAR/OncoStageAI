import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  submitReview(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, data);
  }

  getLandingReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auth/landing-reviews`);
  }
}
