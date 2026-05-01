import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';

@Component({
  selector: 'app-patient-main-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-main-dashboard.component.html',
  styleUrls: ['./patient-main-dashboard.component.css']
})
export class PatientMainDashboardComponent implements OnInit {
  currentUser: any;
  stats = {
    totalPredictions: 12,
    pendingReviews: 2,
    completed: 10
  };
  latestResult = {
    date: '2025-11-28',
    riskLevel: 'Low',
    predictedStage: 'Stage I',
    confidence: 87,
    doctorComment: 'Results look good. Continue monitoring and maintain healthy lifestyle.'
  };
  recentHistory = [
    { date: '2025-11-28', stage: 'Stage I', risk: 'Low' },
    { date: '2025-11-15', stage: 'Stage I', risk: 'Low' },
    { date: '2025-10-30', stage: 'Stage II', risk: 'Medium' }
  ];

  constructor(
    private authService: AuthService,
    private predictionService: PredictionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser$;
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToAssessment(): void {
    this.router.navigate(['/patient/doctors']);
  }
}
