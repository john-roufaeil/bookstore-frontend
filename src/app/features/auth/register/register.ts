import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Custom validator to check if two fields match
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
export class Register {
  showPassword = false;
  showReconfirmPassword = false;

  registerForm: FormGroup = new FormGroup({
  email:new FormControl(null,[Validators.required,Validators.email]),
  password:new FormControl(null,[Validators.required,Validators.pattern('^[a-zA-Z0-9]{8,50}$')]),
  reconfirmPassword: new FormControl(null, [Validators.required]),
  firstName:new FormControl(null,[Validators.required , Validators.minLength(2) , Validators.maxLength(25), Validators.pattern('^[a-zA-Z]{2,25}$')]),
  lastName:new FormControl(null,[Validators.required , Validators.minLength(2) , Validators.maxLength(25), Validators.pattern('^[a-zA-Z]{2,25}$')]),
  dateOfBirth: new FormControl(null,[Validators.required]),
}, { validators: matchValidator('password', 'reconfirmPassword') })

submitRegisterForm(){
  console.log(this.registerForm.value);
}
}
