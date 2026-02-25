import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-card.html',
  styleUrl: './book-card.css'
})
export class BookCard {
  book = input<any>();
  addToCart = output<any>();

  isOutOfStock = computed(() => this.book()?.stock === 0);

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.isOutOfStock()) {
      this.addToCart.emit(this.book());
    }
  }
}
