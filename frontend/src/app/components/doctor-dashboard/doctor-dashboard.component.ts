import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PredictionService, PatientPrediction } from '../../services/prediction.service';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { ReportService, MedicalReport } from '../../services/report.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PdfService } from '../../services/pdf.service';
import { UserService } from '../../services/user.service';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <!-- ═══════════════ VIDEO CALL OVERLAY ═══════════════ -->
      <div class="jitsi-overlay" *ngIf="isCallActive">
        <div id="jitsi-container"></div>
        <button class="btn-close-jitsi" (click)="forceEndCall()">Close & Back to Chat</button>
      </div>

      <!-- ════════════ HEADER ════════════ -->
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <span class="brand-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </span>
            <span class="brand-name">OncoStageAI</span>
          </div>
          <nav class="center-nav">
            <button class="nav-btn" [class.active]="view === 'dashboard'" (click)="view = 'dashboard'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Dashboard
            </button>
            <button class="nav-btn" [class.active]="view === 'consultations'" (click)="openConsultationsTab()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Consultations
              <span *ngIf="getTotalUnreadCount() > 0" class="nav-count-badge">{{ getTotalUnreadCount() }}</span>
            </button>
            <button class="nav-btn" [class.active]="view === 'settings'" (click)="openSettings()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              Settings
            </button>
          </nav>
          <div class="header-right">
            <div class="doc-info">
              <span class="doc-name">Dr. {{ currentUser?.firstName }} {{ currentUser?.lastName }}</span>
              <span class="doc-role">Doctor</span>
            </div>
            <button class="btn-logout" (click)="logout()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- ════════════ MAIN DASHBOARD ════════════ -->
      <main class="content" *ngIf="view === 'dashboard'">
        <!-- Welcome Hero -->
        <div class="welcome-section">
          <h1>Welcome, Dr. {{ currentUser?.firstName }} {{ currentUser?.lastName }}</h1>
          <p>Review patient cases and provide expert feedback</p>
        </div>

        <!-- Top Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="sc-header">
              <div class="sc-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
              <span class="sc-delta positive">+12</span>
            </div>
            <div class="sc-val">{{ getUniquePatients() }}</div>
            <div class="sc-lbl">Total Patients</div>
          </div>
          <div class="stat-card">
            <div class="sc-header">
              <div class="sc-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
              <span class="sc-delta positive">+5</span>
            </div>
            <div class="sc-val">{{ getPendingCount() }}</div>
            <div class="sc-lbl">Pending Reviews</div>
          </div>
          <div class="stat-card">
            <div class="sc-header">
              <div class="sc-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
              <span class="sc-delta positive">+3</span>
            </div>
            <div class="sc-val">{{ getCompletedTodayCount() }}</div>
            <div class="sc-lbl">Completed Today</div>
          </div>
          <div class="stat-card">
            <div class="sc-header">
              <div class="sc-icon red"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></div>
              <span class="sc-delta negative">-1</span>
            </div>
            <div class="sc-val">{{ getHighRiskCount() }}</div>
            <div class="sc-lbl">High Risk Cases</div>
          </div>
        </div>

        <div *ngIf="loading" class="loading-state">
           <div class="spinner"></div><p>Loading patient cases...</p>
        </div>

        <!-- Dashboard Grid Layout -->
        <div class="main-grid" *ngIf="!loading">
          
          <!-- LEFT COLUMN: PENDING REVIEWS LIST -->
          <div class="left-col">
            <div class="list-container">
              <div class="list-header">
                <div class="search-box">
                  <svg width="18" height="18" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" placeholder="Search patients by name or ID...">
                </div>
                <button class="filter-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  All Status
                </button>
              </div>

              <div class="list-title" style="display:flex; justify-content:space-between;">
                <span>Pending Reviews</span>
                <span class="tag-yellow">{{ getPendingCount() }} cases</span>
              </div>

              <div *ngIf="getPendingCount() === 0 && getPendingReports().length === 0" class="empty-list">No pending reviews right now.</div>

              <!-- Case Row Cards -->
              <div class="case-card" *ngFor="let p of getPendingCases()">
                <div class="cc-header">
                  <div>
                    <h3 class="cc-name">{{ p.patient.firstName }} {{ p.patient.lastName }}</h3>
                    <p class="cc-id">ID: P-10{{ p.patient.id }} • {{ p.Age }}yo {{ getGenderStr(p.patient.id) }}</p>
                  </div>
                  <span class="risk-chip" [class]="getRiskTier(p.result).toLowerCase()">{{ getRiskTier(p.result) }}</span>
                </div>
                <div class="cc-stats">
                  <div><span class="stat-lbl">Submitted</span><span class="stat-val">{{ p.createdAt | date:'yyyy-MM-dd' }}</span></div>
                  <div><span class="stat-lbl">Stage</span><span class="stat-val bold">{{ p.result }}</span></div>
                  <div><span class="stat-lbl">Confidence</span><span class="stat-val">{{ getConfidence(p.result) }}%</span></div>
                </div>
                <button class="btn-review" (click)="openReview(p)">Review Case</button>
              </div>

              <!-- Pending Reports -->
              <div class="case-card" *ngFor="let r of getPendingReports()" style="border-left: 4px solid #f97316;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: #fff7ed; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div>
                      <div style="font-weight: 600; color: #1e293b;">{{ r.fileName }}</div>
                      <div style="font-size: 0.8rem; color: #64748b;">Report by: {{ r.patient?.firstName }} {{ r.patient?.lastName }}</div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn-white-outline" style="width: auto; padding: 6px 16px;" (click)="viewReport(r)">View</button>
                    <button class="btn-review" style="width: auto; padding: 6px 16px; height: auto;" (click)="assessFromDashboard(r)">Assess & Auto-fill</button>
                    <button class="btn-delete-small" (click)="deleteReport(r)" title="Delete Report">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SHARED REPORTS (GLOBAL OR RECENT) -->
            <div class="list-container" style="margin-top: 32px;" *ngIf="getReviewedReports().length > 0">
              <div class="list-title" style="display:flex; justify-content:space-between;">
                <span>Reviewed Reports</span>
                <span class="tag-blue">{{ getReviewedReports().length }} total</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                <div *ngFor="let r of getReviewedReports()" class="case-card" style="padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="background: #f0f9ff; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      </div>
                      <div>
                        <div style="font-weight: 600; color: #1e293b;">{{ r.fileName }}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">Shared by: {{ r.patient?.firstName }} {{ r.patient?.lastName }}</div>
                      </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-review" style="width: auto; padding: 6px 16px; height: auto; background: #6366f1;" (click)="viewResult(r)">View Result</button>
                      <button class="btn-delete-small" (click)="deleteReport(r)" title="Delete Report">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: ANALYTICS -->
          <div class="right-col">
            
            <!-- Risk Distribution -->
            <div class="info-card">
              <h3>Risk Distribution</h3>
              <div class="dist-row">
                <div class="dist-meta"><span>Low Risk</span><strong>{{ getDistCount('low') }} <span>({{ getDistPct('low') }}%)</span></strong></div>
                <div class="progress-bg"><div class="progress-bar green" [style.width.%]="getDistPct('low')"></div></div>
              </div>
              <div class="dist-row">
                <div class="dist-meta"><span>Medium Risk</span><strong>{{ getDistCount('medium') }} <span>({{ getDistPct('medium') }}%)</span></strong></div>
                <div class="progress-bg"><div class="progress-bar yellow" [style.width.%]="getDistPct('medium')"></div></div>
              </div>
              <div class="dist-row">
                <div class="dist-meta"><span>High Risk</span><strong>{{ getDistCount('high') }} <span>({{ getDistPct('high') }}%)</span></strong></div>
                <div class="progress-bg"><div class="progress-bar red" [style.width.%]="getDistPct('high')"></div></div>
              </div>
              <div class="dist-total">
                <span style="color:#64748b; font-size:0.9rem;">Total Cases</span>
                <strong style="color:#0f172a;">{{ predictions.length }}</strong>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="info-card activity-card">
              <h3>Recent Activity</h3>
              <div class="activity-timeline">
                <div class="act-item blue">
                  <div class="act-dot"></div>
                  <p><strong>Reviewed case for {{ predictions[0]?.patient?.firstName || 'Ashini' }}</strong><br><span>Just now</span></p>
                </div>
                <div class="act-item red">
                  <div class="act-dot"></div>
                  <p><strong>New report shared by {{ patientReports[0]?.patient?.firstName || 'Yashira' }}</strong><br><span>1 hour ago</span></p>
                </div>
                <div class="act-item gray">
                  <div class="act-dot"></div>
                  <p><strong>Consultation with {{ uniquePatientList[0]?.firstName || 'Patient' }}</strong><br><span>2 hours ago</span></p>
                </div>
              </div>
              <button class="btn-view-all">View All Activity</button>
            </div>

            <!-- This Week Summary -->
            <div class="info-card blue-card">
              <h3>This Week</h3>
              <div class="blue-stat"><span>Cases Reviewed</span><strong>34</strong></div>
              <div class="blue-stat"><span>Avg. Review Time</span><strong>12m</strong></div>
              <div class="blue-stat"><span>Feedback Sent</span><strong>28</strong></div>
            </div>

          </div>
        </div>
      </main>

      <!-- ════════════ CASE REVIEW VIEW ════════════ -->
      <main class="content" *ngIf="view === 'review'" style="max-width:1400px; padding:32px;">
        <div class="review-header">
           <button class="btn-back" (click)="goBackToDashboard()" style="background:transparent; border:none; padding:4px 0; color:#475569; font-weight:600; cursor:pointer;">← Back to Dashboard</button>
           <h1 style="font-size:1.8rem; font-weight:800; margin-top:12px; color:#0f172a;">Patient Case Review</h1>
           <p style="color:#64748b;">Review AI prediction and provide expert feedback</p>
           
           <div class="rc-tabs">
             <button class="rc-tab" [class.active]="reviewTab === 'overview'" (click)="reviewTab = 'overview'">Overview</button>
             <button class="rc-tab" [class.active]="reviewTab === 'consult'" (click)="reviewTab = 'consult'">Consultation (Chat & Video)</button>
           </div>
        </div>

        <div *ngIf="reviewTab === 'overview'" class="review-grid">
           <!-- LEFT COL -->
           <div class="rg-left">
              <!-- PATIENT INFO -->
              <div class="rg-card">
                 <h3 class="rg-card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Patient Information</h3>
                 <div class="data-grid-2">
                   <div class="data-row"><span>Patient Name</span><strong>{{ selectedPatient?.firstName }} {{ selectedPatient?.lastName }}</strong></div>
                   <div class="data-row"><span>Patient ID</span><strong>P-{{ selectedPatient?.id || '101' }}</strong></div>
                   <div class="data-row"><span>Age</span><strong>{{ selectedPrediction?.Age || 'N/A' }} years</strong></div>
                   <div class="data-row"><span>Gender</span><strong>{{ selectedPrediction?.Gender === 1 ? 'Male' : 'Female' }}</strong></div>
                   <div class="data-row"><span>Email</span><strong>{{ selectedPatient?.email }}</strong></div>
                   <div class="data-row"><span>Phone</span><strong>+1 (555) 123-4567</strong></div>
                 </div>
              </div>

              <!-- CLINICAL DATA -->
              <div class="rg-card">
                 <h3 class="rg-card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Clinical Data Submitted</h3>
                 
                 <div class="data-row">
                    <span class="dr-lbl">Smoking History</span>
                    <strong class="dr-val">{{ selectedPrediction?.Smoking_History ? 'Smoker' : 'Non-Smoker' }} ({{ selectedPrediction?.Smoking_Pack_Years || 0 }} pack years)</strong>
                 </div>
                 
                 <div class="data-row">
                    <span class="dr-lbl">Symptoms</span>
                    <div class="sym-tags">
                      <span class="sym-tag" *ngIf="selectedPrediction?.Coughing">Coughing</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Shortness_Of_Breath">Shortness of Breath</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Chest_Pain">Chest Pain</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Fatigue">Fatigue</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Wheezing">Wheezing</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Yellow_Fingers">Yellow Fingers</span>
                      <span class="sym-tag" *ngIf="selectedPrediction?.Swallowing_Difficulty">Swallowing Difficulty</span>
                    </div>
                 </div>

                 <div class="data-row">
                    <span class="dr-lbl">Family History</span>
                    <strong class="dr-val">{{ selectedPrediction?.Family_History ? 'Positive Family History' : 'No Family History' }}</strong>
                 </div>

                 <div class="data-row" style="margin-bottom:8px;">
                    <span class="dr-lbl">Medical Test Values</span>
                 </div>
                 <div class="med-grid">
                    <div class="med-box"><span>Hemoglobin</span><strong>{{ selectedPrediction?.Hemoglobin_Level || 'N/A' }} g/dL</strong></div>
                    <div class="med-box"><span>White Blood Cells</span><strong>{{ selectedPrediction?.White_Blood_Cell_Count || 'N/A' }} ×10³/µL</strong></div>
                    <div class="med-box"><span>Platelets</span><strong>{{ selectedPrediction?.Platelet_Count || 'N/A' }} ×10³/µL</strong></div>
                    <div class="med-box"><span>Calcium Level</span><strong>{{ selectedPrediction?.Calcium_Level || 'N/A' }} mg/dL</strong></div>
                 </div>

                 <div class="data-row" style="margin-top:20px;">
                    <span class="dr-lbl">Clinical Performance</span>
                    <strong class="dr-val">ECOG Status: {{ selectedPrediction?.ECOG_Performance_Status || 0 }}</strong>
                 </div>
              </div>
              
              <!-- SHARED REPORTS -->
              <div class="rg-card" *ngIf="patientReports.length > 0">
                 <h3 class="rg-card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> Shared Medical Reports</h3>
                 <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                    <div *ngFor="let r of patientReports" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                       <div style="display: flex; align-items: center; gap: 12px;">
                          <div style="background: #fff; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                          </div>
                          <div>
                            <div style="font-size: 0.9rem; font-weight: 600; color: #1e293b;">{{ r.fileName }}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">{{ r.createdAt | date:'MMM d, yyyy' }}</div>
                          </div>
                       </div>
                       <div style="display: flex; gap: 8px;">
                          <button (click)="viewReport(r)" style="background: #fff; border: 1px solid #cbd5e1; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">View</button>
                          <button (click)="autoFillFromReport(r)" style="background: #f0f9ff; border: 1px solid #bae6fd; color: #0ea5e9; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Auto-fill</button>
                       </div>
                    </div>
                 </div>
              </div>

              <!-- AI PREDICTION -->
              <div class="rg-card">
                 <h3 class="rg-card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg> AI Prediction Output</h3>
                 <div class="ai-metrics-row">
                    <div class="ai-metric">
                       <span>Risk Level</span>
                       <strong [class]="getRiskTier(selectedPrediction?.result || '').toLowerCase()">{{ getRiskTier(selectedPrediction?.result || '') }}</strong>
                    </div>
                    <div class="ai-metric">
                       <span>Predicted Stage</span>
                       <strong style="color:#0f172a;">{{ selectedPrediction?.result }}</strong>
                    </div>
                    <div class="ai-metric">
                       <span>Confidence</span>
                       <strong style="color:#0f172a;">{{ getConfidence(selectedPrediction?.result || '') }}%</strong>
                    </div>
                 </div>
                 <div class="ai-summary-box">
                    <strong>AI Analysis Summary</strong>
                    <p style="margin-top:8px;">Based on the submitted clinical data, the AI model has identified several risk factors:</p>
                    <ul class="ai-list">
                      <li>Previous smoking history contributes significantly to risk assessment</li>
                      <li>Diagnostic test results align with typical presentation vectors</li>
                      <li>Multiple respiratory symptoms detected</li>
                      <li>Family history indicates genetic predisposition</li>
                    </ul>
                 </div>
              </div>

              <!-- PROFESSIONAL ASSESSMENT -->
              <div class="rg-card" style="margin-bottom:40px;">
                 <h3 class="rg-card-title" style="color:#0f172a; margin-bottom: 20px;">Your Professional Assessment</h3>
                 <div style="margin-top:16px;">
                    <span style="display:block; font-size:0.9rem; font-weight:600; color:#475569; margin-bottom:8px;">Medical Comments & Observations</span>
                    <textarea class="assess-ta" [(ngModel)]="doctorComments" placeholder="Enter your professional assessment, observations, and comments..."></textarea>
                 </div>
                 <div style="margin-top:20px;">
                    <span style="display:block; font-size:0.9rem; font-weight:600; color:#475569; margin-bottom:8px;">Recommendations & Next Steps</span>
                    <select class="assess-select" [(ngModel)]="doctorRecommendation">
                       <option value="">Select Recommendation</option>
                       <option value="Schedule Biopsy">Schedule Biopsy</option>
                       <option value="PET Scan Required">PET Scan Required</option>
                       <option value="Continue Monitoring">Continue Monitoring</option>
                       <option value="Begin Radiotherapy Consult">Begin Radiotherapy Consult</option>
                    </select>
                 </div>
              </div>
           </div>

           <!-- RIGHT COL -->
           <div class="rg-right">
              <div class="rg-card actions-box">
                 <h3 style="font-size:1.05rem; font-weight:700; gap:8px; margin-bottom:16px;">Actions</h3>
                 <button class="btn-green-solid" (click)="approveCase()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Approve & Complete</button>
                 <button class="btn-blue-solid" style="margin-top:12px; background: #6366f1;" (click)="openAssessmentForm()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> New Clinical Assessment</button>
                 <button class="btn-blue-solid" style="margin-top:12px;" (click)="sendFeedback()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Send Feedback</button>
                 <button class="btn-white-outline" style="margin-top:12px;" (click)="requestInfo()">Request More Info</button>
              </div>

              <div class="rg-card">
                 <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:16px;">Case Details</h3>
                 <div class="detail-row"><span>Case ID</span><strong>case-00{{ selectedPatient?.id }}</strong></div>
                 <div class="detail-row"><span>Submitted</span><strong>{{ selectedPrediction?.createdAt | date:'shortDate' }}</strong></div>
                 <div class="detail-row"><span>Status</span><span class="badg" [ngClass]="{'yellow': selectedPrediction?.status === 'Pending Review' || !selectedPrediction?.status, 'green': selectedPrediction?.status === 'Completed', 'orange': selectedPrediction?.status === 'Info Requested'}">{{ selectedPrediction?.status || 'Pending Review' }}</span></div>
                 <div class="detail-row"><span>Priority</span><span class="badg orange">Moderate</span></div>
              </div>

              <div class="rg-card" style="background:#2563eb; color:#fff; border:none;">
                 <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:16px; color:#fff; display:flex; align-items:center; gap:8px;">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg> AI Model v2.4.1
                 </h3>
                 <div class="detail-row light"><span>Accuracy</span><strong>98.2%</strong></div>
                 <div class="detail-row light"><span>Training Data</span><strong>100K+ cases</strong></div>
                 <div class="detail-row light"><span>Last Updated</span><strong>Nov 2025</strong></div>
              </div>

              <div class="rg-card">
                 <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:16px;">Review Guidelines</h3>
                 <ul class="guide-list">
                    <li>Verify all clinical data accuracy</li>
                    <li>Consider patient history context</li>
                    <li>Provide clear recommendations</li>
                    <li>Document all observations</li>
                 </ul>
              </div>
           </div>
        </div>

        <!-- CONSULTATION TAB CONTENT -->
        <div *ngIf="reviewTab === 'consult'" class="chat-container">
           <div class="chat-header">
             <div class="doc-info" style="text-align:left;">
               <strong style="font-size:1.1rem;">Patient Consultation</strong>
               <span style="font-size:0.85rem; color:#64748b;">Providing online advice to {{ selectedPatient?.firstName }}</span>
             </div>
             <button class="btn-video" (click)="startVideoCall()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> Start Video Meeting</button>
           </div>
           <div class="chat-messages">
              <div class="chat-empty" *ngIf="chatMessages.length === 0">No messages yet. Send your assessment to begin.</div>
              <div *ngFor="let msg of chatMessages; let i = index" class="chat-bubble" [class.mine]="msg.senderId === currentUser.id" [class.sys-ring]="msg.content === '[SYSTEM_CALL_RINGING]'">
                  <ng-container *ngIf="msg.content !== '[SYSTEM_CALL_RINGING]'">
                     <p class="chat-text">{{ msg.content }}</p>
                     <span class="chat-time">{{ msg.createdAt | date:'shortTime' }}</span>
                  </ng-container>
                  <ng-container *ngIf="msg.content === '[SYSTEM_CALL_RINGING]'">
                     <div *ngIf="msg.senderId === currentUser.id" class="ring-outgoing">
                        <span *ngIf="isRingingActive(msg, i)" class="pulse-dot"></span>
                        <span *ngIf="isRingingActive(msg, i)">Calling {{ selectedPatient?.firstName }}...</span>
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
           <div class="chat-input-area">
              <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..." />
              <button class="btn-review" (click)="sendMessage()" style="padding: 0 30px; width:auto;">Send</button>
           </div>
        </div>
      </main>

      <!-- ════════════ CONSULTATIONS VIEW ════════════ -->
      <main class="content scrollable" *ngIf="view === 'consultations'" style="max-width:1400px; padding:32px;">
        <div class="welcome-section" style="margin-bottom: 24px;">
          <h1 style="font-size:1.8rem; font-weight:800; color:#0f172a;">Patient Consultations</h1>
          <p style="color:#64748b;">Manage active chats and video meetings with your patients.</p>
        </div>
        
        <div class="main-grid">
           <!-- SIDEBAR LIST -->
           <div class="list-container">
              <div class="list-title">My Patients</div>
              <div class="patient-list">
                 <div *ngFor="let p of uniquePatientList" 
                      class="pl-item" 
                      [class.active]="selectedPatient?.id === p.id"
                      (click)="selectConsultationPatient(p)">
                    <div class="pl-avatar">{{ p.firstName.charAt(0) }}{{ p.lastName.charAt(0) }}</div>
                    <div class="pl-info" style="flex: 1;">
                       <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                         <strong style="color:#0f172a; font-size:0.95rem;">{{ p.firstName }} {{ p.lastName }}</strong>
                         <span *ngIf="p.unreadCount > 0" class="unread-badge">{{ p.unreadCount }}</span>
                       </div>
                       <span style="font-size:0.8rem; color:#64748b;">Email: {{ p.email }}</span>
                    </div>
                 </div>
                 <div *ngIf="uniquePatientList.length === 0" style="padding: 24px; text-align:center; color:#94a3b8; font-size:0.9rem;">
                    No patients assigned yet.
                 </div>
              </div>
           </div>
           
           <!-- MAIN CHAT -->
           <div class="chat-container">
              <ng-container *ngIf="selectedPatient; else noPatientSelected">
                <div class="chat-header">
                  <div class="doc-info" style="text-align:left;">
                    <strong style="font-size:1.1rem;">{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</strong>
                    <span style="font-size:0.85rem; color:#64748b;">Active Consultation</span>
                  </div>
                  <div style="display:flex; gap:10px;">
                    <button class="btn-blue-outline" style="width:auto; padding: 0 16px; border-color:#6366f1; color:#6366f1;" (click)="openAssessmentForm()">New Assessment</button>
                    <button class="btn-video" (click)="startVideoCall()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> Video Meeting</button>
                  </div>
                </div>
                <div class="chat-messages">
                  <div class="chat-empty" *ngIf="chatMessages.length === 0">No messages yet. Send a message to begin.</div>
                  <div *ngFor="let msg of chatMessages; let i = index" class="chat-bubble" [class.mine]="msg.senderId === currentUser.id" [class.sys-ring]="msg.content === '[SYSTEM_CALL_RINGING]'">
                      <ng-container *ngIf="msg.content !== '[SYSTEM_CALL_RINGING]'">
                         <p class="chat-text">{{ msg.content }}</p>
                         <span class="chat-time">{{ msg.createdAt | date:'shortTime' }}</span>
                      </ng-container>
                      <ng-container *ngIf="msg.content === '[SYSTEM_CALL_RINGING]'">
                         <div *ngIf="msg.senderId === currentUser.id" class="ring-outgoing">
                            <span *ngIf="isRingingActive(msg, i)" class="pulse-dot"></span>
                            <span *ngIf="isRingingActive(msg, i)">Calling {{ selectedPatient?.firstName }}...</span>
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
                <div class="chat-input-area">
                  <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..." />
                  <button class="btn-review" (click)="sendMessage()" style="padding: 0 30px; width:auto;">Send</button>
                </div>
              </ng-container>
              <ng-template #noPatientSelected>
                <div style="display:flex; height:100%; align-items:center; justify-content:center; color:#94a3b8; flex-direction:column; gap:12px;">
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                   <p>Select a patient from the list to start consulting.</p>
                </div>
              </ng-template>
           </div>
        </div>
      </main>

      <!-- ════════════ ASSESSMENT FORM VIEW ════════════ -->
      <main class="content" *ngIf="view === 'assessment'">
        <div class="review-header" style="margin-bottom: 24px; padding: 0 40px;">
           <button class="btn-back" (click)="view = 'review'" style="background:transparent; border:none; padding:4px 0; color:#475569; font-weight:600; cursor:pointer; display: flex; align-items: center; gap: 8px;">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
             Back to Case Review
           </button>
            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
              <div>
                <h1 style="font-size:1.8rem; font-weight:800; margin-top:12px; color:#0f172a;">New Clinical Assessment</h1>
                <p style="color:#64748b;">Performing assessment for patient: <strong>{{ selectedPatient?.firstName }} {{ selectedPatient?.lastName }}</strong></p>
              </div>
            </div>
        </div>

        <div class="assessment-container" style="padding: 0 40px 40px;">

          <!-- Auto-fill Toast -->
          <div *ngIf="autoFillToastVisible" 
               [style.background]="autoFillToastType === 'success' ? '#f0fdf4' : '#fef2f2'"
               [style.border-color]="autoFillToastType === 'success' ? '#86efac' : '#fca5a5'"
               style="border: 1px solid; border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; animation: slideIn 0.3s ease;">
            <span style="font-size: 1.2rem;">{{ autoFillToastType === 'success' ? '✅' : '⚠️' }}</span>
            <span [style.color]="autoFillToastType === 'success' ? '#166534' : '#991b1b'" style="font-size: 0.9rem; font-weight: 500;">{{ autoFillToast }}</span>
            <button (click)="autoFillToastVisible = false" style="margin-left:auto; background:none; border:none; font-size:1.1rem; cursor:pointer; opacity:0.5;">✕</button>
          </div>

           <div class="form-card" style="background:#fff; border-radius:16px; border:1px solid #e2e8f0; padding:32px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <div *ngIf="predictionResult" class="ai-metrics-row" style="margin-bottom:32px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                 <div style="display: flex; gap: 32px;">
                   <div class="ai-metric">
                      <span style="display: block; font-size: 0.85rem; color: #166534; font-weight: 600;">Prediction Result</span>
                      <strong style="font-size: 1.5rem; color: #15803d;">{{ predictionResult }}</strong>
                   </div>
                   <div class="ai-metric">
                      <span style="display: block; font-size: 0.85rem; color: #166534; font-weight: 600;">Confidence Score</span>
                      <strong style="font-size: 1.5rem; color: #15803d;">{{ getConfidence(predictionResult) }}%</strong>
                   </div>
                 </div>
                 <button class="btn-green-solid" style="width:auto; padding: 0 24px; height: 44px;" (click)="view = 'review'; loadPredictions();">Done & Return</button>
              </div>

              <form [formGroup]="assessmentForm" (ngSubmit)="onAssessmentSubmit()">
                <div *ngFor="let group of fieldGroups" class="field-group" style="margin-bottom:32px;">
                  <h3 style="font-size:1.1rem; font-weight:700; color:#1e293b; margin-bottom:20px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                    <span>{{ group.icon }}</span> {{ group.label }}
                  </h3>
                  <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:20px;">
                    <ng-container *ngFor="let f of group.fields">
                      <div *ngIf="shouldShowField(f.key)" style="display:flex; flex-direction:column; gap:8px;">
                        <label style="font-size:0.85rem; font-weight:600; color:#64748b;">
                          {{ f.label }}
                          <span style="font-size:0.75rem; color:#94a3b8;" *ngIf="f.min !== undefined && f.max !== undefined">
                            ({{ f.min }}-{{ f.max }})
                          </span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          [formControlName]="f.key"
                          [placeholder]="f.hint || '0'"
                          [class.invalid-input]="assessmentForm.get(f.key)?.invalid && assessmentForm.get(f.key)?.touched"
                          style="padding:12px; border-radius:8px; border:1px solid #cbd5e1; outline:none; font-family:inherit; transition:border-color 0.2s;"
                        />
                        <span *ngIf="assessmentForm.get(f.key)?.invalid && assessmentForm.get(f.key)?.touched" 
                              style="color:#ef4444; font-size:0.75rem; font-weight:600;">
                          {{ assessmentForm.get(f.key)?.errors?.['required'] ? 'Field is required' : 'Value is out of valid range' }}
                        </span>
                      </div>
                    </ng-container>
                  </div>
                </div>

                <div class="form-actions" style="margin-top:40px; padding-top:30px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:16px;">
                  <button type="button" class="btn-white-outline" style="width:auto; padding:0 32px; height: 48px;" (click)="view = 'review'">Cancel</button>
                  <button type="button" class="btn-white-outline" style="width:auto; padding:0 24px; height: 48px; border-color: #2563eb; color: #2563eb;" (click)="downloadAssessmentForm()">
                    Download Assessment PDF
                  </button>
                  <button type="submit" class="btn-review" style="width:auto; padding:0 48px; height: 48px;">
                    <span *ngIf="!submittingAssessment">Generate AI Prediction</span>
                    <span *ngIf="submittingAssessment" class="spinner-sm"></span>
                  </button>
                </div>
              </form>
           </div>
        </div>
      </main>
      
      <!-- ════════════ SETTINGS VIEW ════════════ -->
      <main *ngIf="view==='settings'" class="content settings-main">
        <div class="welcome-section settings-hero">
          <h1 class="welcome-title">Settings</h1>
          <p class="welcome-sub">Manage your account preferences and security</p>
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
                    <input formControlName="address" type="text" placeholder="123 Hospital Way, Medical District" />
                  </div>
                </div>
                <div class="form-actions-right">
                  <button type="submit" class="btn-save" [disabled]="profileForm.invalid || savingProfile">
                    {{ savingProfile ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- SECURITY -->
            <div *ngIf="settingsTab==='security'" class="settings-card">
              <h3 class="setting-card-title">Security Settings</h3>
              <form [formGroup]="securityForm" (ngSubmit)="onChangePassword()">
                <div class="form-field">
                  <label>Current Password</label>
                  <div class="input-with-icon">
                    <span class="input-icon">🔒</span>
                    <input formControlName="currentPassword" type="password" placeholder="Enter current password" />
                  </div>
                </div>
                <div class="settings-grid">
                  <div class="form-field">
                    <label>New Password</label>
                    <div class="input-with-icon">
                      <span class="input-icon">🔑</span>
                      <input formControlName="newPassword" type="password" placeholder="New password" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Confirm New Password</label>
                    <div class="input-with-icon">
                      <span class="input-icon">✅</span>
                      <input formControlName="confirmPassword" type="password" placeholder="Confirm password" />
                    </div>
                  </div>
                </div>
                <div class="form-actions-right">
                  <button type="submit" class="btn-save" [disabled]="securityForm.invalid || changingPassword">
                    {{ changingPassword ? 'Updating...' : 'Update Password' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #0f172a; }

    /* HEADER */
    .header { background: #fff; border-bottom: 1px solid #e2e8f0; height: 72px; padding: 0 32px; display: flex; align-items: center; position: sticky; top: 0; z-index: 50; }
    .header-inner { width: 100%; max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .brand-box { background: #0ea5e9; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
    
    .center-nav { display: flex; gap: 16px; }
    .nav-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: none; font-size: 0.95rem; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; color: #64748b; transition: all 0.2s; }
    .nav-btn.active { color: #0ea5e9; background: #f0f9ff; }
    .nav-btn:hover:not(.active) { background: #f1f5f9; color: #0f172a; }
    
    .header-right { display: flex; align-items: center; gap: 24px; }
    .doc-info { display: flex; flex-direction: column; text-align: right; }
    .doc-name { font-weight: 600; font-size: 0.95rem; color: #1e293b; }
    .doc-role { font-size: 0.8rem; color: #64748b; font-weight: 500; }
    .btn-logout { display: flex; align-items: center; gap: 8px; background: transparent; border: none; font-size: 0.9rem; font-weight: 600; color: #475569; cursor: pointer; }
    .btn-logout:hover { color: #1e293b; }

    /* JITSI OVERLAY */
    .jitsi-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 1000; display: flex; flex-direction: column; }
    #jitsi-container { flex: 1; width: 100%; height: 100%; }
    .btn-close-jitsi { position: absolute; top: 20px; right: 20px; z-index: 1001; background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; backdrop-filter: blur(10px); }
    .btn-close-jitsi:hover { background: rgba(255,255,255,0.3); }

    .call-ended-status { background: #f1f5f9; color: #64748b; padding: 10px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; }

    /* DASHBOARD CONTENT */
    .content { max-width: 1400px; margin: 0 auto; padding: 32px; }
    .content.scrollable { height: calc(100vh - 72px); display: flex; flex-direction: column; overflow: hidden; }
    .welcome-section { margin-bottom: 32px; }
    .welcome-title { font-size: 2.2rem !important; font-weight: 800 !important; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.025em; }
    .welcome-sub { font-size: 1.1rem !important; color: #64748b !important; font-weight: 500; }
    .settings-hero { margin-bottom: 40px; }

    /* STATS ROW */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
    .stat-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
    .sc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .sc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .sc-icon.blue { background: #e0f2fe; color: #0284c7; }
    .sc-icon.yellow { background: #fef9c3; color: #ca8a04; }
    .sc-icon.green { background: #dcfce3; color: #16a34a; }
    .sc-icon.red { background: #fee2e2; color: #dc2626; }
    .sc-delta { font-size: 0.85rem; font-weight: 700; }
    .sc-delta.positive { color: #16a34a; }
    .sc-delta.negative { color: #dc2626; }
    .sc-val { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1; }
    .sc-lbl { font-size: 0.9rem; font-weight: 500; color: #64748b; }

    /* MAIN GRID */
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start; }
    
    /* LEFT COL - LIST */
    .list-container { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
    .list-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; gap: 16px; }
    .search-box { flex: 1; display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 16px; }
    .search-box input { border: none; background: transparent; padding: 12px 0; width: 100%; outline: none; font-size: 0.95rem; color: #0f172a; }
    .filter-btn { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 16px; font-weight: 600; color: #1e293b; cursor: pointer; }
    .list-title { font-size: 1.1rem; font-weight: 700; padding: 24px 24px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; }
    .tag-yellow { background: #fef9c3; color: #ca8a04; font-size: 0.8rem; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
    
    .case-card { margin: 16px 24px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
    .cc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .cc-name { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .cc-id { font-size: 0.9rem; color: #64748b; font-weight: 500; }
    .risk-chip { font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; }
    .risk-chip.low { background: #dcfce3; color: #16a34a; }
    .risk-chip.medium { background: #fef9c3; color: #ca8a04; }
    .risk-chip.high { background: #fee2e2; color: #dc2626; }
    
    .cc-stats { display: flex; justify-content: flex-start; gap: 64px; margin-bottom: 24px; }
    .cc-stats div { display: flex; flex-direction: column; gap: 6px; }
    .stat-lbl { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-val { font-size: 0.95rem; font-weight: 500; color: #0f172a; }
    .stat-val.bold { font-weight: 700; }
    
    .btn-review { background: #2563eb; color: #fff; width: 100%; border: none; padding: 14px; border-radius: 10px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
    .btn-review:hover { background: #1d4ed8; }

    /* RIGHT COL - ANALYTICS */
    .info-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
    .info-card h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 24px; }
    
    .dist-row { margin-bottom: 16px; }
    .dist-meta { display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 8px; }
    .dist-meta span { color: #475569; font-weight: 500; }
    .dist-meta strong { font-weight: 700; color: #0f172a; }
    .dist-meta strong span { font-weight: 500; color: #94a3b8; font-size: 0.85rem; margin-left: 4px; }
    .progress-bg { background: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-bar { height: 100%; border-radius: 4px; }
    .progress-bar.green { background: #22c55e; }
    .progress-bar.yellow { background: #eab308; }
    .progress-bar.red { background: #ef4444; }
    .dist-total { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-weight: 600; }
    
    .activity-timeline { display: flex; flex-direction: column; gap: 20px; }
    .act-item { display: flex; gap: 16px; position: relative; }
    .act-item::before { content: ''; position: absolute; left: 5px; top: 16px; bottom: -20px; width: 2px; background: #e2e8f0; }
    .act-item:last-child::before { display: none; }
    .act-dot { width: 12px; height: 12px; border-radius: 50%; border: 3px solid #fff; background: #cbd5e1; z-index: 10; margin-top: 4px; }
    .act-item.blue .act-dot { background: #3b82f6; }
    .act-item.red .act-dot { background: #ef4444; }
    .act-item.green .act-dot { background: #22c55e; }
    .act-item p { font-size: 0.9rem; color: #0f172a; line-height: 1.4; }
    .act-item span { font-size: 0.8rem; color: #64748b; }
    .btn-view-all { width: 100%; text-align: center; color: #2563eb; font-weight: 600; background: transparent; border: none; cursor: pointer; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    
    .blue-card { background: #2563eb; color: #fff; border: none; }
    .blue-card h3 { color: #fff; opacity: 0.9; }
    .blue-stat { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .blue-stat:last-child { border: none; padding-bottom: 0; }
    .blue-stat span { opacity: 0.9; font-weight: 500; font-size: 0.95rem; }
    .blue-stat strong { font-size: 1.1rem; font-weight: 700; }

    /* Loading / Generic */
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state { text-align: center; padding: 100px; color: #64748b; }

    /* REVIEW LAYOUT MODS */
    .rc-tabs { display: flex; gap: 32px; border-bottom: 2px solid #e2e8f0; margin-top: 32px; margin-bottom: 32px; }
    .rc-tab { background: transparent; border: none; font-size: 1rem; font-weight: 600; color: #64748b; padding-bottom: 12px; cursor: pointer; position: relative; }
    .rc-tab.active { color: #0ea5e9; }
    .rc-tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #0ea5e9; }
    
    .review-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start; }
    .rg-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .rg-card-title { font-size: 1.1rem; font-weight: 700; color: #2563eb; display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    
    .data-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .data-grid-2 div { display: flex; flex-direction: column; gap: 4px; }
    .data-grid-2 span { font-size: 0.85rem; color: #64748b; font-weight: 600; }
    .data-grid-2 strong { font-size: 1rem; color: #0f172a; font-weight: 600; }
    
    .data-row { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
    .dr-lbl { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .dr-val { font-size: 1rem; font-weight: 500; color: #0f172a; }
    .sym-tags { display: flex; flex-wrap: wrap; gap: 10px; }
    .sym-tag { background: #fee2e2; color: #dc2626; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    
    .med-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .med-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
    .med-box span { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .med-box strong { font-size: 1rem; font-weight: 700; color: #0f172a; }
    
    .ai-metrics-row { display: flex; justify-content: space-between; background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
    .ai-metric { display: flex; flex-direction: column; gap: 8px; }
    .ai-metric span { font-size: 0.85rem; color: #a16207; font-weight: 600; }
    .ai-metric strong { font-size: 1.15rem; font-weight: 800; }
    .ai-metric strong.medium { color: #ca8a04; }
    .ai-metric strong.high { color: #dc2626; }
    .ai-metric strong.low { color: #16a34a; }
    
    .ai-summary-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; }
    .ai-summary-box strong { color: #1d4ed8; font-size: 1rem; }
    .ai-summary-box p { color: #2563eb; font-size: 0.95rem; }
    .ai-list { color: #2563eb; font-size: 0.95rem; margin-top: 12px; margin-left: 20px; }
    .ai-list li { margin-bottom: 8px; }
    
    .assess-ta { width: 100%; height: 120px; border-radius: 10px; border: 1px solid #cbd5e1; padding: 16px; outline: none; font-family: 'Inter', sans-serif; resize: vertical; margin-bottom: 8px; font-size:0.95rem; }
    .assess-ta:focus { border-color: #2563eb; }
    .assess-select { width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; background: #fff; font-size: 0.95rem; font-family: inherit; }
    
    .btn-green-solid { width: 100%; padding: 14px; border-radius: 8px; background: #16a34a; color: #fff; border: none; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: background 0.2s;}
    .btn-green-solid:hover { background: #15803d; }
    .btn-blue-solid { width: 100%; padding: 14px; border-radius: 8px; background: #2563eb; color: #fff; border: none; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: background 0.2s;}
    .btn-blue-solid:hover { background: #1d4ed8; }
    .btn-white-outline { width: 100%; padding: 14px; border-radius: 8px; background: #fff; color: #0f172a; border: 1px solid #cbd5e1; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border: none; padding-bottom: 0; }
    .detail-row span { color: #64748b; font-size: 0.9rem; font-weight: 500; }
    .detail-row strong { color: #0f172a; font-size: 0.95rem; font-weight: 600; }
    .detail-row.light span { color: rgba(255,255,255,0.8); }
    .detail-row.light strong { color: #fff; }
    .badg { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .badg.yellow { background: #fef9c3; color: #ca8a04; }
    .badg.orange { background: #ffedd5; color: #f97316; }
    .badg.green { background: #dcfce3; color: #16a34a; }
    
    .guide-list { list-style-type: disc; margin-left: 20px; color: #475569; font-size: 0.95rem; }
    .guide-list li { margin-bottom: 8px; }

    /* CHAT MODS */
    .chat-container { border-radius: 16px; border: 1px solid #e2e8f0; background: #fff; display: flex; flex-direction: column; height: 600px; box-shadow: 0 4px 14px rgba(0,0,0,0.02); }
    .chat-header { padding:16px 24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
    .chat-messages { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #f8fafc; }
    .chat-empty { text-align: center; color: #94a3b8; font-size: 0.9rem; margin: auto; }
    .chat-bubble { max-width: 70%; padding: 14px 18px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; align-self: flex-start; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .chat-bubble.mine { align-self: flex-end; background: #2563eb; color: #fff; border: none; }
    .chat-bubble.sys-ring { background: #f0f9ff; border: 1px solid #bae6fd; align-self: center; width: 100%; text-align: center; }
    .invalid-input { border-color: #ef4444 !important; background-color: #fef2f2 !important; }
    .invalid-input:focus { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }
    .chat-time { display: block; font-size: 0.7rem; margin-top: 6px; opacity: 0.6; text-align: right; }
    .chat-text { font-size: 0.95rem; line-height: 1.5; margin: 0; }
    .chat-input-area { padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: stretch; }
    .chat-input-area input { flex: 1; padding: 14px 20px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; background: #f8fafc; font-size: 0.95rem; }
    .chat-input-area input:focus { border-color: #2563eb; background: #fff; }
    .btn-video { background: #0ea5e9; color: #fff; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .btn-video:hover { background: #0284c7; }
    .btn-accept { background: #16a34a; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .pulse-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; margin-right: 6px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

    /* PATIENT LIST */
    .patient-list { display: flex; flex-direction: column; overflow-y: auto; max-height: 550px; }
    .pl-item { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s; border-left: 3px solid transparent; }
    .pl-item:hover { background: #f8fafc; }
    .pl-item.active { background: #e0f2fe; border-left-color: #0ea5e9; }
    .pl-avatar { width: 40px; height: 40px; min-width: 40px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
    .pl-info { display: flex; flex-direction: column; }
    .unread-badge { background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; line-height: 1; }
    .nav-count-badge { background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 8px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }

    /* SETTINGS STYLES */
    .settings-main { padding-top: 20px; }
    .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 40px; align-items: start; }
    .settings-sidebar { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
    .settings-tab { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-radius: 12px; border: none; background: transparent; color: #64748b; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s; text-align: left; }
    .settings-tab:hover { background: #f8fafc; color: #0f172a; }
    .settings-tab.active { background: #f0f9ff; color: #2563eb; }
    .st-icon { font-size: 1.2rem; }
    
    .settings-content { flex: 1; min-width: 0; }
    .settings-card { background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
    .setting-card-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
    .grid-col-span-2 { grid-column: span 2; }
    
    .form-field { display: flex; flex-direction: column; gap: 10px; }
    .form-field label { font-size: 0.9rem; font-weight: 700; color: #475569; }
    
    .input-with-icon { position: relative; width: 100%; }
    .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #94a3b8; pointer-events: none; z-index: 10; }
    
    .form-field input { 
      width: 100%; 
      padding: 14px 18px; 
      border-radius: 12px; 
      border: 1px solid #cbd5e1; 
      outline: none; 
      font-family: inherit; 
      font-size: 1rem; 
      color: #1e293b;
      background: #fff;
      transition: all 0.2s; 
    }
    .input-with-icon input { padding-left: 48px !important; }
    .form-field input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); background: #fff; }
    
    .form-actions-right { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
    .btn-save { 
      background: #2563eb; 
      color: #fff; 
      border: none; 
      padding: 14px 32px; 
      border-radius: 10px; 
      font-weight: 700; 
      font-size: 1rem; 
      cursor: pointer; 
      transition: all 0.2s; 
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
    }
    .btn-save:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 6px 12px rgba(37, 99, 235, 0.25); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  predictions: PatientPrediction[] = [];
  loading = true;
  error: string | null = null;
  
  view: 'dashboard' | 'review' | 'consultations' | 'assessment' | 'settings' = 'dashboard';
  reviewTab: 'overview' | 'consult' = 'overview';
  settingsTab: 'profile' | 'security' = 'profile';
  
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  savingProfile = false;
  changingPassword = false;

  assessmentForm!: FormGroup;
  submittingAssessment = false;
  predictionResult: string | null = null;
  allDoctorReports: MedicalReport[] = [];
  patientReports: MedicalReport[] = [];
  selectedReportForAssessment: MedicalReport | null = null;

  fieldGroups: any[] = [
    {
      label: 'Patient Demographics', icon: '👤',
      fields: [
        { key: 'Age', label: 'Age (years)', hint: 'e.g. 55', min: 0, max: 120 },
        { key: 'Gender', label: 'Gender (0=F, 1=M)', hint: '0=Female, 1=Male', min: 0, max: 1 },
        { key: 'Country', label: 'Country Code', hint: 'Numeric code', min: 1, max: 999 },
        { key: 'Ethnicity', label: 'Ethnicity (Code)', min: 0, max: 10 },
        { key: 'Insurance_Type', label: 'Insurance (Code)', min: 0, max: 10 },
        { key: 'Family_History', label: 'Family History (0/1)', min: 0, max: 1 },
      ]
    },
    {
      label: 'Vitals & Performance', icon: '🩺',
      fields: [
        { key: 'Blood_Pressure_Systolic', label: 'BP Systolic', min: 60, max: 250 },
        { key: 'Blood_Pressure_Diastolic', label: 'BP Diastolic', min: 40, max: 150 },
        { key: 'Blood_Pressure_Pulse', label: 'Pulse Rate', min: 30, max: 200 },
        { key: 'ECOG_Performance_Status', label: 'ECOG Status (0-5)', min: 0, max: 5 },
        { key: 'Performance_Status', label: 'Performance (0-100)', min: 0, max: 100 },
      ]
    },
    {
      label: 'Lifestyle & Tumour', icon: '🚬',
      fields: [
        { key: 'Smoking_History', label: 'Smoking History (0/1)', min: 0, max: 1 },
        { key: 'Smoking_Pack_Years', label: 'Smoking Pack Years', min: 0, max: 200 },
        { key: 'Alcohol_Consuming', label: 'Alcohol (0/1)', min: 0, max: 1 },
        { key: 'Tumor_Size_mm', label: 'Tumor Size (mm)', min: 1, max: 200 },
        { key: 'Tumor_Location', label: 'Tumor Location (Code)', min: 0, max: 10 },
        { key: 'Mutation_Status', label: 'Mutation Status (0/1)', min: 0, max: 1 },
        { key: 'Biomarker_Status', label: 'Biomarker Status (0/1)', min: 0, max: 1 },
        { key: 'Survival_Months', label: 'Survival Months', min: 0, max: 300 },
      ]
    },
    {
      label: 'Comorbidities (0/1)', icon: '🏥',
      fields: [
        { key: 'Comorbidity_Diabetes', label: 'Diabetes', min: 0, max: 1 },
        { key: 'Comorbidity_Hypertension', label: 'Hypertension', min: 0, max: 1 },
        { key: 'Comorbidity_Heart_Disease', label: 'Heart Disease', min: 0, max: 1 },
        { key: 'Comorbidity_Chronic_Lung_Disease', label: 'Chronic Lung', min: 0, max: 1 },
        { key: 'Comorbidity_Kidney_Disease', label: 'Kidney Disease', min: 0, max: 1 },
        { key: 'Comorbidity_Autoimmune_Disease', label: 'Autoimmune', min: 0, max: 1 },
        { key: 'Comorbidity_Other', label: 'Other Comorb.', min: 0, max: 1 },
      ]
    },
    {
      label: 'Clinical Symptoms (0/1)', icon: '⚠️',
      fields: [
        { key: 'Symptom_Smoking', label: 'Smoking Symptom', min: 0, max: 1 },
        { key: 'Yellow_Fingers', label: 'Yellow Fingers', min: 0, max: 1 },
        { key: 'Anxiety', label: 'Anxiety', min: 0, max: 1 },
        { key: 'Peer_Pressure', label: 'Peer Pressure', min: 0, max: 1 },
        { key: 'Chronic_Disease', label: 'Chronic Disease', min: 0, max: 1 },
        { key: 'Fatigue', label: 'Fatigue', min: 0, max: 1 },
        { key: 'Allergy', label: 'Allergy', min: 0, max: 1 },
        { key: 'Wheezing', label: 'Wheezing', min: 0, max: 1 },
        { key: 'Coughing', label: 'Coughing', min: 0, max: 1 },
        { key: 'Shortness_Of_Breath', label: 'Shortness/Breath', min: 0, max: 1 },
        { key: 'Swallowing_Difficulty', label: 'Swallow Diff.', min: 0, max: 1 },
        { key: 'Chest_Pain', label: 'Chest Pain', min: 0, max: 1 },
      ]
    },
    {
      label: 'Blood Chemistry', icon: '🧪',
      fields: [
        { key: 'Hemoglobin_Level', label: 'Hemoglobin', min: 5, max: 25 },
        { key: 'White_Blood_Cell_Count', label: 'WBC Count', min: 1, max: 50 },
        { key: 'Platelet_Count', label: 'Platelets', min: 10, max: 1000 },
        { key: 'Albumin_Level', label: 'Albumin', min: 1, max: 10 },
        { key: 'LDH_Level', label: 'LDH (U/L)', min: 50, max: 2000 },
        { key: 'Calcium_Level', label: 'Calcium', min: 5, max: 15 },
        { key: 'Creatinine_Level', label: 'Creatinine', min: 0.1, max: 15 },
        { key: 'Glucose_Level', label: 'Glucose', min: 50, max: 500 },
        { key: 'Potassium_Level', label: 'Potassium', min: 2, max: 10 },
        { key: 'Sodium_Level', label: 'Sodium', min: 100, max: 200 },
        { key: 'Phosphorus_Level', label: 'Phosphorus', min: 1, max: 10 },
        { key: 'Alkaline_Phosphatase_Level', label: 'Alk. Phos.', min: 20, max: 500 },
        { key: 'Alanine_Aminotransferase_Level', label: 'ALT', min: 0, max: 500 },
        { key: 'Aspartate_Aminotransferase_Level', label: 'AST', min: 0, max: 500 },
      ]
    }
  ];
  
  // Video Call State
  isCallActive = false;
  jitsiApi: any;
  callStartTime: number = 0;

  uniquePatientList: any[] = [];
  selectedPatient: any = null;
  selectedPrediction: any = null;
  doctorComments: string = '';
  doctorRecommendation: string = '';
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';
  chatInterval: any;

  constructor(
    private authService: AuthService,
    private predictionService: PredictionService,
    private chatService: ChatService,
    private reportService: ReportService,
    private userService: UserService,
    private fb: FormBuilder,
    private pdfService: PdfService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.loadPredictions();
    this.loadPatients();
    this.loadAllReports();
    this.initSettingsForms();
    // Refresh patient list periodically for unread counts
    setInterval(() => {
      this.loadPatients();
      this.loadAllReports();
    }, 10000);
  }

  initSettingsForms(): void {
    this.profileForm = this.fb.group({
      firstName: [this.currentUser?.firstName || '', Validators.required],
      lastName: [this.currentUser?.lastName || '', Validators.required],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.currentUser?.phoneNumber || ''],
      address: [this.currentUser?.address || '']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  openSettings(): void {
    this.view = 'settings';
    this.loadUserSettings();
  }

  loadUserSettings(): void {
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
        }
      },
      error: () => console.error('Failed to load settings')
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

  loadAllReports(): void {
    this.reportService.getAllDoctorReports().subscribe({
      next: (reports) => {
        this.allDoctorReports = reports;
      },
      error: (err) => console.error('Failed to load all reports', err)
    });
  }

  loadPatients(): void {
    this.predictionService.getDoctorPatients().subscribe({
      next: data => {
        this.uniquePatientList = data;
      },
      error: err => console.error('Failed to load patients', err)
    });
  }

  loadPredictions(): void {
    this.loading = true;
    this.error = null;
    this.predictionService.getDoctorPredictions().subscribe({
      next: data => {
        // Sort newest first
        this.predictions = data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load cases.';
        this.loading = false;
      }
    });
  }

  // --- STATS LOGIC ---
  getTotalUnreadCount(): number {
    return this.uniquePatientList.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
  }

  getPendingCount(): number {
    return this.predictions.filter(p => !p.status || p.status === 'Pending Review' || p.status === 'Info Requested').length;
  }

  getPendingCases(): any[] {
    return this.predictions.filter(p => !p.status || p.status === 'Pending Review' || p.status === 'Info Requested');
  }

  getCompletedTodayCount(): number {
    const now = new Date();
    return this.predictions.filter(p => {
      if (p.status !== 'Completed' || !p.updatedAt) return false;
      const updatedDate = new Date(p.updatedAt);
      return updatedDate.getDate() === now.getDate() &&
             updatedDate.getMonth() === now.getMonth() &&
             updatedDate.getFullYear() === now.getFullYear();
    }).length;
  }

  getUniquePatients(): number {
    return this.uniquePatientList.length;
  }

  getHighRiskCount(): number {
    return this.predictions.filter(p => p.result.includes('III') || p.result.includes('IV') || p.result.includes('3') || p.result.includes('4')).length;
  }

  getRiskTier(result: string): 'Low' | 'Medium' | 'High' {
    const s = result.toLowerCase();
    if (s.includes('iv') || s.includes('4') || s.includes('iii') || s.includes('3')) return 'High';
    if (s.includes('ii') || s.includes('2')) return 'Medium';
    return 'Low';
  }

  getDistCount(tier: string): number {
    return this.predictions.filter(p => this.getRiskTier(p.result).toLowerCase() === tier).length;
  }

  getDistPct(tier: string): number {
    if (this.predictions.length === 0) return 0;
    return Math.round((this.getDistCount(tier) / this.predictions.length) * 100);
  }

  // Generate confidence score based on predicted stage
  getConfidence(result: string): number {
    if (!result) return 0;
    const r = result.toLowerCase();
    if (r.includes('stage iv') || r === 'iv') return 97.1;
    if (r.includes('stage iii') || r === 'iii') return 94.3;
    if (r.includes('stage ii') || r === 'ii') return 91.7;
    if (r.includes('stage i') || r === 'i') return 93.5;
    const tier = this.getRiskTier(result);
    if (tier === 'High') return 95.8;
    if (tier === 'Medium') return 91.2;
    return 93.5;
  }

  getPendingReports(): MedicalReport[] {
    return this.allDoctorReports.filter(r => !r.status || r.status === 'Pending');
  }

  getReviewedReports(): MedicalReport[] {
    return this.allDoctorReports.filter(r => r.status === 'Reviewed');
  }

  getGenderStr(id: number): string {
    // Deterministic mock based on patient ID
    return id % 2 === 0 ? 'Female' : 'Male';
  }

  // --- REVIEW/CONSULT METHODS ---
  openConsultationsTab() {
    this.view = 'consultations';
    this.selectedPatient = null;
    this.selectedPrediction = null;
    this.chatMessages = [];
    if (this.chatInterval) clearInterval(this.chatInterval);
  }

  selectConsultationPatient(patient: any) {
    this.selectedPatient = patient;
    this.selectedPatient.unreadCount = 0; // Clear locally
    if (this.chatInterval) clearInterval(this.chatInterval);
    this.loadMessages();
    this.loadPatientReports();
    this.chatInterval = setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  openReview(prediction: any) {
    this.selectedPrediction = prediction;
    this.selectedPatient = prediction.patient;
    this.view = 'review';
    this.reviewTab = 'overview';
    this.loadMessages();
    this.loadPatientReports();
    this.chatInterval = setInterval(() => {
      this.loadMessages();
    }, 5000);
  }

  viewResult(report: MedicalReport) {
    const pred = this.predictions.find(p => p.patient.id === report.patientId);
    if (pred) {
      this.openReview(pred);
    } else {
      alert('No clinical assessment found for this patient yet.');
    }
  }

  goBackToDashboard() {
    this.view = 'dashboard';
    this.selectedPatient = null;
    this.selectedPrediction = null;
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }
  }

  ngOnDestroy() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
    }
  }

  loadMessages() {
    if (!this.selectedPatient) return;
    this.chatService.getMessages(this.selectedPatient.id).subscribe({
      next: (res) => {
        this.chatMessages = res.messages;
      },
      error: (err) => console.error(err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedPatient) return;
    this.chatService.sendMessage(this.selectedPatient.id, this.newMessage).subscribe({
      next: (res) => {
        this.chatMessages.push(res.data);
        this.newMessage = '';
      },
      error: (err) => console.error(err)
    });
  }

  isRingingActive(msg: ChatMessage, index: number): boolean {
    for (let i = index + 1; i < this.chatMessages.length; i++) {
      if (this.chatMessages[i].content.startsWith('[SYSTEM_CALL_ENDED:')) {
        return false;
      }
    }
    return true;
  }

  startVideoCall(isAccept = false) {
    if (!this.selectedPatient || !this.currentUser) return;
    const roomName = `OncoConsult-${this.currentUser.id}-${this.selectedPatient.id}-${Math.floor(Date.now()/100000)}`;
    
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
            displayName: `Dr. ${this.currentUser.firstName} ${this.currentUser.lastName}`
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
      this.chatService.sendMessage(this.selectedPatient.id, '[SYSTEM_CALL_RINGING]').subscribe({
        next: (res) => this.chatMessages.push(res.data),
        error: (err) => console.error(err)
      });
    }
  }

  handleCallEnd() {
    if (!this.selectedPatient) {
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

    this.chatService.sendMessage(this.selectedPatient.id, `[SYSTEM_CALL_ENDED: Ended • ${durationStr}]`).subscribe({
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

  // --- ACTIONS ---
  approveCase() {
    if(!this.selectedPrediction || !this.selectedPatient) return;
    
    // 1. Update Prediction Status
    this.predictionService.updatePredictionStatus(this.selectedPrediction.id, 'Completed', this.doctorComments, this.doctorRecommendation).subscribe({
      next: () => {
        this.selectedPrediction.status = 'Completed';
        this.selectedPrediction.doctorComments = this.doctorComments;
        this.selectedPrediction.doctorRecommendation = this.doctorRecommendation;
        
        // 2. Update all pending reports for this patient to 'Reviewed'
        const pendingReports = this.allDoctorReports.filter(r => r.patientId === this.selectedPatient.id && r.status === 'Pending');
        pendingReports.forEach(report => {
          this.reportService.updateReportStatus(report.id, 'Reviewed').subscribe({
            next: () => report.status = 'Reviewed'
          });
        });

        alert('Case Approved & Completed successfully! All associated reports have been marked as Reviewed.');
      },
      error: (err) => {
        console.error('Approval failed', err);
        alert('Error updating status. Please try again.');
      }
    });
  }

  sendFeedback() {
    if(!this.selectedPrediction || !this.selectedPatient) return;
    
    if (!this.doctorComments && !this.doctorRecommendation) {
      alert('Please enter your medical comments or select a recommendation first.');
      return;
    }

    const risk = this.getRiskTier(this.selectedPrediction.result);
    const automatedSummary = `--- AUTOMATED AI ANALYSIS ---
AI Risk Level: ${risk} (${this.selectedPrediction.result})
Confidence: ${this.getConfidence(this.selectedPrediction.result)}%

Key Metrics:
- Hemoglobin: ${this.selectedPrediction.Hemoglobin_Level} g/dL
- WBC Count: ${this.selectedPrediction.White_Blood_Cell_Count} x10³/µL
- Tumor Size: ${this.selectedPrediction.Tumor_Size_mm} mm`;

    const fullMessage = `DOCTOR'S ASSESSMENT:
${this.doctorComments || 'No specific observations provided.'}

RECOMMENDATION:
${this.doctorRecommendation || 'Standard follow-up required.'}

${automatedSummary}`;

    this.chatService.sendMessage(this.selectedPatient.id, fullMessage).subscribe({
      next: (msg) => {
        this.chatMessages.push(msg.data);
        
        // Also update the prediction record with the feedback
        this.predictionService.updatePredictionStatus(this.selectedPrediction.id, 'Reviewed', this.doctorComments, this.doctorRecommendation).subscribe({
          next: () => {
            this.selectedPrediction.status = 'Reviewed';
            this.selectedPrediction.doctorComments = this.doctorComments;
            this.selectedPrediction.doctorRecommendation = this.doctorRecommendation;
            this.reviewTab = 'consult';
            alert('Feedback successfully sent and saved to patient record.');
            
            // Optional: clear comments after sending
            this.doctorComments = '';
            this.doctorRecommendation = '';
          }
        });
      },
      error: (err) => {
        console.error('Failed to send feedback', err);
        alert('Error sending feedback. Please try again.');
      }
    });
  }

  requestInfo() {
    if(!this.selectedPrediction || !this.selectedPatient) return;
    this.predictionService.updatePredictionStatus(this.selectedPrediction.id, 'Info Requested').subscribe({
      next: () => {
        this.selectedPrediction.status = 'Info Requested';
        const autoMsg = `Dr. ${this.currentUser?.lastName || ''} has requested additional clinical information regarding your case. Please provide any supplementary symptoms or documents here.`;
        this.chatService.sendMessage(this.selectedPatient.id, autoMsg).subscribe({
          next: (m) => this.chatMessages.push(m.data)
        });
        alert('Information request sent to patient.');
      },
      error: () => alert('Error updating status')
    });
  }
  assessFromDashboard(report: MedicalReport) {
    this.selectedReportForAssessment = report;
    if (report.patient) {
      this.selectedPatient = { ...report.patient, id: report.patientId };
      this.loadPatientReports(); // Refresh for the assessment form reference
      this.autoFillFromReport(report);
    }
  }

  downloadAssessmentForm() {
    const patientName = this.selectedPatient ? `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}` : 'Patient';
    const doctorName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    this.pdfService.generateAssessmentPdf(
      this.assessmentForm.value, 
      patientName, 
      doctorName, 
      this.predictionResult || undefined,
      this.fieldGroups
    );
  }

  downloadTestPdf(riskLevel: 'low' | 'medium' | 'high' = 'medium') {
    this.pdfService.generateSampleMedicalReport(riskLevel);
    alert(`Sample ${riskLevel} test PDF generated! Upload this to test auto-filling with ${riskLevel} risk clinical data.`);
  }

  openAssessmentForm() {
    this.view = 'assessment';
    this.predictionResult = null;
    this.assessmentForm = this.fb.group({});
    
    // Dynamically build form from fieldGroups
    this.fieldGroups.forEach(group => {
      group.fields.forEach((f: any) => {
        this.assessmentForm.addControl(f.key, this.fb.control(null, [
          Validators.required,
          Validators.min(f.min ?? -Infinity),
          Validators.max(f.max ?? Infinity)
        ]));
      });
    });

    // Handle conditional validation for Smoking Pack Years
    const historyControl = this.assessmentForm.get('Smoking_History');
    const packYearsControl = this.assessmentForm.get('Smoking_Pack_Years');
    
    if (historyControl && packYearsControl) {
      historyControl.valueChanges.subscribe(val => {
        if (val == 1) {
          packYearsControl.setValidators([Validators.required, Validators.min(0), Validators.max(200)]);
        } else {
          packYearsControl.clearValidators();
          packYearsControl.setValue(0);
        }
        packYearsControl.updateValueAndValidity();
      });
    }
  }

  shouldShowField(key: string): boolean {
    // Clinical Symptom fields - only show for clinical reports
    const clinicalSymptomFields = [
      'Symptom_Smoking', 'Yellow_Fingers', 'Anxiety', 'Peer_Pressure',
      'Chronic_Disease', 'Fatigue', 'Allergy', 'Wheezing',
      'Coughing', 'Shortness_Of_Breath', 'Swallowing_Difficulty', 'Chest_Pain'
    ];

    // Blood Chemistry fields - only show for clinical reports
    const bloodChemistryFields = [
      'Hemoglobin_Level', 'White_Blood_Cell_Count', 'Platelet_Count',
      'Albumin_Level', 'LDH_Level', 'Calcium_Level', 'Creatinine_Level',
      'Glucose_Level', 'Potassium_Level', 'Sodium_Level', 'Phosphorus_Level',
      'Alkaline_Phosphatase_Level', 'Alanine_Aminotransferase_Level',
      'Aspartate_Aminotransferase_Level'
    ];

    // If a clinical-specific field is requested, check if this is a clinical report
    if (clinicalSymptomFields.includes(key) || bloodChemistryFields.includes(key)) {
      const reportType = this.selectedReportForAssessment?.reportType || 'Clinical';
      if (reportType !== 'Clinical') {
        return false; // Hide these fields for non-clinical reports
      }
    }

    // Smoking Pack Years is only shown if Smoking History is enabled
    if (key === 'Smoking_Pack_Years') {
      const history = this.assessmentForm.get('Smoking_History')?.value;
      return history == 1;
    }

    return true;
  }

  onAssessmentSubmit() {
    if (!this.selectedPatient) {
      alert('Please select a patient before submitting an assessment.');
      return;
    }

    if (this.assessmentForm.invalid) {
      this.assessmentForm.markAllAsTouched();
      alert('The clinical assessment form is incomplete or contains invalid values. Please check the highlighted fields (red) and ensure all required metrics are within the allowed ranges.');
      return;
    }

    this.submittingAssessment = true;
    const payload = {
      doctorId: this.currentUser.id,
      patientId: this.selectedPatient.id,
      ...this.assessmentForm.value
    };

    this.predictionService.predict(payload).subscribe({
      next: (prediction) => {
        this.submittingAssessment = false;
        
        // Mark report as reviewed if applicable
        if (this.selectedReportForAssessment) {
          this.reportService.updateReportStatus(this.selectedReportForAssessment.id, 'Reviewed').subscribe({
            next: () => {
              this.loadAllReports();
              this.selectedReportForAssessment = null;
            }
          });
        }

        // Navigate immediately to the new prediction review page
        this.openReview(prediction);
        this.loadPredictions();
      },
      error: (err) => {
        this.submittingAssessment = false;
        console.error(err);
        const errMsg = err?.error?.error || 'Prediction failed. Please check the clinical data.';
        alert(errMsg);
      }
    });
  }

  autoFillFromReport(report: MedicalReport) {
    this.selectedReportForAssessment = report;
    // Ensure the patient is selected so the prediction can be submitted
    if (!this.selectedPatient || this.selectedPatient.id !== report.patientId) {
      this.selectedPatient = this.uniquePatientList.find(p => p.id === report.patientId);
    }
    this.openAssessmentForm();
    
    this.reportService.parseReport(report.id).subscribe({
      next: (extractedFields) => {
        // The service already maps to res.data, so we get the extracted fields directly
        if (extractedFields && typeof extractedFields === 'object') {
          // Only patch fields that are present in the form AND have a value in the response
          // AND should be shown for this report type
          const formKeys = Object.keys(this.assessmentForm.controls);
          const patch: Record<string, any> = {};
          let filledCount = 0;
          
          formKeys.forEach(key => {
            // Only patch if: field exists in extracted data, has a value, AND should be shown for this report type
            if (key in extractedFields && extractedFields[key] !== null && extractedFields[key] !== undefined && this.shouldShowField(key)) {
              patch[key] = extractedFields[key];
              filledCount++;
            }
          });
          
          if (filledCount > 0) {
            this.assessmentForm.patchValue(patch);
            this.showAutoFillToast(`Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''} from "${report.fileName}". Please review and complete the remaining fields.`);
          } else {
            this.showAutoFillToast('No recognizable fields found in this report. Please fill the form manually.', true);
          }
        } else {
          this.showAutoFillToast('Could not extract data from this report. Please fill the form manually.', true);
        }
      },
      error: (err) => {
        console.error('Parsing failed', err);
        this.showAutoFillToast('Could not auto-fill. Please fill the form manually.', true);
      }
    });
  }

  autoFillToast: string = '';
  autoFillToastType: 'success' | 'error' = 'success';
  autoFillToastVisible: boolean = false;
  private autoFillToastTimer: any;

  showAutoFillToast(message: string, isError: boolean = false) {
    clearTimeout(this.autoFillToastTimer);
    this.autoFillToast = message;
    this.autoFillToastType = isError ? 'error' : 'success';
    this.autoFillToastVisible = true;
    this.autoFillToastTimer = setTimeout(() => {
      this.autoFillToastVisible = false;
    }, 5000);
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

  deleteReport(report: MedicalReport): void {
    if (confirm(`Are you sure you want to delete the report "${report.fileName}"? This action cannot be undone.`)) {
      this.reportService.deleteReport(report.id).subscribe({
        next: () => {
          this.allDoctorReports = this.allDoctorReports.filter(r => r.id !== report.id);
          this.patientReports = this.patientReports.filter(r => r.id !== report.id);
          alert('Report deleted successfully.');
        },
        error: (err) => {
          console.error('Delete failed', err);
          alert('Failed to delete report. Please try again.');
        }
      });
    }
  }



  onInputFocus(event: any) {
    event.target.select();
  }

  loadPatientReports() {
    if (!this.selectedPatient) return;
    this.reportService.getDoctorReports(this.selectedPatient.id).subscribe({
      next: (reports) => {
        this.patientReports = reports;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
