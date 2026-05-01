import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PredictionService } from '../../services/prediction.service';
import { LoginRequest, RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // Signals for form state
  showRegister = signal(false);
  role = signal<'patient' | 'doctor'>('patient');
  email = signal('');
  password = signal('');
  firstName = signal('');
  lastName = signal('');
  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private authService: AuthService,
    private predictionService: PredictionService,
    private router: Router
  ) {}

  navigateToLanding(): void {
    this.router.navigate(['/']);
  }

  toggleForm(): void {
    this.showRegister.set(!this.showRegister());
    this.errorMessage.set('');
    // Keep email and password, reset registration fields
    this.firstName.set('');
    this.lastName.set('');
  }

  handleSubmit(): void {
    this.errorMessage.set('');
    
    // Validate doctor email domain
    if (this.role() === 'doctor' && !this.email().endsWith('@students.nsbm.ac.lk')) {
      this.errorMessage.set('Doctor accounts must use @students.nsbm.ac.lk email domain');
      return;
    }
    
    this.isSubmitting.set(true);

    const credentials: LoginRequest = {
      email: this.email(),
      password: this.password()
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        const user = response.user;
        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.role === 'DOCTOR') {
          this.router.navigate(['/doctor/dashboard']);
        } else {
          // Patient: check if already has an assigned doctor
          this.predictionService.getAssignedDoctor().subscribe({
            next: (doctor) => {
              if (doctor) {
                // Skip doctor picker — go straight to dashboard
                this.router.navigate(['/patient/dashboard'], {
                  state: { selectedDoctor: doctor }
                });
              } else {
                // First time — show doctor selection
                this.router.navigate(['/patient/doctors']);
              }
            },
            error: () => {
              // Fallback to doctor picker if check fails
              this.router.navigate(['/patient/doctors']);
            }
          });
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  handleRegister(): void {
    this.errorMessage.set('');
    
    // Validate doctor email domain
    if (this.role() === 'doctor' && !this.email().endsWith('@students.nsbm.ac.lk')) {
      this.errorMessage.set('Doctor accounts must use @students.nsbm.ac.lk email domain');
      return;
    }
    
    this.isSubmitting.set(true);

    const registerData: RegisterRequest = {
      email: this.email(),
      password: this.password(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      role: this.role().toUpperCase() as 'PATIENT' | 'DOCTOR'
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        // Redirect based on role
        if (this.role() === 'doctor') {
          this.router.navigate(['/doctor/dashboard']);
        } else {
          this.router.navigate(['/patient/doctors']);
        }
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
      }
    });
  }
}
