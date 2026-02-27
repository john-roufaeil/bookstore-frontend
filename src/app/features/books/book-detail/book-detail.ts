import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { StarRating } from '../../../shared/components/star-rating/star-rating';
import { BookService } from '../../../core/services/book.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StarRating],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail implements OnInit {
  book = signal<any>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loading.set(true);
        this.bookService.getBook(id).subscribe({
          next: (data) => {
            const enhancedBook = {
              ...data,
              averageRating: data.averageRating || 4.5,
              reviewCount: data.reviewCount || 42,
            };
            this.book.set(enhancedBook);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error fetching book:', err);
            this.loading.set(false);
          },
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  onAddToCart(): void {
    this.cartService.addToCart(this.book()._id);
  }
}
