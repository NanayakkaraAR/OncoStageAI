import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-patient-main-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './patient-main-dashboard.component.html',
  styleUrls: ['./patient-main-dashboard.component.css']
})
export class PatientMainDashboardComponent implements OnInit {
  currentUser: any;
  currentLanguage: Language = 'en';
  availableLanguages: Array<{code: Language; name: string}> = [];
  
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
    private router: Router,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.translationService.getLanguage();
    this.availableLanguages = this.translationService.getAvailableLanguages();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser$;
    // Subscribe to language changes
    this.translationService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    // Alternatively, if it's an Observable:
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  changeLanguage(language: Language): void {
    this.translationService.setLanguage(language);
    this.currentLanguage = language;
    this.cdr.markForCheck();
  }

  onLanguageChange(event: Event): void {
    const element = event.target as HTMLSelectElement;
    this.changeLanguage(element.value as Language);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToAssessment(): void {
    this.router.navigate(['/patient/doctors']);
  }
}
