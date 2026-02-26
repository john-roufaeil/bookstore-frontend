import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  user = {
    firstName: 'Mohamed',
    lastName: 'Khaled',
    email: 'mohamed.khaled@example.com',
    joinDate: 'February 2026',
    avatar: 'assets/images/avatar-placeholder.png', 
    bio: 'Avid reader and book collector. Lover of fiction and history.',
    stats: {
      booksRead: 12,
      reviews: 5,
      wishlist: 24
    }
  };

  profileForm: FormGroup = new FormGroup({
    firstName: new FormControl(this.user.firstName, [Validators.required]),
    lastName: new FormControl(this.user.lastName, [Validators.required]),
    email: new FormControl({ value: this.user.email, disabled: true }),
    bio: new FormControl(this.user.bio)
  });

  isEditing = false;

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        bio: this.user.bio
      });
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.user.firstName = this.profileForm.get('firstName')?.value;
      this.user.lastName = this.profileForm.get('lastName')?.value;
      this.user.bio = this.profileForm.get('bio')?.value;
      this.isEditing = false;
      console.log('Profile saved:', this.user);
    }
  }
}
