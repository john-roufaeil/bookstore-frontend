import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service/auth-service';
import { inject } from '@angular/core';


export function matchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (abstractControl: AbstractControl): ValidationErrors | null => {
    const control = abstractControl.get(controlName);
    const matchingControl = abstractControl.get(matchingControlName);

    if (matchingControl?.errors && !matchingControl.errors['matchValidator']) {
      return null;
    }

    if (control?.value !== matchingControl?.value) {
      const error = { matchValidator: true };
      matchingControl?.setErrors(error);
      return error;
    } else {
      matchingControl?.setErrors(null);
      return null;
    }
  };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal(false);
  showPassword = false;
  showReconfirmPassword = false;
  serverError = signal('');

  registerForm!: FormGroup;

  ngOnInit(): void {
    this.formInit();
  }

  formInit() {
    this.registerForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required, Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,50}/)]),
      reconfirmPassword: new FormControl(null, [Validators.required]),
      firstName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(25), Validators.pattern('^[a-zA-Z]{2,25}$')]),
      lastName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(25), Validators.pattern('^[a-zA-Z]{2,25}$')]),
      dob: new FormControl(null, [Validators.required]),
    }, { validators: matchValidator('password', 'reconfirmPassword') });
  }

  submitRegisterForm() {
    if (this.registerForm.invalid) return;

    const formData = this.registerForm.value;
    this.isLoading.set(true);
    this.serverError.set('');
    this.registerForm.disable();

    this.authService.registerForm(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Registration failed. Please try again.');
        this.isLoading.set(false);
        this.registerForm.enable();
      },
    });
  }
}
