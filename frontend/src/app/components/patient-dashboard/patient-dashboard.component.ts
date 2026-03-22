  import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';
import { Doctor } from '../../services/doctor.service';

interface FieldGroup {
  label: string;
  icon: string;
  fields: { key: string; label: string; hint?: string; min?: number; max?: number; isBinary?: boolean }[];
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
            <button class="btn-back" (click)="goBack()">← Change Doctor</button>
            <span class="user-greeting">{{ currentUser?.firstName }}</span>
            <button class="btn-logout" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- No doctor selected -->
      <div *ngIf="!selectedDoctor" class="no-doctor">
        <p>No doctor selected. <button (click)="goBack()">Pick a doctor first →</button></p>
      </div>

      <div *ngIf="selectedDoctor">
        <!-- Doctor Banner -->
        <div class="doctor-banner">
          <div class="banner-inner">
            <div class="doc-avatar">{{ selectedDoctor.firstName[0] }}{{ selectedDoctor.lastName[0] }}</div>
            <div>
              <p class="doc-sub">Assigned Doctor</p>
              <h2>Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</h2>
              <p class="doc-email">{{ selectedDoctor.email }}</p>
            </div>
          </div>
        </div>

        <!-- Result Banner -->
        <div *ngIf="predictionResult" class="result-banner" [class]="'stage-' + stageClass">
          <div class="result-inner">
            <div class="result-icon">🎯</div>
            <div>
              <p class="result-label">ML Prediction Result</p>
              <h2 class="result-stage">{{ predictionResult }}</h2>
              <p class="result-note">This result has been shared with Dr. {{ selectedDoctor.firstName }}.</p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="submitError" class="error-banner">
          <span>⚠️ {{ submitError }}</span>
          <button (click)="submitError = null">✕</button>
        </div>

        <!-- Form -->
        <main class="content">
          <div class="form-card">
            <div class="form-title">
              <h2>Clinical Assessment Form</h2>
              <p>Fill in the following clinical details to get an AI-powered lung cancer stage prediction.</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div *ngFor="let group of fieldGroups" class="field-group">
                <h3 class="group-title"><span>{{ group.icon }}</span> {{ group.label }}</h3>
                <div class="fields-grid">
                  <div *ngFor="let f of group.fields" class="form-field">
                    <label [for]="f.key">
                      {{ f.label }}
                      <span class="range-hint" *ngIf="f.min !== undefined && f.max !== undefined">
                        ({{ f.min }} - {{ f.max }})
                      </span>
                    </label>
                    <input
                      [id]="f.key"
                      type="number"
                      step="any"
                      min="0"
                      (keydown)="onKeyDown($event, f)"
                      [formControlName]="f.key"
                      [placeholder]="f.hint || '0'"
                      [class.invalid]="form.get(f.key)?.invalid && (form.get(f.key)?.touched || form.get(f.key)?.dirty)"
                    />
                    <div class="field-error" *ngIf="form.get(f.key)?.invalid && (form.get(f.key)?.touched || form.get(f.key)?.dirty)">
                      <span *ngIf="form.get(f.key)?.errors?.['required']">Required</span>
                      <span *ngIf="form.get(f.key)?.errors?.['min']">Min: {{ f.min }}</span>
                      <span *ngIf="form.get(f.key)?.errors?.['max']">Max: {{ f.max }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- General Validation Message -->
              <div *ngIf="form.invalid && form.touched && !submitting" class="validation-summary">
                ⚠️ Please fill all fields correctly within their specified ranges.
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-predict" [disabled]="submitting || (form.invalid && form.touched)">
                  <span *ngIf="!submitting">🔬 Get Stage Prediction</span>
                  <span *ngIf="submitting" class="btn-loading">
                    <span class="spinner-sm"></span> Analysing…
                  </span>
                </button>
              </div>
            </form>
          </div>
        </main>
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
      position: sticky; top: 0; z-index: 10;
      box-shadow: var(--shadow-sm);
    }
    .header-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 64px;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 1.25rem; font-weight: 700; }
    .brand-icon { font-size: 1.5rem; }
    .brand-name strong { color: var(--primary-blue); }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .user-greeting { color: var(--text-muted); font-size: 0.9rem; }
    .btn-back {
      padding: 7px 16px;
      background: var(--bg-light);
      border: 1px solid var(--border-light);
      border-radius: 8px; color: var(--primary-blue); cursor: pointer; font-size: 0.85rem; font-weight: 500;
      transition: all 0.2s;
    }
    .btn-back:hover { background: #e0f2fe; border-color: var(--primary-blue); }
    .btn-logout {
      padding: 7px 16px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px; color: #dc2626; cursor: pointer; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-logout:hover { background: #fecaca; }

    /* No doctor */
    .no-doctor {
      text-align: center; padding: 100px 24px;
      color: var(--text-muted);
    }
    .no-doctor button {
      background: none; border: none; color: var(--primary-blue); cursor: pointer;
      text-decoration: underline; font-size: 1rem; font-weight: 500;
    }

    /* Doctor Banner */
    .doctor-banner {
      background: var(--bg-white);
      border-bottom: 1px solid var(--border-light);
      padding: 32px 24px;
    }
    .banner-inner {
      max-width: 1000px; margin: 0 auto;
      display: flex; align-items: center; gap: 24px;
    }
    .doc-avatar {
      width: 64px; height: 64px; border-radius: 16px;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; color: #fff; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
    }
    .doc-sub { font-size: 0.75rem; color: var(--primary-blue); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px; }
    .doctor-banner h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-dark); }
    .doc-email { font-size: 0.9rem; color: var(--text-muted); margin-top: 2px; }

    /* Result banner */
    .result-banner {
      margin: 24px auto;
      max-width: 1000px;
      padding: 0 24px;
    }
    .result-inner {
      display: flex; align-items: center; gap: 24px;
      border-radius: 24px;
      padding: 32px;
      box-shadow: var(--shadow-md);
    }
    .stage-i .result-inner { background: #f0fdf4; border: 2px solid #bbf7d0; color: #166534; }
    .stage-ii .result-inner { background: #f0f9ff; border: 2px solid #bae6fd; color: #075985; }
    .stage-iii .result-inner { background: #fffbeb; border: 2px solid #fde68a; color: #92400e; }
    .stage-iv .result-inner { background: #fef2f2; border: 2px solid #fecaca; color: #991b1b; }
    
    .result-icon { font-size: 3rem; flex-shrink: 0; }
    .result-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 6px; opacity: 0.8; }
    .result-stage { font-size: 2.4rem; font-weight: 900; line-height: 1; }
    .result-note { font-size: 0.95rem; margin-top: 8px; opacity: 0.75; font-weight: 500; }

    /* Error */
    .error-banner {
      max-width: 1000px; margin: 16px auto;
      padding: 0 24px;
    }
    .error-banner > div, .error-banner {
      display: flex; align-items: center; gap: 12px;
      background: #fff1f2;
      border: 1px solid #fecaca;
      border-radius: 12px; padding: 16px 20px;
      color: #991b1b;
    }
    .error-banner button { margin-left: auto; background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.2rem; }

    /* Content */
    .content { max-width: 1000px; margin: 0 auto; padding: 24px 24px 80px; }

    .form-card {
      background: var(--bg-white);
      border: 1px solid var(--border-light);
      border-radius: 24px;
      padding: 48px;
      box-shadow: var(--shadow-md);
    }
    .form-title { margin-bottom: 48px; }
    .form-title h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-dark); margin-bottom: 12px; }
    .form-title p { color: var(--text-muted); font-size: 1.05rem; }

    /* Field groups */
    .field-group { margin-bottom: 48px; }
    .group-title {
      font-size: 1.1rem; font-weight: 700; color: var(--primary-blue);
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
    }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .form-field { display: flex; flex-direction: column; gap: 8px; }
    .form-field label { font-size: 0.85rem; color: var(--text-dark); font-weight: 600; }
    .form-field input {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      color: var(--text-dark);
      font-size: 0.95rem;
      transition: all 0.2s ease;
      outline: none;
      width: 100%;
      appearance: textfield; /* Firefox */
    }
    .form-field input::-webkit-outer-spin-button,
    .form-field input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .form-field input:focus {
      border-color: var(--primary-blue);
      background: #fff;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
    }
    .form-field input.invalid { border-color: #ef4444; background: #fef2f2; }
    .form-field input::placeholder { color: #94a3b8; }
    .field-error { font-size: 0.75rem; color: #ef4444; font-weight: 600; margin-top: 4px; }
    .range-hint { font-size: 0.7rem; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
    .validation-summary {
      background: #fff1f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 500;
    }

    /* Actions */
    .form-actions { text-align: center; margin-top: 48px; border-top: 1px solid #f1f5f9; padding-top: 48px; }
    .btn-predict {
      padding: 16px 56px;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-green));
      border: none; border-radius: 14px;
      color: #fff; font-size: 1.1rem; font-weight: 700;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
    }
    .btn-predict:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(14, 165, 233, 0.45);
      filter: brightness(1.05);
    }
    .btn-predict:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-loading { display: flex; align-items: center; gap: 12px; }
    .spinner-sm {
      width: 20px; height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PatientDashboardComponent implements OnInit {
  currentUser: any;
  selectedDoctor: Doctor | null = null;
  form: FormGroup;
  submitting = false;
  predictionResult: string | null = null;
  stageClass = '';
  submitError: string | null = null;

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
    private fb: FormBuilder,
    private authService: AuthService,
    private predictionService: PredictionService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
    // Retrieve doctor from navigation state
    const nav = this.router.getCurrentNavigation();
    this.selectedDoctor = nav?.extras?.state?.['selectedDoctor'] ?? null;

    this.form = this.buildForm();
  }

  ngOnInit(): void {
    // If no navigation state (e.g. page refresh), check history state
    if (!this.selectedDoctor) {
      const state = history.state;
      if (state?.selectedDoctor) {
        this.selectedDoctor = state.selectedDoctor;
      }
    }
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

    const payload = {
      doctorId: this.selectedDoctor.id,
      ...this.form.value
    };

    this.predictionService.predict(payload).subscribe({
      next: result => {
        this.predictionResult = result.prediction;
        this.stageClass = this.getStageClass(result.prediction);
        this.submitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.submitError = err?.error?.error || 'Prediction failed. Please try again.';
        this.submitting = false;
      }
    });
  }

  private getStageClass(stage: string): string {
    const s = stage.toLowerCase();
    if (s.includes('iv') || s.includes('4')) return 'stage-iv';
    if (s.includes('iii') || s.includes('3')) return 'stage-iii';
    if (s.includes('ii') || s.includes('2')) return 'stage-ii';
    return 'stage-i';
  }

  goBack(): void {
    this.router.navigate(['/patient/doctors']);
  }

  onKeyDown(event: KeyboardEvent, field?: any): void {
    const key = event.key;
    
    // Prevent minus sign and 'e' (scientific notation)
    if (key === '-' || key === 'e' || key === 'E') {
      event.preventDefault();
      return;
    }

    // Strict restrictions for small integer fields (Binary, ECOG, Treatment Type, etc.)
    if (field?.isBinary || (field?.max !== undefined && field.max < 10)) {
      const maxVal = field.isBinary ? 1 : field.max;
      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
      
      // Build list of allowed numeric keys based on max
      for (let i = 0; i <= maxVal; i++) {
        allowedKeys.push(i.toString());
      }

      if (!allowedKeys.includes(key)) {
        event.preventDefault();
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
