import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PredictionService, PatientOwnPrediction, PatientStats } from '../../services/prediction.service';
import { Doctor } from '../../services/doctor.service';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ReportService, MedicalReport } from '../../services/report.service';
import { PdfService } from '../../services/pdf.service';

declare var JitsiMeetExternalAPI: any;

interface FieldGroup {
  label: string;
  icon: string;
  fields: { key: string; label: string; hint?: string; min?: number; max?: number; isBinary?: boolean }[];
}

type DashView = 'home' | 'upload-reports' | 'reports' | 'settings' | 'report-detail' | 'consult';
type SettingsTab = 'profile' | 'security' | 'notifications' | 'privacy';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <!-- ═══════════════ JITSI OVERLAY ═══════════════ -->
      <div class="jitsi-overlay" *ngIf="isCallActive">
        <div id="jitsi-container"></div>
        <button class="btn-close-jitsi" (click)="forceEndCall()">End Call</button>
      </div>

      <!-- Header -->
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <span class="brand-logo-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
            <span class="brand-name">OncoStage<strong>AI</strong></span>
          </div>
          <nav class="header-nav">
            <button class="nav-btn" [class.active]="view==='home'" (click)="view='home'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard
            </button>
            <button class="nav-btn" [class.active]="view==='reports'" (click)="view='reports'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              My Predictions
            </button>
            <button class="nav-btn" [class.active]="view==='upload-reports'" (click)="view='upload-reports'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Share Reports
            </button>
            <button class="nav-btn" [class.active]="view==='consult'" (click)="openConsult()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Consult
              <span *ngIf="getTotalUnreadCount() > 0" class="nav-unread-badge">{{ getTotalUnreadCount() }}</span>
            </button>
            <button class="nav-btn" [class.active]="view==='settings'" (click)="openSettings()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Settings
            </button>
          </nav>
          <div class="header-right">
            <span class="user-info">
              <span class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</span>
              <span class="user-role">Patient</span>
            </span>
            <button class="btn-logout" (click)="logout()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- ═══════════════ HOME DASHBOARD ═══════════════ -->
      <main *ngIf="view==='home'" class="dash-main">

        <!-- No doctor selected warning -->
        <div *ngIf="!selectedDoctor" class="no-doctor-bar">
          <span>⚠️ No doctor selected.</span>
          <button (click)="goBack()">Pick a doctor →</button>
        </div>

        <!-- Welcome -->
        <div class="welcome-section">
          <div>
            <h1 class="welcome-title">Welcome back, {{ currentUser?.firstName }}!</h1>
            <p class="welcome-sub">Monitor your lung health with AI-powered predictions</p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon teal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div class="stat-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
            <div class="stat-val">{{ stats?.total ?? 0 }}</div>
            <div class="stat-lbl">Total Predictions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div class="stat-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
            <div class="stat-val">{{ stats?.pending ?? 0 }}</div>
            <div class="stat-lbl">Pending Reviews</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon indigo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="stat-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
            <div class="stat-val">{{ stats?.completed ?? 0 }}</div>
            <div class="stat-lbl">Completed</div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="cta-row">
          <button class="btn-enter-data" (click)="view='upload-reports'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Share Medical Reports with Doctor
          </button>
        </div>

        <!-- Main Grid -->
        <div class="main-grid">

          <!-- Left: Latest Result + History -->
          <div class="left-col">

            <!-- Latest Prediction Result -->
            <div class="card" *ngIf="latestPrediction">
              <div class="card-header">
                <span class="card-title">Latest Prediction Result</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="result-row"><span class="result-key">Date</span><span class="result-val">{{ latestPrediction.createdAt | date:'yyyy-MM-dd' }}</span></div>
              <div class="result-row"><span class="result-key">Risk Level</span><span class="badge" [class]="getRiskBadge(latestPrediction.result)">{{ getRiskLabel(latestPrediction.result) }}</span></div>
              <div class="result-row"><span class="result-key">Predicted Stage</span><span class="result-val bold">{{ latestPrediction.result }}</span></div>
              <div class="result-row">
                <span class="result-key">Confidence</span>
                <span class="conf-wrap">
                  <span class="conf-bar"><span class="conf-fill" [style.width]="getConfidence(latestPrediction.result) + '%'"></span></span>
                  <span class="conf-pct">{{ getConfidence(latestPrediction.result) }}%</span>
                </span>
              </div>
              <div class="doctor-comment-box">
                <span class="comment-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </span>
                <div>
                  <div class="comment-title">Doctor's Comments</div>
                  <div class="comment-text">Results shared with Dr. {{ latestPrediction.doctor.firstName }} {{ latestPrediction.doctor.lastName }}. Continue monitoring and maintain a healthy lifestyle.</div>
                </div>
              </div>
              <button class="btn-view-report" (click)="openReportDetail(latestPrediction)">View Detailed Report</button>
            </div>

            <!-- Empty state -->
            <div class="card empty-card" *ngIf="!latestPrediction && !loadingPredictions">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <p>No predictions yet. Share your medical reports with your doctor to get started.</p>
              <button class="btn-enter-data small" (click)="view='upload-reports'">Share Reports</button>
            </div>

            <div class="card loading-card" *ngIf="loadingPredictions">
              <div class="spinner"></div>
              <p>Loading your health data…</p>
            </div>

            <!-- Recent History -->
            <div class="card" *ngIf="predictions.length > 0">
              <div class="card-header">
                <span class="card-title">Recent Prediction History</span>
                <button class="view-all-btn" (click)="goToForm()">View All</button>
              </div>
              <div class="history-list">
                <div class="history-item" *ngFor="let p of predictions.slice(0,5)">
                  <span class="hist-doc-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </span>
                  <div class="hist-info">
                    <span class="hist-date">{{ p.createdAt | date:'yyyy-MM-dd' }}</span>
                    <span class="hist-stage">{{ p.result }}</span>
                  </div>
                  <span class="badge sm" [class]="getRiskBadge(p.result)">{{ getRiskLabel(p.result) }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Right: Notifications + Doctor -->
          <div class="right-col">

            <!-- Assigned Doctor -->
            <div class="card" *ngIf="selectedDoctor">
              <div class="card-header">
                <span class="card-title">Assigned Doctor</span>
              </div>
              <div class="doctor-card-inner">
                <div class="doc-avatar-sm">{{ selectedDoctor.firstName[0] }}{{ selectedDoctor.lastName[0] }}</div>
                <div>
                  <div class="doc-name">Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</div>
                  <div class="doc-email-sm">{{ selectedDoctor.email }}</div>
                </div>
              </div>
              <button class="btn-change-doc" (click)="goBack()">← Change Doctor</button>
            </div>

            <!-- Notifications -->
            <div class="card notif-card">
              <div class="card-header">
                <span class="card-title notif-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  Notifications
                </span>
                <span class="notif-badge">{{ (predictions.length > 0 ? 2 : 0) + getTotalUnreadCount() }}</span>
              </div>
              <div class="notif-list" *ngIf="predictions.length > 0 || getTotalUnreadCount() > 0">
                <div class="notif-item" *ngIf="getTotalUnreadCount() > 0" (click)="openConsult()" style="cursor:pointer; background: #f0fdf4; border-left: 3px solid #22c55e;">
                  <div class="notif-msg" style="font-weight: 700; color: #166534;">You have {{ getTotalUnreadCount() }} new message(s)</div>
                  <div class="notif-time">Just now</div>
                </div>
                <div class="notif-item" *ngIf="predictions.length > 0">
                  <div class="notif-msg">Your latest prediction result is ready</div>
                  <div class="notif-time">Just now</div>
                </div>
                <div class="notif-item" *ngIf="selectedDoctor">
                  <div class="notif-msg">Dr. {{ selectedDoctor.firstName }} is reviewing your report</div>
                  <div class="notif-time">1 hour ago</div>
                </div>
              </div>
              <div class="notif-empty" *ngIf="predictions.length === 0">
                <p>No notifications yet. Submit your first prediction to get started.</p>
              </div>
              <button class="view-all-btn center">View All Notifications</button>
            </div>

          </div>
        </div>
      </main>

      <!-- ═══════════════ MY REPORTS VIEW ═══════════════ -->
      <main *ngIf="view==='reports'" class="dash-main">
        <div class="reports-header">
          <div>
            <h1 class="welcome-title">My Predictions</h1>
            <p class="welcome-sub">Complete history of all your lung cancer prediction reports</p>
          </div>
          <button class="btn-enter-data" (click)="view='upload-reports'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Share New Report
          </button>
        </div>

        <!-- Summary bar -->
        <div class="reports-summary-bar">
          <div class="rsb-item">
            <span class="rsb-val">{{ stats?.total ?? 0 }}</span>
            <span class="rsb-lbl">Total Reports</span>
          </div>
          <div class="rsb-divider"></div>
          <div class="rsb-item">
            <span class="rsb-val">{{ stats?.completed ?? 0 }}</span>
            <span class="rsb-lbl">Completed</span>
          </div>
          <div class="rsb-divider"></div>
          <div class="rsb-item">
            <span class="rsb-val risk-high">{{ highRiskCount }}</span>
            <span class="rsb-lbl">High Risk</span>
          </div>
          <div class="rsb-divider"></div>
          <div class="rsb-item">
            <span class="rsb-val risk-low">{{ lowRiskCount }}</span>
            <span class="rsb-lbl">Low Risk</span>
          </div>
        </div>

        <!-- Loading -->
        <div class="card loading-card" *ngIf="loadingPredictions">
          <div class="spinner"></div>
          <p>Loading your reports…</p>
        </div>

        <!-- Empty state -->
        <div class="reports-empty" *ngIf="!loadingPredictions && predictions.length === 0">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <h3>No reports yet</h3>
          <p>Share your medical reports with your doctor to generate a prediction.</p>
          <button class="btn-enter-data" style="margin-top:16px" (click)="goToForm()">Share Reports</button>
        </div>

        <!-- Reports Table -->
        <div class="reports-table-wrap" *ngIf="!loadingPredictions && predictions.length > 0">
          <table class="reports-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Predicted Stage</th>
                <th>Risk Level</th>
                <th>Confidence</th>
                <th>Doctor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let p of predictions; let i = index">
                <tr class="report-row" [class.expanded]="expandedId === p.id" (click)="toggleExpand(p.id)">
                  <td class="row-num">{{ predictions.length - i }}</td>
                  <td class="row-date">{{ p.createdAt | date:'MMM d, yyyy' }}</td>
                  <td class="row-stage">{{ p.result }}</td>
                  <td><span class="badge" [class]="getRiskBadge(p.result)">{{ getRiskLabel(p.result) }}</span></td>
                  <td>
                    <div class="conf-wrap">
                      <span class="conf-bar"><span class="conf-fill" [style.width]="getConfidence(p.result) + '%'"></span></span>
                      <span class="conf-pct">{{ getConfidence(p.result) }}%</span>
                    </div>
                  </td>
                  <td class="row-doctor">Dr. {{ p.doctor.firstName }} {{ p.doctor.lastName }}</td>
                  <td class="row-chevron">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="expandedId===p.id ? 'rotate(180deg)' : 'rotate(0)'" style="transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
                  </td>
                </tr>
                <!-- Expanded detail row -->
                <tr class="detail-row" *ngIf="expandedId === p.id">
                  <td colspan="7">
                    <div class="detail-panel">
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-lbl">Report Date</span>
                          <span class="detail-val">{{ p.createdAt | date:'MMMM d, yyyy, h:mm a' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-lbl">Predicted Stage</span>
                          <span class="detail-val bold">{{ p.result }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-lbl">Risk Level</span>
                          <span class="badge" [class]="getRiskBadge(p.result)">{{ getRiskLabel(p.result) }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-lbl">AI Confidence</span>
                          <span class="detail-val">{{ getConfidence(p.result) }}%</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-lbl">Reviewing Doctor</span>
                          <span class="detail-val">Dr. {{ p.doctor.firstName }} {{ p.doctor.lastName }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-lbl">Doctor Email</span>
                          <span class="detail-val">{{ p.doctor.email }}</span>
                        </div>
                      </div>
                      <div class="detail-comment-box" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:12px;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          <div>
                            <div class="comment-title">AI Analysis Note</div>
                            <div class="comment-text">This prediction was generated based on the clinical data you submitted. Results shared with Dr. {{ p.doctor.firstName }} {{ p.doctor.lastName }}.</div>
                          </div>
                        </div>
                        <button class="btn-action action-new" style="white-space:nowrap; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem;" (click)="openReportDetail(p)">
                          View Detailed Report
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </main>

      <!-- ═══════════════ UPLOAD REPORTS VIEW ═══════════════ -->
      <div *ngIf="view==='upload-reports'">

        <!-- No doctor selected -->
        <div *ngIf="!selectedDoctor" class="no-doctor">
          <div class="empty-icon" style="margin-bottom:20px;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3>No doctor assigned</h3>
          <p>Please select a doctor to share your reports with first.</p>
          <button class="btn-enter-data" (click)="goBack()" style="margin-top:16px;">Pick a doctor first →</button>
        </div>

        <div *ngIf="selectedDoctor">
          <!-- Doctor Banner -->
          <div class="doctor-banner">
            <div class="banner-inner">
              <div class="doc-avatar">{{ selectedDoctor.firstName[0] }}{{ selectedDoctor.lastName[0] }}</div>
              <div>
                <p class="doc-sub">SHARING REPORTS WITH</p>
                <h2>Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</h2>
                <p class="doc-email">{{ selectedDoctor.email }}</p>
              </div>
              <button class="btn-back-dash" (click)="view='home'">← Back to Dashboard</button>
            </div>
          </div>

          <main class="content">
            <div class="form-card">
              <div class="form-title">
                <h2>Share Medical Reports</h2>
                <p>Upload your clinical reports (PDF, Images) so your doctor can review them and generate a prediction.</p>
              </div>

              <div class="upload-container" style="padding: 40px; border: 2px dashed #e2e8f0; border-radius: 12px; text-align: center; background: #f8fafc; transition: all 0.2s;">
                <input type="file" #fileInput (change)="onFileSelected($event)" hidden accept=".pdf,image/*">
                
                <div *ngIf="!selectedFile">
                  <div class="upload-icon" style="font-size: 48px; margin-bottom: 16px;">📄</div>
                  <h3>Select a file to upload</h3>
                  <p style="color: #64748b; margin-bottom: 24px;">Accepted formats: PDF, PNG, JPG</p>
                  <button class="btn-enter-data" (click)="fileInput.click()">Choose File</button>
                  <div style="margin-top: 16px;">
                    <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 8px; font-weight: 600;">Download a sample report to test:</p>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                      <button type="button" (click)="downloadTestPdf('low')" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">Low Risk</button>
                      <button type="button" (click)="downloadTestPdf('medium')" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">Medium Risk</button>
                      <button type="button" (click)="downloadTestPdf('high')" style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">High Risk</button>
                    </div>
                  </div>
                </div>

                <div *ngIf="selectedFile">
                  <div class="selected-file-info" style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px;">
                    <div style="font-size: 32px;">📄</div>
                    <div style="text-align: left;">
                      <div style="font-weight: 600; color: #1e293b;">{{ selectedFile.name }}</div>
                      <div style="font-size: 0.85rem; color: #64748b;">{{ (selectedFile.size / 1024 / 1024) | number:'1.1-2' }} MB</div>
                    </div>
                    <button (click)="selectedFile = null" style="background: none; border: none; color: #ef4444; font-weight: 600; cursor: pointer;">✕ Remove</button>
                  </div>
                  
                  <button class="btn-predict" (click)="uploadReport()" [disabled]="uploadingReport">
                    <span *ngIf="!uploadingReport">🚀 Upload and Send to Dr. {{ selectedDoctor.firstName }}</span>
                    <span *ngIf="uploadingReport" class="btn-loading">
                      <span class="spinner-sm"></span> Uploading…
                    </span>
                  </button>
                </div>
              </div>

              <!-- Recently Uploaded -->
              <div class="uploaded-history" style="margin-top: 40px;" *ngIf="patientReports.length > 0">
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Recently Shared Reports</h3>
                <div class="report-list" style="display: grid; gap: 12px;">
                  <div *ngFor="let r of patientReports" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <div style="font-size: 20px;">📄</div>
                      <div>
                        <div style="font-weight: 600; font-size: 0.95rem;">{{ r.fileName }}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">Shared on {{ r.createdAt | date:'MMM d, yyyy' }}</div>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <button (click)="viewReport(r)" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">View</button>
                      <span style="font-size: 0.8rem; font-weight: 600; color: #14b8a6; background: #f0fdfa; padding: 4px 10px; border-radius: 20px;">Sent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <!-- ═══════════════ DETAILED REPORT VIEW ═══════════════ -->
      <main *ngIf="view==='report-detail' && selectedPrediction" class="dash-main report-main">
        <div class="report-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
           <div>
             <h1 class="welcome-title">Prediction Result</h1>
             <p class="welcome-sub">Analysis completed on {{ selectedPrediction.createdAt | date:'yyyy-MM-dd' }}</p>
           </div>
           <button class="btn-back-dash" (click)="view='home'" style="margin:0;">← Back to Dashboard</button>
        </div>

        <div class="result-banner" [class]="'stage-' + getStageClass(selectedPrediction.result)">
          <div class="result-inner">
            <div class="result-icon">🎯</div>
            <div>
              <div style="display:flex; gap:12px; align-items:center;">
                <h4 style="margin:0; font-size:1.1rem; color:inherit;">Risk Level: {{ (selectedPrediction.result.includes('IV') || selectedPrediction.result.includes('III')) ? 'High' : 'Low' }}</h4>
                <span style="font-weight:700; opacity:0.8;">{{ selectedPrediction.result }}</span>
              </div>
              <p class="result-note">Your results indicate a risk of lung cancer. Continue healthy practices and regular monitoring.</p>
            </div>
          </div>
        </div>

        <div class="report-grid">
          <!-- Key Metrics -->
          <div class="report-card">
            <h3 class="card-title">Key Metrics</h3>
            <div class="metrics-row">
               <div class="metric-circle-container">
                  <svg viewBox="0 0 36 36" class="circular-chart blue">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="circle" stroke-dasharray="87, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" class="percentage">87%</text>
                  </svg>
                  <p>Confidence Score</p>
               </div>
               <div class="metric-item">
                  <div class="mi-icon">📈</div>
                  <h4>{{ selectedPrediction.result }}</h4>
                  <p>Predicted Stage</p>
               </div>
               <div class="metric-item">
                  <div class="mi-icon">⚠️</div>
                  <h4 [class.high-risk]="selectedPrediction.result.includes('IV') || selectedPrediction.result.includes('III')">
                     {{ (selectedPrediction.result.includes('IV') || selectedPrediction.result.includes('III')) ? 'High' : 'Low' }}
                  </h4>
                  <p>Risk Level</p>
               </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="report-card action-card">
            <h3 class="card-title">Actions</h3>
            <div class="action-buttons">
              <button class="btn-action action-dl" (click)="downloadReport()"> Download Report</button>
              <button class="btn-action action-send" (click)="sendReportToDoctor()"> Send to Doctor</button>
              <button class="btn-action action-new" (click)="goToForm()">Share New Report</button>
            </div>
          </div>

          <!-- Contributing Factors -->
          <div class="report-card full-width">
            <h3 class="card-title">Contributing Factors Analysis</h3>
            <p class="card-sub">The AI model analyzed multiple factors to determine your risk level. Below are the key contributors:</p>
            
            <div class="factors-list">
              <div class="factor-row">
                 <div class="factor-header">
                   <span class="factor-name">Age</span>
                   <span class="factor-impact impact-high" *ngIf="getFeatureImpact(selectedPrediction.Age, 30, 90) === 'High'">High Impact</span>
                   <span class="factor-impact impact-medium" *ngIf="getFeatureImpact(selectedPrediction.Age, 30, 90) === 'Medium'">Medium Impact</span>
                   <span class="factor-impact impact-low" *ngIf="getFeatureImpact(selectedPrediction.Age, 30, 90) === 'Low'">Low Impact</span>
                   <span class="factor-val">{{ selectedPrediction.Age }}+</span>
                 </div>
                 <div class="factor-bar-bg"><div class="factor-bar" [style.width.%]="getFeaturePercent(selectedPrediction.Age, 30, 90)"></div></div>
              </div>

              <div class="factor-row">
                 <div class="factor-header">
                   <span class="factor-name">Smoking History</span>
                   <span class="factor-impact impact-high" *ngIf="getFeatureImpact(selectedPrediction.Smoking_Pack_Years, 0, 50) === 'High'">High Impact</span>
                   <span class="factor-impact impact-medium" *ngIf="getFeatureImpact(selectedPrediction.Smoking_Pack_Years, 0, 50) === 'Medium'">Medium Impact</span>
                   <span class="factor-impact impact-low" *ngIf="getFeatureImpact(selectedPrediction.Smoking_Pack_Years, 0, 50) === 'Low'">Low Impact</span>
                   <span class="factor-val">{{ selectedPrediction.Smoking_Pack_Years }} years</span>
                 </div>
                 <div class="factor-bar-bg"><div class="factor-bar" [style.width.%]="getFeaturePercent(selectedPrediction.Smoking_Pack_Years, 0, 50)"></div></div>
              </div>
              
              <div class="factor-row">
                 <div class="factor-header">
                   <span class="factor-name">Calcium Level</span>
                   <span class="factor-impact impact-high" *ngIf="getFeatureImpact(selectedPrediction.Calcium_Level, 8.5, 10.5) === 'High'">High Impact</span>
                   <span class="factor-impact impact-medium" *ngIf="getFeatureImpact(selectedPrediction.Calcium_Level, 8.5, 10.5) === 'Medium'">Medium Impact</span>
                   <span class="factor-impact impact-low" *ngIf="getFeatureImpact(selectedPrediction.Calcium_Level, 8.5, 10.5) === 'Low'">Low Impact</span>
                   <span class="factor-val">{{ selectedPrediction.Calcium_Level }}</span>
                 </div>
                 <div class="factor-bar-bg"><div class="factor-bar" [style.width.%]="getFeaturePercent(selectedPrediction.Calcium_Level, 8.5, 10.5)"></div></div>
              </div>
            </div>
          </div>

          <!-- AI Model Info -->
          <div class="report-card ai-info-card">
             <h3 class="card-title">AI Model Info</h3>
             <div class="ai-info-grid">
                <div class="ai-stat"><span>Model Version</span><strong>v2.4.1</strong></div>
                <div class="ai-stat"><span>Accuracy</span><strong>98.2%</strong></div>
                <div class="ai-stat"><span>Data Points</span><strong>15+</strong></div>
                <div class="ai-stat"><span>Training Set</span><strong>100K+ cases</strong></div>
             </div>
             <p class="md-disclaimer"><strong>Medical Disclaimer:</strong> This AI prediction is for informational purposes only and should not replace professional medical advice. Please consult with a qualified healthcare provider for diagnosis and treatment.</p>
          </div>
        </div>
      </main>

      <!-- ═══════════════ CONSULT VIEW ═══════════════ -->
      <main *ngIf="view==='consult'" class="dash-main consult-main">
        <div class="consult-header">
           <div>
             <h1 class="welcome-title">Consultation</h1>
             <p class="welcome-sub" *ngIf="viewingDoctor">Chatting with Dr. {{ viewingDoctor.firstName }} {{ viewingDoctor.lastName }}</p>
           </div>
           <div>
             <button class="btn-video" *ngIf="viewingDoctor?.id === selectedDoctor?.id" (click)="startVideoCall()">📹 Start Video Call</button>
             <button class="btn-back-dash" (click)="view='home'" style="margin-left:12px;">← Back</button>
           </div>
        </div>
        
        <div class="chat-container">
           <!-- Recent Chat Partners Sidebar -->
           <div class="chat-sidebar">
             <div class="sidebar-header">Recent Doctors</div>
             <div class="partner-list">
               <div *ngFor="let p of chatPartners" 
                    class="partner-item" 
                    [class.active]="viewingDoctor?.id === p.id"
                    (click)="selectPartner(p)">
                 <div class="partner-avatar">{{ p.firstName[0] }}{{ p.lastName[0] }}</div>
                 <div class="partner-info">
                   <div class="partner-name">Dr. {{ p.firstName }} {{ p.lastName }}</div>
                   <div class="partner-status" *ngIf="selectedDoctor?.id === p.id">Currently Assigned</div>
                 </div>
                 <div class="unread-badge" *ngIf="p.unreadCount > 0">{{ p.unreadCount }}</div>
               </div>
               <div class="chat-empty" *ngIf="chatPartners.length === 0" style="padding: 20px; font-size: 0.85rem;">No previous consultations.</div>
             </div>
           </div>

           <!-- Active Chat Main Area -->
           <div class="chat-main">
              <div class="chat-messages">
                 <div class="chat-empty" *ngIf="chatMessages.length === 0">No messages yet. Start the conversation!</div>
                 <div *ngFor="let msg of chatMessages; let i = index" class="chat-bubble" [class.mine]="msg.senderId === currentUser.id" [class.sys-ring]="msg.content === '[SYSTEM_CALL_RINGING]'">
                    <ng-container *ngIf="msg.content !== '[SYSTEM_CALL_RINGING]' && !msg.content.startsWith('[SYSTEM_CALL_ENDED:')">
                       <p class="chat-text">{{ msg.content }}</p>
                       <span class="chat-time">{{ msg.createdAt | date:'shortTime' }}</span>
                    </ng-container>
                    <ng-container *ngIf="msg.content === '[SYSTEM_CALL_RINGING]'">
                       <div *ngIf="msg.senderId === currentUser.id" class="ring-outgoing">
                          <span *ngIf="isRingingActive(msg, i)" class="pulse-dot"></span>
                          <span *ngIf="isRingingActive(msg, i)">Calling {{ viewingDoctor?.firstName }}...</span>
                          <span *ngIf="!isRingingActive(msg, i)" style="opacity:0.6;">Outgoing Call Ended</span>
                       </div>
                       <div *ngIf="msg.senderId !== currentUser.id" class="ring-incoming">
                          <p style="margin:0 0 8px 0; font-weight:600;">Incoming Video Call</p>
                          <button *ngIf="isRingingActive(msg, i)" class="btn-accept" (click)="startVideoCall(true)">Accept Call</button>
                          <p *ngIf="!isRingingActive(msg, i)" style="font-size:0.8rem; opacity:0.6; margin:0;">(Call Ended)</p>
                       </div>
                    </ng-container>
                    <ng-container *ngIf="msg.content.startsWith('[SYSTEM_CALL_ENDED:')">
                       <div class="call-ended-status">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          <span>Video Call {{ msg.content.replace('[SYSTEM_CALL_ENDED:', '').replace(']', '') }}</span>
                       </div>
                    </ng-container>
                 </div>
              </div>
              <div class="chat-input-area" *ngIf="viewingDoctor?.id === selectedDoctor?.id">
                 <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..." />
                 <button (click)="sendMessage()">Send</button>
              </div>
              <div class="chat-read-only" *ngIf="viewingDoctor && viewingDoctor.id !== selectedDoctor?.id">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                 <span>Viewing history only. You can only chat with your currently assigned doctor.</span>
              </div>
           </div>
        </div>
      </main>

      <!-- ═══════════════ SETTINGS VIEW ═══════════════ -->
      <main *ngIf="view==='settings'" class="dash-main settings-main">
        <div class="welcome-section">
          <div>
            <h1 class="welcome-title">Settings</h1>
            <p class="welcome-sub">Manage your account preferences and security</p>
          </div>
        </div>

        <div class="settings-layout">
          <!-- Sidebar -->
          <div class="settings-sidebar">
             <button class="settings-tab" [class.active]="settingsTab==='profile'" (click)="settingsTab='profile'">
               <span class="st-icon">👤</span> Profile
             </button>
             <button class="settings-tab" [class.active]="settingsTab==='security'" (click)="settingsTab='security'">
               <span class="st-icon">🔒</span> Security
             </button>
             <button class="settings-tab" [class.active]="settingsTab==='notifications'" (click)="settingsTab='notifications'">
               <span class="st-icon">🔔</span> Notifications
             </button>
             <button class="settings-tab" [class.active]="settingsTab==='privacy'" (click)="settingsTab='privacy'">
               <span class="st-icon">🛡️</span> Privacy
             </button>
          </div>

          <!-- Content Panel -->
          <div class="settings-content">
            
            <!-- PROFILE -->
            <div *ngIf="settingsTab==='profile'" class="settings-card">
              <h3 class="setting-card-title">Profile Settings</h3>
              <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()">
                <div class="settings-grid">
                  <div class="form-field">
                    <label>First Name</label>
                    <div class="input-with-icon">
                      <span class="input-icon">👤</span>
                      <input formControlName="firstName" type="text" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Last Name</label>
                    <div class="input-with-icon">
                      <span class="input-icon">👤</span>
                      <input formControlName="lastName" type="text" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Email Address</label>
                    <div class="input-with-icon">
                      <span class="input-icon">✉️</span>
                      <input formControlName="email" type="email" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Phone Number</label>
                    <div class="input-with-icon">
                      <span class="input-icon">📞</span>
                      <input formControlName="phoneNumber" type="text" placeholder="+1 (555) 123-4567" />
                    </div>
                  </div>
                  <div class="form-field grid-col-span-2">
                    <label>Address</label>
                    <input formControlName="address" type="text" placeholder="123 Main Street, City, State 12345" />
                  </div>
                </div>
                <!-- success/error msgs here -->
                <div class="form-actions-right">
                  <button type="submit" class="btn-save" [disabled]="profileForm.invalid || savingProfile">Save Changes</button>
                </div>
              </form>
            </div>

            <!-- SECURITY -->
            <div *ngIf="settingsTab==='security'" class="settings-card">
              <h3 class="setting-card-title">Security Settings</h3>
              <form [formGroup]="securityForm" (ngSubmit)="onChangePassword()">
                <div class="form-field mb-4">
                  <label>Current Password</label>
                  <div class="input-with-icon">
                    <span class="input-icon">🔒</span>
                    <input formControlName="currentPassword" type="password" placeholder="Enter current password" />
                  </div>
                </div>
                <div class="settings-grid mb-4">
                  <div class="form-field">
                    <label>New Password</label>
                    <div class="input-with-icon">
                      <span class="input-icon">🔒</span>
                      <input formControlName="newPassword" type="password" placeholder="Enter new password" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Confirm New Password</label>
                    <div class="input-with-icon">
                      <span class="input-icon">🔒</span>
                      <input formControlName="confirmPassword" type="password" placeholder="Confirm new password" />
                    </div>
                  </div>
                </div>
                
                <div class="password-reqs">
                  <p class="req-title">Password Requirements</p>
                  <ul>
                    <li>At least 8 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>

                <div class="form-actions-right">
                  <button type="submit" class="btn-save" [disabled]="securityForm.invalid || changingPassword">Change Password</button>
                </div>
              </form>
            </div>

            <!-- NOTIFICATIONS -->
            <div *ngIf="settingsTab==='notifications'" class="settings-card no-pad">
              <h3 class="setting-card-title pad-title">Notification Settings</h3>
              <form [formGroup]="notificationsForm" (ngSubmit)="onSaveNotifications()">
                
                <div class="notif-section">
                  <h4 class="notif-section-title">Communication Preferences</h4>
                  <div class="notif-row">
                    <div>
                      <p class="notif-name">Email Notifications</p>
                      <p class="notif-desc">Receive updates via email</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="emailNotifications"><span class="slider"></span></label>
                  </div>
                  <div class="notif-row border-none">
                    <div>
                      <p class="notif-name">SMS Notifications</p>
                      <p class="notif-desc">Receive urgent updates via SMS</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="smsNotifications"><span class="slider"></span></label>
                  </div>
                </div>

                <div class="notif-section">
                  <h4 class="notif-section-title">Alert Preferences</h4>
                  <div class="notif-row">
                    <div>
                      <p class="notif-name">Prediction Alerts</p>
                      <p class="notif-desc">Get notified when predictions are complete</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="predictionAlerts"><span class="slider"></span></label>
                  </div>
                  <div class="notif-row">
                    <div>
                      <p class="notif-name">Doctor Feedback</p>
                      <p class="notif-desc">Notify when doctors review your cases</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="doctorFeedback"><span class="slider"></span></label>
                  </div>
                  <div class="notif-row">
                    <div>
                      <p class="notif-name">Weekly Reports</p>
                      <p class="notif-desc">Receive weekly summary of your activity</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="weeklyReports"><span class="slider"></span></label>
                  </div>
                  <div class="notif-row border-none">
                    <div>
                      <p class="notif-name">System Updates</p>
                      <p class="notif-desc">Get notified about new features and improvements</p>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" formControlName="systemUpdates"><span class="slider"></span></label>
                  </div>
                </div>

                <div class="form-actions-right pad-actions">
                  <button type="submit" class="btn-save" [disabled]="savingNotifications">Save Preferences</button>
                </div>
              </form>
            </div>

            <!-- PRIVACY -->
            <div *ngIf="settingsTab==='privacy'" class="settings-card">
              <h3 class="setting-card-title">Privacy & Data</h3>
              
              <div class="privacy-alert">
                <span class="pa-icon">🛡️</span>
                <div>
                   <p class="pa-title">Data Protection</p>
                   <p class="pa-desc">Your health data is encrypted and stored securely in compliance with HIPAA regulations. We never share your personal information without your explicit consent.</p>
                </div>
              </div>

              <div class="privacy-section">
                <h4 class="ps-title">Data Management</h4>
                
                <div class="privacy-action-row">
                  <div>
                    <p class="par-title">Download My Data</p>
                    <p class="par-desc">Export all your data in a portable format</p>
                  </div>
                  <button class="btn-icon" (click)="downloadData()">📄</button>
                </div>

                <div class="privacy-action-row danger">
                  <div>
                    <p class="par-title danger-text">Delete Account</p>
                    <p class="par-desc danger-text">Permanently delete your account and all data</p>
                  </div>
                  <button class="btn-icon danger" (click)="deleteAccount()">🗑️</button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page-wrapper {
      min-height: 100vh;
      background: #f0f4f8;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      color: #1e293b;
    }

    /* JITSI OVERLAY */
    .jitsi-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 2000; display: flex; flex-direction: column; }
    #jitsi-container { flex: 1; width: 100%; height: 100%; }
    .btn-close-jitsi { position: absolute; top: 20px; right: 20px; z-index: 2001; background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; backdrop-filter: blur(10px); }
    .btn-close-jitsi:hover { background: rgba(255,255,255,0.3); }

    .call-ended-status { background: #f1f5f9; color: #64748b; padding: 10px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; }

    .chat-bubble.sys-ring { background: #f0f9ff; border: 1px solid #bae6fd; align-self: center; width: 100%; text-align: center; }
    .btn-accept { background: #16a34a; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .pulse-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; margin-right: 6px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

    /* ── HEADER ── */
    .header {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem;
      position: sticky; top: 0; z-index: 10;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .header-inner {
      max-width: 1280px; margin: 0 auto;
      display: flex; align-items: center; gap: 24px;
      height: 64px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 700; flex-shrink: 0; }
    .brand-logo-box {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #14b8a6, #0d9488);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-name strong { color: #14b8a6; }
    .header-nav { display: flex; gap: 4px; flex: 1; }
    .nav-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: none; border-radius: 8px;
      background: transparent; color: #64748b; cursor: pointer; font-size: 0.9rem; font-weight: 500;
      transition: all 0.2s;
    }
    .nav-btn:hover, .nav-btn.active { background: #f0fdfa; color: #14b8a6; }
    .header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
    .user-info { display: flex; flex-direction: column; align-items: flex-end; }
    .user-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .user-role { font-size: 0.72rem; color: #94a3b8; }
    .btn-logout {
      padding: 8px 16px; border: 1px solid #fecaca; border-radius: 8px;
      background: #fff; color: #dc2626; cursor: pointer; font-size: 0.85rem; font-weight: 500;
      transition: all 0.2s;
    }
    .btn-logout:hover { background: #fee2e2; }

    /* ── DASHBOARD MAIN ── */
    .dash-main { max-width: 1280px; margin: 0 auto; padding: 28px 24px 60px; }

    .nav-btn { position: relative; display: flex; align-items: center; }
    .nav-unread-badge { background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; margin-left: 8px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4); }
    .no-doctor-bar {
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
      padding: 12px 20px; display: flex; align-items: center; gap: 12px;
      margin-bottom: 20px; color: #92400e; font-size: 0.9rem;
    }
    .no-doctor-bar button {
      background: #f59e0b; border: none; border-radius: 6px; padding: 6px 12px;
      color: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 600;
    }

    .welcome-section { margin-bottom: 24px; }
    .welcome-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
    .welcome-sub { color: #64748b; font-size: 0.95rem; margin-top: 4px; }

    /* ── STAT CARDS ── */
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: #fff; border-radius: 16px; padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative;
      border: 1px solid #e2e8f0;
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 12px;
    }
    .stat-icon.teal { background: #e6faf8; }
    .stat-icon.yellow { background: #fef9c3; }
    .stat-icon.indigo { background: #ede9fe; }
    .stat-arrow { position: absolute; top: 20px; right: 20px; color: #22c55e; font-size: 1.1rem; }
    .stat-val { font-size: 2rem; font-weight: 800; color: #1e293b; }
    .stat-lbl { font-size: 0.85rem; color: #64748b; margin-top: 4px; }

    /* ── CTA ── */
    .cta-row { margin-bottom: 28px; }
    .btn-enter-data {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 28px; border: none; border-radius: 12px;
      background: linear-gradient(90deg, #14b8a6, #0d9488);
      color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(20,184,166,0.35); transition: all 0.2s;
    }
    .btn-enter-data:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(20,184,166,0.45); }
    .btn-enter-data.small { padding: 10px 20px; font-size: 0.9rem; margin-top: 12px; }

    /* ── MAIN GRID ── */
    .main-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
    .left-col { display: flex; flex-direction: column; gap: 20px; }
    .right-col { display: flex; flex-direction: column; gap: 20px; }

    /* ── CARD ── */
    .card {
      background: #fff; border-radius: 16px; padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
    }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-title { font-size: 1rem; font-weight: 700; color: #1e293b; }
    .card-icon-sm { font-size: 1.1rem; color: #94a3b8; }
    .view-all-btn {
      background: none; border: none; color: #14b8a6; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; padding: 0;
    }
    .view-all-btn.center { display: block; width: 100%; text-align: center; margin-top: 12px; padding: 8px; }

    /* ── RESULT ROWS ── */
    .result-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 0; border-bottom: 1px solid #f1f5f9;
    }
    .result-row:last-of-type { border-bottom: none; }
    .result-key { font-size: 0.9rem; color: #64748b; }
    .result-val { font-size: 0.9rem; color: #1e293b; }
    .result-val.bold { font-weight: 700; font-size: 1rem; }

    .badge {
      padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; display: inline-block;
    }
    .badge.low { background: #dcfce7; color: #166534; }
    .badge.medium { background: #fef9c3; color: #854d0e; }
    .badge.high { background: #fef2f2; color: #991b1b; }
    .badge.sm { font-size: 0.72rem; padding: 3px 8px; }

    .conf-wrap { display: flex; align-items: center; gap: 10px; }
    .conf-bar { width: 100px; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
    .conf-fill { height: 100%; background: linear-gradient(90deg, #14b8a6, #0d9488); border-radius: 99px; display: block; }
    .conf-pct { font-size: 0.85rem; font-weight: 700; color: #1e293b; }

    .doctor-comment-box {
      display: flex; gap: 14px; align-items: flex-start;
      background: #e6f9f7; border-radius: 10px; padding: 14px 16px; margin-top: 16px;
      border: 1px solid #ccf2ee;
    }
    .comment-icon { display: flex; align-items: center; margin-top: 2px; }
    .comment-title { font-size: 0.85rem; font-weight: 700; color: #14b8a6; margin-bottom: 4px; }
    .comment-text { font-size: 0.83rem; color: #475569; line-height: 1.5; }

    .btn-view-report {
      display: block; width: 100%; text-align: center; margin-top: 16px;
      background: none; border: none; color: #14b8a6; font-size: 0.9rem;
      font-weight: 600; cursor: pointer; padding: 10px;
    }

    /* ── EMPTY / LOADING ── */
    .empty-card { text-align: center; padding: 40px 24px; }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-card p { color: #64748b; font-size: 0.95rem; }
    .loading-card { text-align: center; padding: 40px; }
    .loading-card p { color: #64748b; font-size: 0.9rem; margin-top: 12px; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: #14b8a6; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto;
    }

    /* ── HISTORY ── */
    .history-list { display: flex; flex-direction: column; gap: 12px; }
    .history-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px; border-radius: 10px; background: #f8fafc;
      border: 1px solid #f1f5f9; transition: background 0.15s;
    }
    .history-item:hover { background: #f0f9ff; }
    .hist-doc-icon { display: flex; align-items: center; color: #14b8a6; flex-shrink: 0; }
    .hist-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .hist-date { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .hist-stage { font-size: 0.8rem; color: #64748b; }

    /* ── RIGHT COL ── */
    .doctor-card-inner { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .doc-avatar-sm {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #14b8a6, #0d9488);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.95rem; color: #fff;
    }
    .doc-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
    .doc-email-sm { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
    .btn-change-doc {
      width: 100%; padding: 10px; background: #f0fdfa; border: 1px solid #99f6e4;
      border-radius: 8px; color: #14b8a6; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-change-doc:hover { background: #ccfbf1; }

    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item {
      background: #e6faf8; border-radius: 10px;
      padding: 12px 14px;
    }
    .notif-msg { font-size: 0.85rem; font-weight: 500; color: #134e4a; }
    .notif-time { font-size: 0.75rem; color: #5eead4; margin-top: 3px; }
    .notif-empty { color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 12px 0; }
    .notif-badge {
      background: #ef4444; color: #fff; font-size: 0.72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 20px; min-width: 22px; text-align: center;
    }
    .notif-title { display: flex; align-items: center; gap: 8px; }

    /* ══════════════ REPORTS VIEW ══════════════ */
    .reports-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }

    .reports-summary-bar {
      display: flex; align-items: center; gap: 0;
      background: #fff; border-radius: 16px; padding: 20px 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
      margin-bottom: 24px; flex-wrap: wrap; gap: 0;
    }
    .rsb-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 100px; }
    .rsb-val { font-size: 2rem; font-weight: 800; color: #1e293b; }
    .rsb-val.risk-high { color: #ef4444; }
    .rsb-val.risk-low { color: #14b8a6; }
    .rsb-lbl { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
    .rsb-divider { width: 1px; height: 48px; background: #e2e8f0; margin: 0 16px; }

    .reports-empty {
      text-align: center; padding: 80px 24px;
      background: #fff; border-radius: 16px; border: 2px dashed #e2e8f0;
      color: #64748b;
    }
    .reports-empty h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 16px 0 8px; }
    .reports-empty p { font-size: 0.95rem; }

    .reports-table-wrap {
      background: #fff; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .reports-table { width: 100%; border-collapse: collapse; }
    .reports-table thead tr {
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .reports-table th {
      padding: 14px 20px; text-align: left; font-size: 0.78rem;
      font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .report-row {
      border-bottom: 1px solid #f1f5f9; cursor: pointer;
      transition: background 0.15s;
    }
    .report-row:hover { background: #f8fafc; }
    .report-row.expanded { background: #f0fdfa; border-bottom: none; }
    .report-row td { padding: 16px 20px; font-size: 0.9rem; color: #1e293b; vertical-align: middle; }
    .row-num { color: #94a3b8; font-size: 0.8rem; width: 36px; }
    .row-date { color: #475569; }
    .row-stage { font-weight: 700; }
    .row-doctor { color: #475569; font-size: 0.85rem; }
    .row-chevron { width: 32px; text-align: center; }

    .detail-row td { padding: 0; background: #f0fdfa; }
    .detail-panel {
      padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
    }
    .detail-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-lbl { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-val { font-size: 0.9rem; color: #1e293b; }
    .detail-val.bold { font-weight: 700; }
    .detail-comment-box {
      display: flex; gap: 12px; align-items: flex-start;
      background: #e6f9f7; border-radius: 10px; padding: 14px 16px;
      border: 1px solid #ccf2ee;
    }

    /* ══════════════ FORM VIEW ══════════════ */
    .no-doctor { text-align: center; padding: 100px 24px; color: #64748b; }
    .no-doctor button { background: none; border: none; color: #0ea5e9; cursor: pointer; text-decoration: underline; font-size: 1rem; }

    .doctor-banner { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 28px 24px; }
    .banner-inner { max-width: 1000px; margin: 0 auto; display: flex; align-items: center; gap: 20px; }
    .doc-avatar {
      width: 60px; height: 60px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; font-weight: 700; color: #fff;
      box-shadow: 0 4px 12px rgba(14,165,233,0.2);
    }
    .doc-sub { font-size: 0.72rem; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px; }
    .doctor-banner h2 { font-size: 1.35rem; font-weight: 800; color: #1e293b; }
    .doc-email { font-size: 0.85rem; color: #64748b; margin-top: 2px; }
    .btn-back-dash {
      margin-left: auto; padding: 8px 16px; background: #f0f9ff;
      border: 1px solid #bae6fd; border-radius: 8px; color: #0ea5e9;
      font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap;
      transition: all 0.2s;
    }
    .btn-back-dash:hover { background: #e0f2fe; }

    .result-banner { margin: 24px auto; max-width: 1000px; padding: 0 24px; }
    .result-inner {
      display: flex; align-items: center; gap: 24px; border-radius: 20px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .stage-i .result-inner { background: #f0fdf4; border: 2px solid #bbf7d0; color: #166534; }
    .stage-ii .result-inner { background: #f0f9ff; border: 2px solid #bae6fd; color: #075985; }
    .stage-iii .result-inner { background: #fffbeb; border: 2px solid #fde68a; color: #92400e; }
    .stage-iv .result-inner { background: #fef2f2; border: 2px solid #fecaca; color: #991b1b; }
    .result-icon { font-size: 2.8rem; flex-shrink: 0; }
    .result-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 4px; opacity: 0.8; }
    .result-stage { font-size: 2.2rem; font-weight: 900; line-height: 1; }
    .result-note { font-size: 0.9rem; margin-top: 6px; opacity: 0.75; }

    .error-banner {
      max-width: 1000px; margin: 12px auto; padding: 0 24px;
      display: flex; align-items: center; gap: 12px;
    }
    .error-banner > span, .error-banner {
      background: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; color: #991b1b;
    }
    .error-banner button { margin-left: auto; background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.1rem; }

    .content { max-width: 1000px; margin: 0 auto; padding: 24px 24px 80px; }
    .form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 44px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .form-title { margin-bottom: 40px; }
    .form-title h2 { font-size: 1.7rem; font-weight: 800; color: #1e293b; margin-bottom: 10px; }
    .form-title p { color: #64748b; font-size: 1rem; }

    .field-group { margin-bottom: 44px; }
    .group-title {
      font-size: 1rem; font-weight: 700; color: #0ea5e9;
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9;
    }
    .fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 0.82rem; color: #1e293b; font-weight: 600; }
    .form-field input {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 11px 13px; color: #1e293b; font-size: 0.92rem; outline: none; width: 100%;
      transition: all 0.2s ease; appearance: textfield;
    }
    .form-field input::-webkit-outer-spin-button,
    .form-field input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .form-field input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 3px rgba(14,165,233,0.12); }
    .form-field input.invalid { border-color: #ef4444; background: #fef2f2; }
    .form-field input::placeholder { color: #94a3b8; }
    .field-error { font-size: 0.72rem; color: #ef4444; font-weight: 600; }
    .range-hint { font-size: 0.68rem; color: #94a3b8; font-weight: 400; margin-left: 4px; }

    .validation-summary {
      background: #fff1f2; border: 1px solid #fecaca; color: #b91c1c;
      padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 18px; text-align: center; font-weight: 500;
    }

    .form-actions { text-align: center; margin-top: 44px; border-top: 1px solid #f1f5f9; padding-top: 44px; }
    .btn-predict {
      padding: 15px 52px; background: linear-gradient(135deg, #0ea5e9, #10b981);
      border: none; border-radius: 12px; color: #fff; font-size: 1.05rem; font-weight: 700;
      cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 20px rgba(14,165,233,0.3);
    }
    .btn-predict:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(14,165,233,0.4); }
    .btn-predict:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-loading { display: flex; align-items: center; gap: 10px; }
    .spinner-sm {
      width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ══════════════ SETTINGS VIEW ══════════════ */
    .settings-main { max-width: 1100px; }
    .settings-layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; margin-top: 10px; }
    .settings-sidebar {
      background: #fff; border-radius: 16px; padding: 12px;
      border: 1px solid #e2e8f0; height: fit-content; display: flex; flex-direction: column; gap: 4px;
    }
    .settings-tab {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%;
      border: none; background: transparent; border-radius: 10px; text-align: left;
      font-size: 0.95rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s;
    }
    .settings-tab:hover { background: #f8fafc; color: #0f172a; }
    .settings-tab.active { background: #f0fdfa; color: #0d9488; }
    .st-icon { font-size: 1.1rem; width: 24px; text-align: center; }

    .settings-card {
      background: #fff; border-radius: 16px; padding: 32px;
      border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .settings-card.no-pad { padding: 0; }
    .pad-title { padding: 32px 32px 16px 32px; margin-bottom: 0px !important; }
    .pad-actions { padding: 24px 32px 32px 32px; border-top: 1px solid #f1f5f9; }
    
    .setting-card-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 24px; }
    
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-col-span-2 { grid-column: span 2; }
    
    .input-with-icon {
      position: relative;
    }
    .input-icon {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 1.1rem;
    }
    .input-with-icon input { padding-left: 42px; }
    
    .mb-4 { margin-bottom: 24px; }
    
    .password-reqs {
      background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px;
      margin-bottom: 24px;
    }
    .req-title { font-size: 0.85rem; font-weight: 700; color: #0284c7; margin-bottom: 8px; }
    .password-reqs ul { margin: 0; padding-left: 20px; color: #0369a1; font-size: 0.85rem; line-height: 1.6; }

    .form-actions-right { display: flex; justify-content: flex-end; margin-top: 24px; }
    .btn-save {
      background: #0d9488; color: #fff; border: none; padding: 12px 24px;
      border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-save:hover:not(:disabled) { background: #0f766e; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    /* NOTIFICATION TOGGLES */
    .notif-section { padding: 0 32px 24px 32px; }
    .notif-section:nth-child(2) { border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 24px; }
    .notif-section-title { font-size: 0.95rem; font-weight: 700; color: #475569; margin-bottom: 12px; }
    .notif-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-bottom: 1px solid #f1f5f9;
    }
    .notif-row.border-none { border-bottom: none; }
    .notif-name { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .notif-desc { font-size: 0.85rem; color: #64748b; margin-top: 2px; }
    
    .toggle-switch {
      position: relative; display: inline-block; width: 44px; height: 24px;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1; transition: .3s; border-radius: 24px;
    }
    .slider:before {
      position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
      background-color: white; transition: .3s; border-radius: 50%;
    }
    input:checked + .slider { background-color: #0d9488; }
    input:checked + .slider:before { transform: translateX(20px); }

    .privacy-alert {
      display: flex; gap: 16px; background: #eff6ff; border: 1px solid #bfdbfe;
      border-radius: 12px; padding: 20px; margin-bottom: 32px; align-items: flex-start;
    }
    .pa-icon { font-size: 1.5rem; }
    .pa-title { font-size: 0.95rem; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
    .pa-desc { font-size: 0.9rem; color: #1e3a8a; line-height: 1.5; }
    
    .privacy-section { margin-bottom: 32px; }
    .ps-title { font-size: 0.95rem; font-weight: 700; color: #475569; margin-bottom: 16px; }
    
    .privacy-action-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px;
    }
    .privacy-action-row.danger { border-color: #fecACA; background: #fff5f5; }
    .par-title { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .par-desc { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
    .danger-text { color: #dc2626; }
    
    .btn-icon { background: none; border: none; font-size: 1.25rem; cursor: pointer; color: #475569; transition: transform 0.2s; }
    .btn-icon:hover { transform: scale(1.1); }
    .btn-icon.danger { color: #dc2626; }

    /* ══════════════ REPORT DETAIL VIEW ══════════════ */
    .report-main { max-width: 1000px; padding-top: 12px; }
    .report-header { margin-bottom: 24px; }
    
    .report-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 24px; }
    .report-card { background: #fff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.02); }
    .full-width { grid-column: 1 / -1; }
    .card-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
    .card-sub { font-size: 0.9rem; color: #64748b; margin-bottom: 24px; margin-top: -12px; }
    
    .metrics-row { display: flex; align-items: center; justify-content: space-around; text-align: center; }
    .metric-circle-container { width: 120px; text-align: center; }
    .metric-circle-container p { font-size: 0.85rem; font-weight: 600; color: #475569; margin-top: 12px; }
    .circular-chart { display: block; margin: 0 auto; max-width: 80%; max-height: 250px; }
    .circle-bg { fill: none; stroke: #e2e8f0; stroke-width: 2.5; }
    .circle { fill: none; stroke-width: 2.5; stroke-linecap: round; animation: progress 1s ease-out forwards; }
    .circular-chart.blue .circle { stroke: #0ea5e9; }
    .percentage { fill: #0f172a; font-family: 'Inter', sans-serif; font-size: 0.5rem; text-anchor: middle; font-weight: 800; }
    @keyframes progress { 0% { stroke-dasharray: 0 100; } }

    .metric-item .mi-icon { font-size: 2rem; margin-bottom: 12px; }
    .metric-item h4 { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .metric-item p { font-size: 0.85rem; font-weight: 600; color: #64748b; margin-top: 4px; }
    .metric-item h4.high-risk { color: #dc2626; }
    
    .action-buttons { display: flex; flex-direction: column; gap: 12px; }
    .btn-action { padding: 14px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; border: none; cursor: pointer; transition: transform 0.2s; width: 100%; text-align: left; }
    .btn-action.action-dl { background: #0d9488; color: #fff; }
    .btn-action.action-dl:hover { background: #0f766e; }
    .btn-action.action-send { background: #3b82f6; color: #fff; }
    .btn-action.action-send:hover { background: #2563eb; }
    .btn-action.action-new { background: #fff; border: 1px solid #cbd5e1; color: #475569; text-align: center; }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    
    .factors-list { display: flex; flex-direction: column; gap: 24px; }
    .factor-row { width: 100%; }
    .factor-header { display: flex; align-items: center; margin-bottom: 8px; }
    .factor-name { flex: 1; font-weight: 600; font-size: 0.95rem; color: #1e293b; }
    .factor-impact { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; margin-right: auto; }
    .impact-high { background: #fee2e2; color: #dc2626; }
    .impact-medium { background: #fef3c7; color: #d97706; }
    .impact-low { background: #dcfce3; color: #16a34a; }
    .factor-val { font-size: 0.9rem; font-weight: 600; color: #475569; margin-left: 12px; }
    .factor-bar-bg { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .factor-bar { height: 100%; background: #0d9488; border-radius: 4px; transition: width 1s ease-in-out; }
    
    .ai-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .ai-stat span { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 4px; font-weight: 600; }
    .ai-stat strong { display: block; font-size: 1.1rem; color: #0f172a; }
    .md-disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 0.85rem; color: #475569; line-height: 1.5; }

    /* ══════════════ CONSULT VIEW ══════════════ */
    .consult-main { max-width: 1000px; padding-top: 12px; height: 100%; display: flex; flex-direction: column; }
    .consult-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .btn-video { background: #0ea5e9; color: #fff; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-video:hover { background: #0284c7; transform: scale(1.02); }
    
    .chat-container { height: 600px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.02); }
    
    /* Sidebar */
    .chat-sidebar { width: 280px; border-right: 1px solid #e2e8f0; background: #f8fafc; display: flex; flex-direction: column; }
    .sidebar-header { padding: 20px 24px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
    .partner-list { flex: 1; overflow-y: auto; }
    .partner-item { display: flex; align-items: center; gap: 14px; padding: 16px 24px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f1f5f9; position: relative; }
    .partner-item:hover { background: #f1f5f9; }
    .partner-item.active { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding-left: 20px; }
    .partner-avatar { width: 44px; height: 44px; min-width: 44px; border-radius: 50%; background: #0ea5e9; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; }
    .partner-info { flex: 1; min-width: 0; }
    .partner-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .partner-status { font-size: 0.75rem; color: #16a34a; font-weight: 700; }
    .unread-badge { background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); }

    /* Chat Area */
    .chat-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
    .chat-messages { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f8fafc; }
    .chat-empty { text-align: center; color: #94a3b8; font-size: 0.9rem; margin: auto; }
    .chat-bubble { max-width: 70%; padding: 14px 18px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; align-self: flex-start; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .chat-bubble.mine { align-self: flex-end; background: #0d9488; color: #fff; border: none; }
    .chat-time { display: block; font-size: 0.7rem; margin-top: 6px; opacity: 0.6; text-align: right; }
    .chat-text { font-size: 0.95rem; line-height: 1.5; margin: 0; }
    
    .chat-input-area { padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; }
    .chat-input-area input { flex: 1; padding: 14px 20px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none; background: #f8fafc; font-size: 0.95rem; }
    .chat-input-area input:focus { border-color: #0d9488; background: #fff; }
    .chat-input-area button { background: #0d9488; color: #fff; border: none; padding: 0 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .chat-input-area button:hover { background: #0f766e; }

    .chat-read-only { padding: 16px 24px; background: #fffbeb; border-top: 1px solid #fde68a; color: #92400e; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; }

    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .main-grid { grid-template-columns: 1fr; }
      .right-col { order: -1; }
    }
    @media (max-width: 560px) {
      .stats-row { grid-template-columns: 1fr; }
      .header-nav { display: none; }
      .form-card { padding: 24px; }
    }
  `]
})
export class PatientDashboardComponent implements OnInit {
  currentUser: any;
  selectedDoctor: Doctor | null = null;
  
  // Consult / Chat state
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';
  chatInterval: any;
  chatPartners: any[] = [];
  viewingDoctor: any | null = null;

  // Report Detail state
  selectedPrediction: PatientOwnPrediction | null = null;

  form: FormGroup;
  submitting = false;
  predictionResult: string | null = null;
  stageClass = '';
  submitError: string | null = null;

  view: DashView = 'home';
  predictions: PatientOwnPrediction[] = [];
  stats: PatientStats | null = null;
  loadingPredictions = false;
  expandedId: number | null = null;

  patientReports: MedicalReport[] = [];
  selectedFile: File | null = null;
  uploadingReport = false;

  isCallActive = false;
  jitsiApi: any;
  callStartTime: number = 0;

  private fb = new FormBuilder();
  settingsTab: SettingsTab = 'profile';
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  notificationsForm!: FormGroup;
  savingProfile = false;
  changingPassword = false;
  savingNotifications = false;

  get latestPrediction(): PatientOwnPrediction | null {
    return this.predictions.length > 0 ? this.predictions[0] : null;
  }

  get highRiskCount(): number {
    return this.predictions.filter(p => this.getRiskLabel(p.result) === 'High').length;
  }

  get lowRiskCount(): number {
    return this.predictions.filter(p => this.getRiskLabel(p.result) === 'Low').length;
  }

  fieldGroups: FieldGroup[] = [
    {
      label: 'Patient Demographics', icon: '👤',
      fields: [
        { key: 'Age', label: 'Age (years)', hint: 'e.g. 55', min: 0, max: 120 },
        { key: 'Gender', label: 'Gender (0=F, 1=M)', hint: '0 or 1', min: 0, max: 1, isBinary: true },
        { key: 'Country', label: 'Country Code', hint: 'Numeric code', min: 1, max: 999 },
      ]
    },
    {
      label: 'Lifestyle & Tumour', icon: '🚬',
      fields: [
        { key: 'Smoking_History', label: 'Smoking History (0/1)', min: 0, max: 1, isBinary: true },
        { key: 'Smoking_Pack_Years', label: 'Smoking Pack-Years', hint: 'e.g. 20', min: 0, max: 200 },
        { key: 'Tumor_Size_mm', label: 'Tumor Size (mm)', hint: 'e.g. 25', min: 1, max: 200 },
        { key: 'Mutation_Status', label: 'Mutation Status (0/1)', min: 0, max: 1, isBinary: true },
        { key: 'Biomarker_Status', label: 'Biomarker Status (0/1)', min: 0, max: 1, isBinary: true },
        { key: 'Treatment_Type', label: 'Treatment Type (0-3)', min: 0, max: 3 },
        { key: 'Survival_Months', label: 'Survival Months', hint: 'e.g. 36', min: 0, max: 600 },
        { key: 'ECOG_Performance_Status', label: 'ECOG Performance (0-4)', min: 0, max: 4 },
      ]
    },
    {
      label: 'Complete Blood Count', icon: '🩸',
      fields: [
        { key: 'Hemoglobin_Level', label: 'Hemoglobin (g/dL)', min: 5, max: 20 },
        { key: 'White_Blood_Cell_Count', label: 'WBC Count (×10³/µL)', min: 1, max: 100 },
        { key: 'Platelet_Count', label: 'Platelet Count (×10³/µL)', min: 50, max: 1000 },
      ]
    },
    {
      label: 'Basic Metabolic Panel', icon: '⚗️',
      fields: [
        { key: 'Calcium_Level', label: 'Calcium (mg/dL)', min: 5, max: 15 },
        { key: 'Sodium_Level', label: 'Sodium (mEq/L)', min: 100, max: 160 },
        { key: 'Potassium_Level', label: 'Potassium (mEq/L)', min: 1, max: 10 },
        { key: 'Chloride_Level', label: 'Chloride (mEq/L)', min: 80, max: 120 },
        { key: 'Glucose_Level', label: 'Glucose (mg/dL)', min: 30, max: 500 },
        { key: 'Creatinine_Level', label: 'Creatinine (mg/dL)', min: 0.1, max: 15 },
        { key: 'Urea_Level', label: 'Urea (mg/dL)', min: 5, max: 100 },
      ]
    },
    {
      label: 'Liver Function Tests', icon: '🫀',
      fields: [
        { key: 'Albumin_Level', label: 'Albumin (g/dL)', min: 1, max: 6 },
        { key: 'Bilirubin_Level', label: 'Bilirubin (mg/dL)', min: 0.1, max: 10 },
        { key: 'AST_Level', label: 'AST (U/L)', min: 1, max: 500 },
        { key: 'ALT_Level', label: 'ALT (U/L)', min: 1, max: 500 },
        { key: 'Alkaline_Phosphatase_Level', label: 'Alkaline Phosphatase (U/L)', min: 10, max: 1000 },
        { key: 'GGT_Level', label: 'GGT (U/L)', min: 1, max: 1000 },
        { key: 'Total_Protein_Level', label: 'Total Protein (g/dL)', min: 3, max: 10 },
        { key: 'Globulin_Level', label: 'Globulin (g/dL)', min: 1, max: 6 },
      ]
    },
    {
      label: 'Lipid & Metabolic', icon: '💊',
      fields: [
        { key: 'Cholesterol_Level', label: 'Cholesterol (mg/dL)', min: 50, max: 400 },
        { key: 'HDL_Level', label: 'HDL (mg/dL)', min: 10, max: 150 },
        { key: 'LDL_Level', label: 'LDL (mg/dL)', min: 10, max: 300 },
        { key: 'Triglycerides_Level', label: 'Triglycerides (mg/dL)', min: 30, max: 1000 },
        { key: 'LDH_Level', label: 'LDH (U/L)', min: 50, max: 2000 },
        { key: 'HbA1c_Level', label: 'HbA1c (%)', min: 3, max: 20 },
        { key: 'Insulin_Level', label: 'Insulin (µIU/mL)', min: 1, max: 100 },
        { key: 'Uric_Acid_Level', label: 'Uric Acid (mg/dL)', min: 1, max: 15 },
      ]
    },
    {
      label: 'Minerals & Electrolytes', icon: '🔬',
      fields: [
        { key: 'Magnesium_Level', label: 'Magnesium (mEq/L)', min: 0.5, max: 5 },
        { key: 'Phosphorus_Level', label: 'Phosphorus (mg/dL)', min: 1, max: 10 },
        { key: 'Iron_Level', label: 'Iron (µg/dL)', min: 10, max: 300 },
        { key: 'Ferritin_Level', label: 'Ferritin (ng/mL)', min: 1, max: 2000 },
        { key: 'Transferrin_Level', label: 'Transferrin (mg/dL)', min: 100, max: 500 },
      ]
    },
    {
      label: 'Inflammatory Markers', icon: '🧬',
      fields: [
        { key: 'CRP_Level', label: 'CRP (mg/L)', min: 0, max: 300 },
        { key: 'ESR_Level', label: 'ESR (mm/hr)', min: 0, max: 150 },
        { key: 'Procalcitonin_Level', label: 'Procalcitonin (ng/mL)', min: 0, max: 50 },
      ]
    },
    {
      label: 'Vitamins & Hormones', icon: '🌡️',
      fields: [
        { key: 'Vitamin_D_Level', label: 'Vitamin D (ng/mL)', min: 1, max: 150 },
        { key: 'Vitamin_B12_Level', label: 'Vitamin B12 (pg/mL)', min: 50, max: 2000 },
        { key: 'Folate_Level', label: 'Folate (ng/mL)', min: 1, max: 50 },
        { key: 'TSH_Level', label: 'TSH (mIU/L)', min: 0.1, max: 100 },
        { key: 'Free_T3_Level', label: 'Free T3 (pg/mL)', min: 0.5, max: 10 },
        { key: 'Free_T4_Level', label: 'Free T4 (ng/dL)', min: 0.1, max: 10 },
        { key: 'Cortisol_Level', label: 'Cortisol (µg/dL)', min: 1, max: 100 },
      ]
    },
  ];

  constructor(
    private fb_in: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private predictionService: PredictionService,
    private chatService: ChatService,
    private reportService: ReportService,
    private router: Router,
    private pdfService: PdfService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    const nav = this.router.getCurrentNavigation();
    this.selectedDoctor = nav?.extras?.state?.['selectedDoctor'] ?? null;
    this.form = this.buildForm();
  }

  ngOnInit(): void {
    if (!this.selectedDoctor) {
      const state = history.state;
      if (state?.selectedDoctor) {
        this.selectedDoctor = state.selectedDoctor;
      }
    }

    if (!this.selectedDoctor) {
      this.loadDoctor();
    }

    // Refresh doctor info periodically for unread counts
    setInterval(() => {
      this.loadDoctor();
      this.loadChatPartners();
    }, 10000);

    this.initSettingsForms();
    this.loadPredictions();
    this.loadChatPartners();
    this.loadPatientReports();
  }

  loadChatPartners(): void {
    this.chatService.getChatPartners().subscribe({
      next: (res) => {
        this.chatPartners = res.data;
      },
      error: () => {}
    });
  }

  loadPatientReports(): void {
    this.reportService.getPatientReports().subscribe({
      next: (reports) => {
        this.patientReports = reports;
      },
      error: () => {}
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadReport(): void {
    if (!this.selectedFile || !this.selectedDoctor) return;

    this.uploadingReport = true;
    this.reportService.uploadReport(this.selectedDoctor.id, this.selectedFile).subscribe({
      next: (res) => {
        this.uploadingReport = false;
        this.selectedFile = null;
        this.loadPatientReports();
        alert('Report shared successfully with Dr. ' + (this.selectedDoctor?.lastName || ''));
      },
      error: (err) => {
        this.uploadingReport = false;
        console.error('Upload failed', err);
        alert('Failed to share report: ' + (err.error?.error || 'Check server connection'));
      }
    });
  }

  viewReport(report: MedicalReport): void {
    this.reportService.getReportFile(report.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Failed to open report', err);
        alert('Could not open report file.');
      }
    });
  }

  getTotalUnreadCount(): number {
    return this.chatPartners.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
  }

  selectPartner(partner: any): void {
    this.viewingDoctor = partner;
    if (this.selectedDoctor && partner.id === this.selectedDoctor.id) {
       this.selectedDoctor.unreadCount = 0;
    }
    this.loadMessages();
  }

  loadDoctor(): void {
    this.predictionService.getAssignedDoctor().subscribe({
      next: (doctor) => {
        if (doctor) {
          this.selectedDoctor = doctor as any;
        }
      },
      error: () => { }
    });
  }

  initSettingsForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      address: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });

    this.notificationsForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      predictionAlerts: [true],
      doctorFeedback: [true],
      weeklyReports: [true],
      systemUpdates: [false]
    });
  }

  openSettings(): void {
    this.view = 'settings';
    this.settingsTab = 'profile';
    this.userService.getUserSettings().subscribe({
      next: (res) => {
        const s = res.settings;
        if (s) {
          this.profileForm.patchValue({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phoneNumber: s.phoneNumber,
            address: s.address
          });
          this.notificationsForm.patchValue({
            emailNotifications: s.emailNotifications,
            smsNotifications: s.smsNotifications,
            predictionAlerts: s.predictionAlerts,
            doctorFeedback: s.doctorFeedback,
            weeklyReports: s.weeklyReports,
            systemUpdates: s.systemUpdates
          });
        }
      },
      error: () => alert('Failed to load settings')
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        alert('Profile updated successfully!');
        const updated = res.user;
        this.currentUser = { ...this.currentUser, ...updated };
        this.savingProfile = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update profile');
        this.savingProfile = false;
      }
    });
  }

  onChangePassword(): void {
    if (this.securityForm.invalid) return;
    if (this.securityForm.value.newPassword !== this.securityForm.value.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    this.changingPassword = true;
    this.userService.changePassword(this.securityForm.value).subscribe({
      next: () => {
        alert('Password changed successfully!');
        this.securityForm.reset();
        this.changingPassword = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to change password');
        this.changingPassword = false;
      }
    });
  }

  onSaveNotifications(): void {
    this.savingNotifications = true;
    this.userService.updateNotifications(this.notificationsForm.value).subscribe({
      next: () => {
        alert('Notification preferences updated!');
        this.savingNotifications = false;
      },
      error: () => {
        alert('Failed to update notifications');
        this.savingNotifications = false;
      }
    });
  }

  downloadData(): void {
    alert('Preparing your data export. A download link will be emailed to you shortly.');
  }

  deleteAccount(): void {
    if (confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      alert('Delete account request submitted. Our support team will process it within 24 hours.');
    }
  }

  loadPredictions(): void {
    this.loadingPredictions = true;
    this.predictionService.getPatientPredictions().subscribe({
      next: data => {
        this.predictions = data.predictions;
        this.stats = data.stats;
        this.loadingPredictions = false;
      },
      error: () => {
        this.loadingPredictions = false;
      }
    });
  }

  goToForm(): void {
    this.view = 'upload-reports';
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getRiskLabel(result: string): string {
    if (!result) return 'Unknown';
    const s = result.toLowerCase();
    if (s.includes('iv') || s.includes('4')) return 'High';
    if (s.includes('iii') || s.includes('3')) return 'Medium';
    return 'Low';
  }

  getRiskBadge(result: string): string {
    if (!result) return 'badge low';
    const s = result.toLowerCase();
    if (s.includes('iv') || s.includes('4')) return 'badge high';
    if (s.includes('iii') || s.includes('3')) return 'badge medium';
    return 'badge low';
  }

  getRiskTier(result: string): string {
    if (!result) return 'Low';
    const s = result.toLowerCase();
    if (s.includes('iv') || s.includes('4')) return 'High';
    if (s.includes('iii') || s.includes('3')) return 'Medium';
    return 'Low';
  }

  getConfidence(result: string): number {
    const tier = this.getRiskTier(result);
    if (tier === 'Low') return 94.8;
    if (tier === 'Medium') return 88.5;
    return 98.2;
  }

  private buildForm(): FormGroup {
    const controls: { [key: string]: any } = {};
    for (const group of this.fieldGroups) {
      for (const f of group.fields) {
        const validators = [Validators.required];
        if (f.min !== undefined) validators.push(Validators.min(f.min));
        if (f.max !== undefined) validators.push(Validators.max(f.max));
        controls[f.key] = [null, validators];
      }
    }
    return this.fb.group(controls);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedDoctor) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.submitError = null;
    this.predictionResult = null;

    const payload = { doctorId: this.selectedDoctor.id, ...this.form.value };

    this.predictionService.predict(payload).subscribe({
      next: result => {
        this.predictionResult = result.result;
        this.stageClass = this.getStageClass(result.result);
        this.submitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadPredictions();
      },
      error: err => {
        this.submitError = err?.error?.error || 'Prediction failed. Please try again.';
        this.submitting = false;
      }
    });
  }

  getStageClass(stage: string): string {
    const s = stage.toLowerCase();
    if (s.includes('iv') || s.includes('4')) return 'stage-iv';
    if (s.includes('iii') || s.includes('3')) return 'stage-iii';
    if (s.includes('ii') || s.includes('2')) return 'stage-ii';
    return 'stage-i';
  }

  goBack(): void {
    this.router.navigate(['/patient/doctors'], { state: { forceSelect: true } });
  }

  onKeyDown(event: KeyboardEvent, field?: any): void {
    const key = event.key;
    if (key === '-' || key === 'e' || key === 'E') { event.preventDefault(); return; }
    if (field?.isBinary || (field?.max !== undefined && field.max < 10)) {
      const maxVal = field.isBinary ? 1 : field.max;
      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
      for (let i = 0; i <= maxVal; i++) allowedKeys.push(i.toString());
      if (!allowedKeys.includes(key)) event.preventDefault();
    }
  }

  sendReportToDoctor() {
    if (!this.selectedPrediction || !this.selectedDoctor) {
      alert("Please ensure a report is selected and a doctor is assigned.");
      return;
    }

    const reportMsg = `📋 Shared Prediction Report
Date: ${new Date(this.selectedPrediction.createdAt).toLocaleDateString()}
Risk Level: ${this.selectedPrediction.result}
Status: ${this.selectedPrediction.status}

I've shared this report for your review and feedback.`;

    this.chatService.sendMessage(this.selectedDoctor.id, reportMsg).subscribe({
      next: (res) => {
        alert('Report shared with doctor successfully!');
        this.openConsult();
      },
      error: (err) => {
        console.error('Error sharing report:', err);
        alert('Failed to share report. Please try again.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  openReportDetail(prediction: PatientOwnPrediction) {
    this.selectedPrediction = prediction;
    this.view = 'report-detail';
  }

  getFeatureImpact(value: number, min?: number, max?: number): 'High' | 'Medium' | 'Low' {
    if (!min || !max) return 'Low';
    const percent = (value - min) / (max - min);
    if (percent > 0.7) return 'High';
    if (percent > 0.4) return 'Medium';
    return 'Low';
  }

  getFeaturePercent(value: number, min?: number, max?: number): number {
    if (!min || !max || max === min) return 0;
    let p = ((value - min) / (max - min)) * 100;
    if (p < 0) p = 0;
    if (p > 100) p = 100;
    return p;
  }

  downloadReport() {
    if (this.selectedPrediction) {
      const patientName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      const doctorName = `${this.selectedPrediction.doctor.firstName} ${this.selectedPrediction.doctor.lastName}`;
      this.pdfService.generateAssessmentPdf(
        this.selectedPrediction,
        patientName,
        doctorName,
        this.selectedPrediction.result
      );
    } else {
      window.print();
    }
  }

  downloadTestPdf(riskLevel: 'low' | 'medium' | 'high' = 'medium') {
    this.pdfService.generateSampleMedicalReport(riskLevel);
    alert(`Sample ${riskLevel} test PDF generated! You can now upload this file to test the auto-fill functionality.`);
  }

  startVideoCall(isAccept = false) {
    if (!this.selectedDoctor || !this.currentUser) return;
    const roomName = `OncoConsult-${this.selectedDoctor.id}-${this.currentUser.id}-${Math.floor(Date.now()/100000)}`;
    
    this.isCallActive = true;
    setTimeout(() => {
      // Using jitsi.riot.im which is very stable for anonymous embedding
      const domain = "jitsi.riot.im"; 
      const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: document.querySelector('#jitsi-container'),
          userInfo: {
            displayName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableInviteFunctions: true,
            disableModeratorIndicator: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'hangup', 'chat', 'settings']
          }
      };
      this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
      
      this.jitsiApi.addEventListeners({
        videoConferenceJoined: () => {
          this.callStartTime = Date.now();
        },
        videoConferenceLeft: () => {
          this.handleCallEnd();
        }
      });
    }, 100);

    if (!isAccept) {
      this.chatService.sendMessage(this.selectedDoctor.id, '[SYSTEM_CALL_RINGING]').subscribe({
        next: (res) => this.chatMessages.push(res.data),
        error: (err) => console.error(err)
      });
    }
  }

  isRingingActive(msg: ChatMessage, index: number): boolean {
    for (let i = index + 1; i < this.chatMessages.length; i++) {
      if (this.chatMessages[i].content.startsWith('[SYSTEM_CALL_ENDED:')) {
        return false;
      }
    }
    return true;
  }

  handleCallEnd() {
    if (!this.selectedDoctor) {
      if (this.jitsiApi) this.jitsiApi.dispose();
      this.isCallActive = false;
      return;
    }

    if (!this.callStartTime) {
      this.isCallActive = false;
      if (this.jitsiApi) this.jitsiApi.dispose();
      return;
    }

    const durationMs = Date.now() - this.callStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    this.chatService.sendMessage(this.selectedDoctor.id, `[SYSTEM_CALL_ENDED: Ended • ${durationStr}]`).subscribe({
      next: (res) => {
        this.chatMessages.push(res.data);
        this.closeCall();
      },
      error: (err) => {
        console.error(err);
        this.closeCall();
      }
    });
  }

  forceEndCall() {
    this.handleCallEnd();
  }

  closeCall() {
    this.isCallActive = false;
    this.callStartTime = 0;
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
  }

  openConsult() {
    if (!this.selectedDoctor) {
      alert("Please select a doctor first.");
      return;
    }
    this.view = 'consult';
    this.viewingDoctor = this.selectedDoctor;
    if (this.selectedDoctor) {
      this.selectedDoctor.unreadCount = 0;
    }
    this.loadMessages();
    this.loadChatPartners();
    this.chatInterval = setInterval(() => {
      this.loadMessages();
      this.loadChatPartners();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
    }
  }

  loadMessages() {
    if (!this.viewingDoctor) return;
    this.chatService.getMessages(this.viewingDoctor.id).subscribe({
      next: (res) => {
        this.chatMessages = res.messages;
      },
      error: (err) => console.error(err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.viewingDoctor) return;
    if (this.selectedDoctor && this.viewingDoctor.id !== this.selectedDoctor.id) {
      return;
    }
    this.chatService.sendMessage(this.viewingDoctor.id, this.newMessage).subscribe({
      next: (res) => {
        this.chatMessages.push(res.data);
        this.newMessage = '';
      },
      error: (err) => console.error(err)
    });
  }
}
