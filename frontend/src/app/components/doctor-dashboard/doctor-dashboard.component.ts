import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PredictionService, PatientPrediction } from '../../services/prediction.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-doctor-dashboard',
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
            <span class="user-greeting">Dr. {{ currentUser?.firstName }} {{ currentUser?.lastName }}</span>
            <button class="btn-logout" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <section class="hero">
        <h1>Doctor Dashboard</h1>
        <p>Patient prediction results assigned to you.</p>
      </section>

      <!-- Content -->
      <main class="content">
        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-num">{{ predictions.length }}</div>
            <div class="stat-label">Total Predictions</div>
          </div>
          <div class="stat-card stage-i">
            <div class="stat-num">{{ countStage('I') }}</div>
            <div class="stat-label">Stage I</div>
          </div>
          <div class="stat-card stage-ii">
            <div class="stat-num">{{ countStage('II') }}</div>
            <div class="stat-label">Stage II</div>
          </div>
          <div class="stat-card stage-iii">
            <div class="stat-num">{{ countStage('III') }}</div>
            <div class="stat-label">Stage III</div>
          </div>
          <div class="stat-card stage-iv">
            <div class="stat-num">{{ countStage('IV') }}</div>
            <div class="stat-label">Stage IV</div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading patient predictions…</p>
        </div>

        <!-- Error -->
        <div *ngIf="error && !loading" class="error-banner">
          <span>⚠️ {{ error }}</span>
          <button (click)="loadPredictions()">Retry</button>
        </div>

        <!-- Table -->
        <div *ngIf="!loading && !error" class="table-wrapper">
          <div *ngIf="predictions.length === 0" class="empty-state">
            <span>📋</span>
            <p>No predictions yet. Patients will appear here after submitting their clinical data.</p>
          </div>

          <table *ngIf="predictions.length > 0" class="predictions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Email</th>
                <th>Predicted Stage</th>
                <th>Age</th>
                <th>Tumor Size (mm)</th>
                <th>ECOG Score</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of predictions; let i = index">
                <td class="td-num">{{ i + 1 }}</td>
                <td class="td-name">
                  {{ p.patient.firstName }} {{ p.patient.lastName }}
                </td>
                <td class="td-email">{{ p.patient.email }}</td>
                <td>
                  <span class="stage-badge" [class]="getStageBadgeClass(p.result)">
                    {{ p.result }}
                  </span>
                </td>
                <td>{{ p.Age }}</td>
                <td>{{ p.Tumor_Size_mm }}</td>
                <td>{{ p.ECOG_Performance_Status }}</td>
                <td class="td-date">{{ p.createdAt | date:'MMM d, y' }}</td>
                <td>
                  <button class="btn-download" (click)="downloadPDF(p)">
                    📥 Report
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 700; }
    .brand-icon { font-size: 1.5rem; }
    .brand-name strong { color: var(--primary-blue); }
    .header-right { display: flex; align-items: center; gap: 14px; }
    .user-greeting { color: var(--text-muted); font-size: 0.9rem; }
    .btn-logout {
      padding: 7px 18px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px; color: #dc2626; cursor: pointer; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-logout:hover { background: #fecaca; }

    /* Hero */
    .hero { text-align: center; padding: 64px 24px 32px; }
    .hero h1 {
      font-size: 2.8rem; font-weight: 800;
      color: var(--text-dark);
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .hero p { color: var(--text-muted); font-size: 1.1rem; }

    /* Content */
    .content { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; }

    /* Stats */
    .stats-row {
      display: flex; gap: 20px; flex-wrap: wrap;
      margin-bottom: 48px;
    }
    .stat-card {
      flex: 1; min-width: 160px;
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-sm);
    }
    .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .stat-num { font-size: 2.4rem; font-weight: 900; color: var(--text-dark); margin-bottom: 6px; }
    .stat-label { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    
    .stat-card.stage-i { border-bottom: 4px solid var(--primary-green); }
    .stat-card.stage-i .stat-num { color: var(--primary-green); }
    .stat-card.stage-ii { border-bottom: 4px solid var(--primary-blue); }
    .stat-card.stage-ii .stat-num { color: var(--primary-blue); }
    .stat-card.stage-iii { border-bottom: 4px solid #f59e0b; }
    .stat-card.stage-iii .stat-num { color: #f59e0b; }
    .stat-card.stage-iv { border-bottom: 4px solid #ef4444; }
    .stat-card.stage-iv .stat-num { color: #ef4444; }

    /* Loading */
    .loading-state { text-align: center; padding: 80px; color: var(--text-muted); }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border-light);
      border-top-color: var(--primary-blue);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .error-banner {
      display: flex; align-items: center; gap: 12px;
      background: #fff1f2;
      border: 1px solid #fecaca;
      border-radius: 12px; padding: 20px; margin-bottom: 32px;
      color: #991b1b;
    }
    .error-banner button {
      margin-left: auto; padding: 8px 16px;
      background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px;
      color: #dc2626; cursor: pointer; font-weight: 600;
    }

    /* Table */
    .table-wrapper { 
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }
    .predictions-table {
      width: 100%; border-collapse: collapse;
    }
    .predictions-table thead {
      background: #f8fafc;
      border-bottom: 1px solid var(--border-light);
    }
    .predictions-table th {
      padding: 20px 24px;
      text-align: left;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .predictions-table td {
      padding: 20px 24px;
      font-size: 0.95rem;
      border-bottom: 1px solid var(--border-light);
      color: var(--text-dark);
    }
    .predictions-table tr:last-child td { border-bottom: none; }
    .predictions-table tbody tr:hover { background: #f1f5f9; }
    .td-num { color: var(--text-muted); font-weight: 600; }
    .td-name { font-weight: 700; color: var(--text-dark); }
    .td-email { color: var(--text-muted); font-size: 0.9rem; }
    .td-date { font-size: 0.9rem; color: var(--text-muted); }

    .btn-download {
      padding: 6px 12px;
      background: var(--bg-light);
      border: 1px solid var(--border-light);
      border-radius: 6px;
      color: var(--primary-blue);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .btn-download:hover {
      background: #e0f2fe;
      border-color: var(--primary-blue);
    }

    /* Stage badge */
    .stage-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 0.85rem; font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .badge-stage-i { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .badge-stage-ii { background: #f0f9ff; color: #075985; border: 1px solid #bae6fd; }
    .badge-stage-iii { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .badge-stage-iv { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    /* Empty */
    .empty-state {
      text-align: center; padding: 100px 40px;
      color: var(--text-muted);
    }
    .empty-state span { display: block; font-size: 4rem; margin-bottom: 20px; filter: grayscale(1); opacity: 0.4; }
    .empty-state p { font-size: 1.1rem; }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  currentUser: any;
  predictions: PatientPrediction[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private predictionService: PredictionService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadPredictions();
  }

  loadPredictions(): void {
    this.loading = true;
    this.error = null;
    this.predictionService.getDoctorPredictions().subscribe({
      next: data => {
        this.predictions = data;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.error || 'Failed to load predictions.';
        this.loading = false;
      }
    });
  }

  countStage(stage: string): number {
    return this.predictions.filter(p => {
      const r = p.result.toUpperCase();
      // Exact match for "STAGE I", "STAGE II", etc. to avoid partial matches
      return r === `STAGE ${stage}` || r === stage;
    }).length;
  }

  getStageBadgeClass(result: string): string {
    const r = result.toLowerCase();
    if (r.includes('iv') || r.includes('4')) return 'badge-stage-iv';
    if (r.includes('iii') || r.includes('3')) return 'badge-stage-iii';
    if (r.includes('ii') || r.includes('2')) return 'badge-stage-ii';
    return 'badge-stage-i';
  }

  downloadPDF(prediction: PatientPrediction): void {
    const doc = new jsPDF();
    const patientName = `${prediction.patient.firstName} ${prediction.patient.lastName}`;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233); // Blue
    doc.text('OncoStageAI - Prediction Report', 105, 20, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 25, 190, 25);
    
    // Patient Info section
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${patientName}`, 20, 48);
    doc.text(`Email: ${prediction.patient.email}`, 20, 56);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 64);
    
    // Result Highlight
    doc.setFillColor(240, 249, 255); // Light blue bg
    doc.rect(20, 75, 170, 30, 'F');
    doc.setDrawColor(186, 230, 253);
    doc.rect(20, 75, 170, 30, 'D');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Prediction Stage:', 30, 93);
    doc.setTextColor(7, 89, 133); // Dark blue
    doc.text(prediction.result.toUpperCase(), 90, 93);
    
    // Clinical Data
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Indicators:', 20, 120);
    
    doc.setFont('helvetica', 'normal');
    const data = [
      ['Age:', `${prediction.Age} years`],
      ['Tumor Size:', `${prediction.Tumor_Size_mm} mm`],
      ['Smoking History:', prediction.Smoking_History === 1 ? 'Positive' : 'Negative'],
      ['ECOG Performance Status:', prediction.ECOG_Performance_Status.toString()],
    ];
    
    let y = 130;
    data.forEach(row => {
      doc.text(row[0], 30, y);
      doc.text(row[1], 100, y);
      y += 10;
    });

    // Disclaimer
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const disclaimer = 'Note: This result is generated by an artificial intelligence model and should be reviewed by a medical professional for clinical diagnosis.';
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 170);
    doc.text(splitDisclaimer, 20, 260);
    
    doc.setTextColor(14, 165, 233);
    doc.text('Generated by OncoStageAI Healthcare Systems', 105, 285, { align: 'center' });
    
    doc.save(`OncoStageAI_${patientName.replace(/\s+/g, '_')}_Report.pdf`);
  }

  logout(): void {
    this.authService.logout();
  }
}
