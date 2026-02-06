import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Patient Dashboard</h1>
      <div class="welcome-card">
        <h2>Welcome, {{ user?.firstName }} {{ user?.lastName }}!</h2>
        <p>Email: {{ user?.email }}</p>
        <p>Role: {{ user?.role }}</p>
      </div>
      <button (click)="logout()" class="btn-logout">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .welcome-card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .btn-logout {
      padding: 10px 20px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
  `]
})
export class PatientDashboardComponent {
  user: any;

  constructor(private authService: AuthService) {
    this.user = this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
  }
}
