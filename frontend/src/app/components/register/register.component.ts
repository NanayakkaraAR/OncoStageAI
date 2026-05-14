import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  formData: RegisterRequest = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'PATIENT'
  };
  errorMessage = '';
  successMessage = '';
  loading = false;
  isDoctorDomain = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onEmailChange(email: string): void {
    if (email.endsWith('@students.nsbm.ac.lk')) {
      this.isDoctorDomain = true;
      this.formData.role = 'DOCTOR';
    } else {
      this.isDoctorDomain = false;
      this.formData.role = 'PATIENT';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    // Validate required fields
    if (!this.formData.email || !this.formData.password || !this.formData.firstName || !this.formData.lastName) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    this.loading = true;

    // Enforce domain rule before submission
    if (this.formData.email.endsWith('@students.nsbm.ac.lk')) {
      this.formData.role = 'DOCTOR';
    }

    console.log('Submitting registration:', this.formData);

    this.authService.register(this.formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.loading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
