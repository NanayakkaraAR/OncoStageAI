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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService.register(this.formData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting...';
        
        setTimeout(() => {
          if (this.formData.role === 'DOCTOR') {
            this.router.navigate(['/doctor/dashboard']);
          } else if (this.formData.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/patient/dashboard']);
          }
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
