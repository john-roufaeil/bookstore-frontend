import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartItem } from '../models/cart.model';
import { Book } from '../models/book.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  // Signal state for reactive UI
  private cartItems = signal<CartItem[]>([]);

  // Computed signals
  cartCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  cartTotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.book.price * item.quantity, 0),
  );

  constructor(private http: HttpClient) {}

  // Map backend response shape to frontend CartItem[]
  private mapCartResponse(data: any): CartItem[] {
    const cart = data.cart;
    if (!cart || !cart.books || cart.books.length === 0) return [];
    return cart.books.map((item: any) => ({
      book: item.bookId,
      quantity: item.quantity,
    }));
  }

  refreshCart() {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.cartItems.set(this.mapCartResponse(res.data));
      },
      error: () => {
        this.cartItems.set([]);
      },
    });
  }

  getCart(): CartItem[] {
    return this.cartItems();
  }

  addToCart(bookId: string, quantity: number = 1) {
    this.http.post<any>(this.apiUrl, { bookId, quantity }).subscribe({
      next: (res) => {
        this.cartItems.set(this.mapCartResponse(res.data));
      },
    });
  }

  removeFromCart(bookId: string) {
    this.http.delete<any>(this.apiUrl, { body: { bookId } }).subscribe({
      next: (res) => {
        // After removal, refresh cart to get updated data
        this.refreshCart();
      },
    });
  }

  incrementQuantity(bookId: string) {
    this.http.patch<any>(`${this.apiUrl}/quantity`, { bookId, action: 'increment' }).subscribe({
      next: (res) => {
        this.cartItems.set(this.mapCartResponse(res.data));
      },
    });
  }

  decrementQuantity(bookId: string) {
    this.http.patch<any>(`${this.apiUrl}/quantity`, { bookId, action: 'decrement' }).subscribe({
      next: (res) => {
        this.cartItems.set(this.mapCartResponse(res.data));
      },
    });
  }

  clearCart() {
    this.cartItems.set([]);
  }
}
