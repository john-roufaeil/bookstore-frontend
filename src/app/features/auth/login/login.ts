import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service/auth-service';
import { CartService } from '../../../core/services/cart.service';
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
  private readonly cartService = inject(CartService);

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
      next: (res) => {
        this.isLoading.set(false);
        this.cartService.refreshCart();
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        const isAdmin = payload.role === 'admin';
        if (isAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        const msg = err.status === 0
          ? 'Cannot connect to the server. Please check your internet connection.'
          : (err.error?.message || 'Login failed. Please try again.');
        this.serverError.set(msg);
        this.isLoading.set(false);
        this.loginForm.enable();
      },
    });
  }
}
