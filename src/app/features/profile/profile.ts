import { Component, OnInit, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service/auth-service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly authService = inject(AuthService);

  user: any = {
    firstName: '',
    lastName: '',
    email: '',
    joinDate: '',
    bio: '',
    stats: {
      booksRead: 0,
      reviews: 0,
      wishlist: 0
    }
  };

  profileForm!: FormGroup;
  isEditing = false;
  isLoading = signal(false);
  successMessage = signal('');
  serverError = signal('');

  ngOnInit(): void {
    // Decode the JWT — no API call
    const decoded = this.authService.getCurrentUser();

    if (decoded) {
      this.user = {
        firstName: decoded.firstName || decoded.first_name || '',
        lastName: decoded.lastName || decoded.last_name || '',
        email: decoded.email || '',
        joinDate: decoded.iat ? new Date(decoded.iat * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
        bio: decoded.bio || '',
        stats: {
          booksRead: 0,
          reviews: 0,
          wishlist: 0
        }
      };
    }

    this.profileForm = new FormGroup({
      firstName: new FormControl(this.user.firstName, [Validators.required]),
      lastName: new FormControl(this.user.lastName, [Validators.required]),
      email: new FormControl({ value: this.user.email, disabled: true }),
      bio: new FormControl(this.user.bio)
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.successMessage.set('');
    this.serverError.set('');
    if (!this.isEditing) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        bio: this.user.bio
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.serverError.set('');
    this.successMessage.set('');

    const formData = this.profileForm.getRawValue();

    this.authService.updateProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
    }).subscribe({
      next: () => {
        this.user.firstName = formData.firstName;
        this.user.lastName = formData.lastName;
        this.user.bio = formData.bio;
        this.isEditing = false;
        this.isLoading.set(false);
        this.successMessage.set('Profile updated successfully!');
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Failed to update profile.');
        this.isLoading.set(false);
      },
    });
  }
}
