import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private cartService = inject(CartService);

  cartItems = computed(() => this.cartService.getCart());
  cartCount = this.cartService.cartCount;
  cartTotal = this.cartService.cartTotal;

  ngOnInit() {
    this.cartService.refreshCart();
  }

  onIncrement(bookId: string) {
    this.cartService.incrementQuantity(bookId);
  }

  onDecrement(bookId: string) {
    this.cartService.decrementQuantity(bookId);
  }

  onRemove(bookId: string) {
    this.cartService.removeFromCart(bookId);
  }

  onClearCart() {
    this.cartService.clearCart();
  }
}
