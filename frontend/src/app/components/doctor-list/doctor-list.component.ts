import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <!-- Header -->
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <span class="brand-icon">🫁</span>
            <span class="brand-name">OncoStage<strong>AI</strong></span>
          </div>
          <div class="header-right">
            <span class="user-greeting">Hello, {{ currentUser?.firstName }}</span>
            <button class="btn-logout" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <section class="hero">
        <h1>Choose Your Doctor</h1>
        <p>Select a doctor who will receive your lung cancer stage prediction report.</p>
      </section>

      <!-- Content -->
      <main class="content">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading available doctors…</p>
        </div>

        <div *ngIf="error" class="error-banner">
          <span>⚠️ {{ error }}</span>
          <button (click)="loadDoctors()">Retry</button>
        </div>

        <div *ngIf="!loading && !error" class="doctor-grid">
          <div
            *ngFor="let doctor of doctors"
            class="doctor-card"
            (click)="selectDoctor(doctor)"
          >
            <div class="avatar">{{ doctor.firstName[0] }}{{ doctor.lastName[0] }}</div>
            <div class="doctor-info">
              <h3>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</h3>
              <p class="email">{{ doctor.email }}</p>
            </div>
            <div class="select-arrow">→</div>
          </div>
        </div>

        <div *ngIf="!loading && !error && doctors.length === 0" class="empty-state">
          <span>🩺</span>
          <p>No doctors available at the moment.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page-wrapper {
      min-height: 100vh;
      background-color: var(--bg-light);
      font-family: 'Inter', 'Segoe UI', sans-serif;
      color: var(--text-dark);
    }

    /* Header */
    .header {
      background: var(--bg-white);
      border-bottom: 1px solid var(--border-light);
      padding: 0 2rem;
      box-shadow: var(--shadow-sm);
    }
    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 700; color: var(--text-dark); }
    .brand-icon { font-size: 1.6rem; }
    .brand-name strong { color: var(--primary-blue); }
    .header-right { display: flex; align-items: center; gap: 16px; }
    .user-greeting { color: var(--text-muted); font-size: 0.9rem; }
    .btn-logout {
      padding: 7px 18px;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-logout:hover { background: #fecaca; }

    /* Hero */
    .hero {
      text-align: center;
      padding: 64px 24px 32px;
    }
    .hero h1 {
      font-size: 2.8rem;
      font-weight: 800;
      color: var(--text-dark);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .hero p { color: var(--text-muted); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }

    /* Content */
    .content { max-width: 1000px; margin: 0 auto; padding: 0 24px 60px; }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 60px;
      color: var(--text-muted);
    }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border-light);
      border-top-color: var(--primary-blue);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .error-banner {
      display: flex; align-items: center; gap: 12px;
      background: #fff1f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 24px;
      color: #991b1b;
    }
    .error-banner button {
      margin-left: auto;
      padding: 8px 16px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      color: #dc2626; cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .error-banner button:hover { background: #fecaca; }

    /* Doctor grid */
    .doctor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }

    .doctor-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: 20px;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
    }
    .doctor-card:hover {
      border-color: var(--primary-blue);
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .avatar {
      width: 56px; height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; font-weight: 700; color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
    }

    .doctor-info { flex: 1; min-width: 0; }
    .doctor-info h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-dark); margin-bottom: 2px; }
    .email { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .select-arrow { 
      font-size: 1.25rem; 
      color: var(--primary-blue); 
      opacity: 0.5;
      flex-shrink: 0; 
      transition: all 0.3s ease; 
    }
    .doctor-card:hover .select-arrow { opacity: 1; transform: translateX(4px); }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: var(--bg-white);
      border-radius: 24px;
      border: 2px dashed var(--border-light);
      color: var(--text-muted);
    }
    .empty-state span { display: block; font-size: 3.5rem; margin-bottom: 16px; filter: grayscale(1); opacity: 0.5; }
    .empty-state p { font-size: 1.1rem; }
  `]
})
export class DoctorListComponent implements OnInit {
  doctors: Doctor[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any;
  private forceSelect = false;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private predictionService: PredictionService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    const navState = this.router.getCurrentNavigation()?.extras?.state;
    if (navState?.['forceSelect']) this.forceSelect = true;
  }

  ngOnInit(): void {
    const shouldForce = this.forceSelect || history.state?.forceSelect === true;
    if (shouldForce) {
      this.loadDoctors();
      return;
    }

    this.predictionService.getAssignedDoctor().subscribe({
      next: (doctor) => {
        if (doctor) {
          this.router.navigate(['/patient/dashboard'], {
            state: { selectedDoctor: doctor },
            replaceUrl: true
          });
        } else {
          this.loadDoctors();
        }
      },
      error: () => {
        this.loadDoctors();
      }
    });
  }

  loadDoctors(): void {
    this.loading = true;
    this.error = null;
    this.doctorService.getDoctors().subscribe({
      next: doctors => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error || 'Failed to load doctors.';
        this.loading = false;
      }
    });
  }

  selectDoctor(doctor: Doctor): void {
    this.loading = true;
    this.predictionService.assignDoctor(doctor.id).subscribe({
      next: () => {
        this.router.navigate(['/patient/dashboard'], {
          state: { selectedDoctor: doctor }
        });
      },
      error: () => {
        this.router.navigate(['/patient/dashboard'], {
          state: { selectedDoctor: doctor }
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
