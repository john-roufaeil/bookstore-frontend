import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  shippingForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  cartItems = computed(() => this.cartService.getCart());
  cartTotal = this.cartService.cartTotal;

  constructor() {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{11,15}$/)]],
    });
  }

  ngOnInit() {
    this.cartService.refreshCart();
  }

  onSubmit() {
    if (this.shippingForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const shippingDetails = this.shippingForm.value;

    this.orderService.placeOrder(shippingDetails).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error placing order. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }
}
