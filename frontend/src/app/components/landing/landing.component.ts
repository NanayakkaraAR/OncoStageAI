import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  reviews: any[] = [];

  constructor(
    private router: Router,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.fetchReviews();
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
}
