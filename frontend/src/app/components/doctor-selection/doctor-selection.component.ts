import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  currentPatientCount: number;
  availableSlots: number;
  isAvailable: boolean;
}

interface DoctorsResponse {
  doctors: Doctor[];
  weekStart: string;
}

@Component({
  selector: 'app-doctor-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-selection.component.html',
  styleUrls: ['./doctor-selection.component.css']
})
export class DoctorSelectionComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api/doctors';
  
  doctors = signal<Doctor[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  selectedDoctorId = signal<number | null>(null);
  isSubmitting = signal(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.checkExistingAssignment();
  }

  checkExistingAssignment(): void {
    this.http.get(`${this.apiUrl}/my-assignment`).subscribe({
      next: () => {
        // Patient already has a doctor assigned, redirect to dashboard
        this.router.navigate(['/patient/dashboard']);
      },
      error: () => {
        // No assignment found, user can select a doctor
      }
    });
  }

  loadDoctors(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    console.log('Loading doctors...');
    console.log('Auth token:', this.authService.getToken());
    
    this.http.get<DoctorsResponse>(`${this.apiUrl}/available`).subscribe({
      next: (response) => {
        console.log('Doctors loaded:', response);
        this.doctors.set(response.doctors);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        let errorMsg = 'Failed to load doctors. ';
        if (error.status === 0) {
          errorMsg += 'Cannot connect to server. Please ensure the backend is running.';
        } else if (error.status === 401) {
          errorMsg += 'Unauthorized. Please login again.';
        } else if (error.status === 500) {
          errorMsg += 'Server error. Please try again later.';
        } else {
          errorMsg += 'Please try again.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  selectDoctor(doctorId: number): void {
    if (!this.isSubmitting()) {
      this.selectedDoctorId.set(doctorId);
      this.assignToDoctor(doctorId);
    }
  }

  assignToDoctor(doctorId: number): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post(`${this.apiUrl}/assign`, { doctorId }).subscribe({
      next: (response: any) => {
        this.successMessage.set(`Successfully assigned to Dr. ${response.assignment.doctor.firstName} ${response.assignment.doctor.lastName}`);
        this.isSubmitting.set(false);
        
        // Redirect to patient dashboard after a short delay
        setTimeout(() => {
          this.router.navigate(['/patient/dashboard']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.message || 'Failed to assign doctor. Please try again.'
        );
        this.isSubmitting.set(false);
        this.selectedDoctorId.set(null);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
