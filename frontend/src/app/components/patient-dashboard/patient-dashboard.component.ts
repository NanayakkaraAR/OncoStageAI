import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <div class="logo">L</div>
          <div class="brand-text">LungCare AI</div>
        </div>
        <nav class="main-nav">
          <a routerLink="/patient/dashboard" class="nav-item active">Dashboard</a>
          <a routerLink="/patient/dashboard" class="nav-item">My Reports</a>
          <a routerLink="/settings" class="nav-item">Settings</a>
        </nav>
        <div class="profile-area">
          <div class="user-name">{{ user?.firstName }} {{ user?.lastName }}<div class="user-role">{{ user?.role }}</div></div>
          <button class="link-logout" (click)="logout()">Logout</button>
        </div>
      </div>
    </header>

    <section class="hero">
      <div class="hero-inner">
        <h1>Welcome back, {{ user?.firstName }} {{ user?.lastName }}!</h1>
        <p class="subtitle">Monitor your lung health with AI-powered predictions</p>
      </div>
    </section>

    <main class="main-grid">
      <section class="left-col">
        <div class="card doctor-card">
          <h3>Assigned Doctor</h3>
          <ng-container *ngIf="assignedDoctor; else noDoctor">
            <div class="doctor-info">
              <div class="avatar">{{ assignedDoctor?.firstName?.charAt(0) }}{{ assignedDoctor?.lastName?.charAt(0) }}</div>
              <div class="meta">
                <div class="name">Dr. {{ assignedDoctor?.firstName }} {{ assignedDoctor?.lastName }}</div>
                <div class="specialty">{{ assignedDoctor?.specialty || 'General' }}</div>
                <div class="contact">{{ assignedDoctor?.email || assignedDoctor?.phone || '' }}</div>
              </div>
            </div>
          </ng-container>
          <ng-template #noDoctor>
            <div class="no-doctor">You have not been assigned a doctor yet. <a routerLink="/patient/select-doctor">Select a doctor</a></div>
          </ng-template>
        </div>
      </section>

      <aside class="right-col">
        <div class="card actions-card">
          <button class="btn-primary full" (click)="goToPrediction()">Enter Data & Predict</button>
        </div>
      </aside>
    </main>
  `,
  styles: [`
    :host { display:block; font-family: Inter, Roboto, system-ui, -apple-system; color: #0f172a; }
    .topbar { background: #fff; border-bottom: 1px solid #eef2f6; }
    .topbar-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:14px 20px; }
    .brand { display:flex; align-items:center; gap:12px; }
    .logo { width:40px; height:40px; border-radius:8px; background:linear-gradient(135deg,#1dd3b0,#2b8cff); color:white; display:flex; align-items:center; justify-content:center; font-weight:700 }
    .brand-text { font-weight:600; color:#0b1b2b }
    .main-nav { display:flex; gap:18px; align-items:center }
    .nav-item { color:#54607a; text-decoration:none; padding:8px 12px; border-radius:8px }
    .nav-item.active { background:#e6fbf5; color:#0aa678; font-weight:600 }
    .profile-area { display:flex; align-items:center; gap:12px }
    .user-name { text-align:right; font-size:14px; color:#0b1b2b }
    .user-role { font-size:12px; color:#7b8794 }
    .link-logout { background:none; border:none; color:#6b7280; cursor:pointer }

    .hero { background:#fafcfe; border-bottom:1px solid #f1f5f9 }
    .hero-inner { max-width:1200px; margin:0 auto; padding:36px 20px }
    .hero h1 { margin:0; font-size:28px; color:#0b1b2b }
    .subtitle { margin-top:8px; color:#596579 }

    .main-grid { max-width:1200px; margin:28px auto; display:grid; grid-template-columns: 1fr 320px; gap:24px; padding:0 20px }
    .card { background:white; padding:20px; border-radius:12px; box-shadow:0 6px 18px rgba(15,23,42,0.06) }

    .doctor-card h3 { margin-top:0; margin-bottom:12px }
    .doctor-info { display:flex; gap:14px; align-items:center }
    .avatar { width:64px; height:64px; border-radius:12px; background:#eef7ff; display:flex; align-items:center; justify-content:center; font-weight:700; color:#0b4a78 }
    .meta .name { font-weight:600 }
    .meta .specialty { color:#4b5563; margin-top:4px }
    .no-doctor a { color:#2b8cff }

    .actions-card { display:flex; flex-direction:column; gap:16px }
    .btn-primary { padding:12px 16px; border-radius:10px; border:none; background:#10b981; color:white; font-weight:600; cursor:pointer }
    .btn-primary.full { width:100%; font-size:16px }

    .badge { background:#ef4444; color:white; border-radius:999px; padding:2px 8px; font-size:12px }
    @media (max-width:900px){ .main-grid{ grid-template-columns: 1fr } .right-col{ order:2 } }
  `]
})
export class PatientDashboardComponent {
  user: any;
  assignedDoctor: any = null;
  

  constructor(private authService: AuthService, private router: Router) {
    this.user = this.authService.getCurrentUser();
    this.loadAssignedDoctor();
  }

  logout(): void {
    this.authService.logout();
  }

  loadAssignedDoctor(): void {
    this.authService.getMyDoctorAssignment().subscribe({
      next: (res: any) => {
        // backend returns { assignment: { doctor: {...} } }
        this.assignedDoctor = res?.assignment?.doctor ?? res?.doctor ?? null;
      },
      error: () => {
        this.assignedDoctor = null;
      }
    });
  }

  

  goToPrediction(): void {
    // Navigate to a prediction/data entry route — create one if it doesn't exist
    this.router.navigate(['/patient/enter-data']);
  }
}
