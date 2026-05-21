import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService, Doctor } from '../../services/doctor.service';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';

export interface DoctorWithCapacity extends Doctor {
  appointmentCount?: number;
}

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            [class.full]="(doctor.appointmentCount || 0) >= 10"
            (click)="selectDoctor(doctor)"
          >
            <div class="avatar">{{ doctor.firstName[0] }}{{ doctor.lastName[0] }}</div>
            <div class="doctor-info">
              <h3>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</h3>
              <p class="email">{{ doctor.email }}</p>
              <div class="capacity-bar-wrap">
                <div class="capacity-text">
                  <span>Weekly Capacity</span>
                  <span [class.text-danger]="(doctor.appointmentCount || 0) >= 10">
                    {{ doctor.appointmentCount || 0 }}/10
                  </span>
                </div>
                <div class="capacity-bar">
                  <div class="capacity-fill" 
                       [style.width.%]="(doctor.appointmentCount || 0) * 10"
                       [class.bg-danger]="(doctor.appointmentCount || 0) >= 10"></div>
                </div>
              </div>
            </div>
            
            <div class="action-buttons">
              <button class="btn-report" (click)="openReportModal(doctor, $event)">Report</button>
              <div class="select-arrow" *ngIf="(doctor.appointmentCount || 0) < 10" (click)="selectDoctor(doctor)">Select →</div>
              <div class="full-badge" *ngIf="(doctor.appointmentCount || 0) >= 10">FULL</div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !error && doctors.length === 0" class="empty-state">
          <span>🩺</span>
          <p>No doctors available at the moment.</p>
        </div>
      </main>

      <!-- Report Modal -->
      <div class="modal-overlay" *ngIf="showReportModal">
        <div class="modal-content">
          <h3>Report Dr. {{ selectedDoctorToReport?.lastName }}</h3>
          <p class="modal-desc">Please provide a reason for your report. This will be reviewed by our admin team.</p>
          <textarea 
            [(ngModel)]="reportReason" 
            placeholder="Enter reason here..." 
            rows="4"
          ></textarea>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeReportModal()">Cancel</button>
            <button class="btn-submit" [disabled]="!reportReason.trim()" (click)="submitReport()">Submit Report</button>
          </div>
        </div>
      </div>
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

    .action-buttons {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .btn-report {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-report:hover { background: #fecaca; }

    .select-arrow { 
      font-size: 0.9rem; 
      font-weight: 600;
      background: #e0f2fe;
      padding: 8px 16px;
      border-radius: 8px;
      color: var(--primary-blue); 
      flex-shrink: 0; 
      transition: all 0.3s ease; 
      cursor: pointer;
    }
    .select-arrow:hover { background: #bae6fd; transform: translateX(4px); }

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

    /* Capacity Styles */
    .capacity-bar-wrap { margin-top: 12px; }
    .capacity-text {
      display: flex; justify-content: space-between;
      font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
      margin-bottom: 4px;
    }
    .capacity-bar {
      height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;
    }
    .capacity-fill {
      height: 100%; background: var(--primary-green); border-radius: 3px;
      transition: width 0.3s ease;
    }
    .bg-danger { background: #ef4444 !important; }
    .text-danger { color: #ef4444 !important; }
    
    .doctor-card.full {
      cursor: not-allowed;
      border-color: #fee2e2;
      background: #fafafa;
    }
    .doctor-card.full:hover {
      transform: none;
      box-shadow: var(--shadow-sm);
      border-color: #fecaca;
    }
    .full-badge {
      background: #fee2e2; color: #dc2626;
      font-size: 0.7rem; font-weight: 800;
      padding: 4px 8px; border-radius: 6px;
      letter-spacing: 0.05em;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white; border-radius: 16px; padding: 32px;
      width: 100%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .modal-content h3 { color: #2b3674; margin-bottom: 8px; font-size: 1.3rem; }
    .modal-desc { color: #707eae; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5; }
    .modal-content textarea {
      width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-family: inherit; font-size: 0.95rem; resize: none; margin-bottom: 24px;
      outline: none; transition: border-color 0.2s;
    }
    .modal-content textarea:focus { border-color: var(--primary-blue); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
    .btn-cancel { padding: 10px 20px; border: none; background: #f1f5f9; color: #64748b; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-submit { padding: 10px 20px; border: none; background: #ef4444; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-submit:hover:not(:disabled) { background: #dc2626; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class DoctorListComponent implements OnInit {
  doctors: DoctorWithCapacity[] = [];
  loading = true;
  error: string | null = null;
  currentUser: any;
  private forceSelect = false;

  showReportModal = false;
  selectedDoctorToReport: Doctor | null = null;
  reportReason = '';

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

  selectDoctor(doctor: DoctorWithCapacity): void {
    if ((doctor.appointmentCount || 0) >= 10) {
      this.error = `Dr. ${doctor.lastName} is fully booked for this week. Please select another doctor.`;
      return;
    }

    this.loading = true;
    this.predictionService.assignDoctor(doctor.id).subscribe({
      next: () => {
        this.router.navigate(['/patient/dashboard'], {
          state: { selectedDoctor: doctor }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Failed to assign doctor. They might have just become full.';
      }
    });
  }

  openReportModal(doctor: Doctor, event: Event): void {
    event.stopPropagation(); // prevent triggering the card click
    this.selectedDoctorToReport = doctor;
    this.reportReason = '';
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.selectedDoctorToReport = null;
    this.reportReason = '';
  }

  submitReport(): void {
    if (!this.selectedDoctorToReport || !this.reportReason.trim()) return;

    const doctorId = this.selectedDoctorToReport.id;
    this.doctorService.submitComplaint(doctorId, this.reportReason).subscribe({
      next: () => {
        alert('Report submitted successfully.');
        this.closeReportModal();
      },
      error: () => {
        alert('Failed to submit report. Please try again.');
        this.closeReportModal();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
