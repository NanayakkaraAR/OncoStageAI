import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  reviews: any[] = [];
  currentLanguage: Language = 'en';
  availableLanguages: Array<{code: Language; name: string}> = [];

  constructor(
    private router: Router,
    private reviewService: ReviewService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentLanguage = this.translationService.getLanguage();
    this.availableLanguages = this.translationService.getAvailableLanguages();
  }

  ngOnInit() {
    this.fetchReviews();
    this.translationService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  fetchReviews() {
    this.reviewService.getLandingReviews().subscribe({
      next: (data) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Error fetching reviews:', err);
      }
    });
  }


  onNavigate(page: string): void {
    if (page === 'login') {
      this.router.navigate(['/login']);
    }
  }

  changeLanguage(language: Language): void {
    this.translationService.setLanguage(language);
    this.currentLanguage = language;
  }
}
