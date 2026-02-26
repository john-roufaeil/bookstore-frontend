import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service/auth-service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal(false);
  showPassword = false;
  serverError = signal('');

  loginForm!: FormGroup;

  ngOnInit(): void {
    this.formInit();
  }

  formInit() {
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  submitLogin() {
    if (this.loginForm.invalid) return;

    const formData = this.loginForm.value;
    this.isLoading.set(true);
    this.serverError.set('');
    this.loginForm.disable();

    this.authService.loginForm(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Login failed. Please try again.');
        this.isLoading.set(false);
        this.loginForm.enable();
      },
    });
  }
}
