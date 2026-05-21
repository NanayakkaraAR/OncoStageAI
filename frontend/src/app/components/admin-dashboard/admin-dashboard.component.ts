import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-wrapper">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </span>
          <span class="brand-name">OncoStage<strong>AI</strong></span>
        </div>
        <nav class="nav-menu">
          <button [class.active]="activeTab === 'patients'" (click)="activeTab = 'patients'">Patients</button>
          <button [class.active]="activeTab === 'doctors'" (click)="activeTab = 'doctors'">Doctors</button>
          <button [class.active]="activeTab === 'complaints'" (click)="activeTab = 'complaints'">Reported Doctors</button>
        </nav>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </aside>

      <main class="main-content">
        <header class="top-bar">
          <h1>{{ getTabTitle() }}</h1>
          <div class="user-info">
            <span>Welcome, {{ user?.firstName }}</span>
          </div>
        </header>

        <div class="content-area">
          <!-- Patients Tab -->
          <div *ngIf="activeTab === 'patients'" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let patient of patients">
                  <td>{{ patient.firstName }} {{ patient.lastName }}</td>
                  <td>{{ patient.email }}</td>
                  <td>{{ patient.phoneNumber || 'N/A' }}</td>
                  <td><span class="badge" [class.active]="patient.isActive">{{ patient.isActive ? 'Active' : 'Inactive' }}</span></td>
                  <td>{{ patient.createdAt | date:'shortDate' }}</td>
                </tr>
                <tr *ngIf="patients.length === 0">
                  <td colspan="5" class="empty-state">No patients found.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Doctors Tab -->
          <div *ngIf="activeTab === 'doctors'" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doctor of doctors">
                  <td>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</td>
                  <td>{{ doctor.email }}</td>
                  <td>{{ doctor.phoneNumber || 'N/A' }}</td>
                  <td><span class="badge" [class.active]="doctor.isActive">{{ doctor.isActive ? 'Active' : 'Inactive' }}</span></td>
                  <td>{{ doctor.createdAt | date:'shortDate' }}</td>
                </tr>
                <tr *ngIf="doctors.length === 0">
                  <td colspan="5" class="empty-state">No doctors found.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Complaints Tab -->
          <div *ngIf="activeTab === 'complaints'" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reported Doctor</th>
                  <th>Reported By (Patient)</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let complaint of complaints">
                  <td>Dr. {{ complaint.doctor?.firstName }} {{ complaint.doctor?.lastName }}</td>
                  <td>{{ complaint.patient?.firstName }} {{ complaint.patient?.lastName }}</td>
                  <td class="reason-cell">{{ complaint.reason }}</td>
                  <td><span class="badge pending">{{ complaint.status }}</span></td>
                  <td>{{ complaint.createdAt | date:'shortDate' }}</td>
                </tr>
                <tr *ngIf="complaints.length === 0">
                  <td colspan="5" class="empty-state">No reported doctors found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    .admin-wrapper {
      display: flex;
      height: 100vh;
      background: #f0f4f8;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
    }

    .sidebar {
      width: 250px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      padding: 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 40px;
    }
    .brand-logo-box {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #14b8a6, #0d9488);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-name strong { color: #14b8a6; }

    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .nav-menu button {
      background: none;
      border: none;
      text-align: left;
      padding: 12px 16px;
      border-radius: 8px;
      color: #64748b;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-menu button:hover {
      background: #f0fdfa;
      color: #14b8a6;
    }
    .nav-menu button.active {
      background: #f0fdfa;
      color: #14b8a6;
      font-weight: 600;
    }

    .logout-btn {
      background: #ffeeee;
      color: #e53e3e;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: #fed7d7; }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .top-bar {
      height: 70px;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #e2e8f0;
    }
    .top-bar h1 {
      font-size: 1.25rem;
      color: #1e293b;
      font-weight: 700;
    }
    .user-info {
      font-weight: 600;
      color: #64748b;
      font-size: 0.9rem;
    }

    .content-area {
      padding: 40px;
      overflow-y: auto;
      flex: 1;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 16px;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 16px;
      color: #1e293b;
      font-size: 0.9rem;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:last-child td { border-bottom: none; }
    
    .reason-cell { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #fee2e2;
      color: #dc2626;
    }
    .badge.active {
      background: #dcfce7;
      color: #16a34a;
    }
    .badge.pending {
      background: #fef9c3;
      color: #ca8a04;
    }

    .empty-state {
      text-align: center;
      padding: 40px !important;
      color: #94a3b8;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  user: any;
  activeTab: 'patients' | 'doctors' | 'complaints' = 'patients';
  patients: any[] = [];
  doctors: any[] = [];
  complaints: any[] = [];

  constructor(private authService: AuthService, private adminService: AdminService) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.adminService.getPatients().subscribe(res => {
      if (res.success) this.patients = res.data;
    });
    this.adminService.getDoctors().subscribe(res => {
      if (res.success) this.doctors = res.data;
    });
    this.adminService.getComplaints().subscribe(res => {
      if (res.success) this.complaints = res.data;
    });
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'patients': return 'Patients Overview';
      case 'doctors': return 'Doctors Overview';
      case 'complaints': return 'Reported Doctors';
      default: return 'Dashboard';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
