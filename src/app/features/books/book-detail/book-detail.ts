import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { BookService } from '../../../core/services/book.service';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../core/services/review.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../auth/auth.service/auth-service';
import { Review } from '../../../core/models';
import { StarRating } from '../../../shared/components/star-rating/star-rating';
import { BookReviews } from '../../../shared/components/book-reviews/book-reviews';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StarRating, BookReviews],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail implements OnInit {
  book = signal<any>(null);
  loading = signal(true);

  reviews = signal<Review[]>([]);
  reviewsLoading = signal(false);
  reviewsErrorMessage = signal('');
  reviewSaving = signal(false);
  reviewErrorMessage = signal('');

  myOrdersLoading = signal(false);
  hasOrderedThisBook = signal(false);
  hasDeliveredOrderForThisBook = signal(false);

  draftRating = signal<number>(0);
  draftComment = signal<string>('');

  myReview = computed<Review | null>(() => {
    const me = this.getCurrentUserId();
    if (!me) return null;
    return (
      this.reviews().find((r: any) => {
        const id = r?.user?._id ?? r?.user?.id ?? r?.user;
        return String(id ?? '') === String(me);
      }) ?? null
    );
  });

  canSubmitReview = computed<boolean>(() => this.hasDeliveredOrderForThisBook());
  showReviewForm = computed<boolean>(() => this.authService.isLoggedIn() && this.canSubmitReview());

  averageRating = computed<number>(() => {
    const items = this.reviews();
    if (!items.length) return 0;
    const sum = items.reduce((acc, r) => acc + (Number((r as any)?.rating) || 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  });

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private orderService: OrderService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.bookService.getBook(id).subscribe({
        next: (data) => {
          this.book.set(data);
          this.loading.set(false);
          this.fetchReviews();
          this.fetchEligibility();
        },
        error: (err) => {
          console.error('Error fetching book:', err);
          this.loading.set(false);
        },
      });
    });
  }

  onAddToCart(): void {
    const id = this.book()?._id;
    if (!id) return;
    this.cartService.addToCart(id);
  }

  fetchReviews(): void {
    const bookId = this.book()?._id;
    if (!bookId) return;

    this.reviewsLoading.set(true);
    this.reviewsErrorMessage.set('');
    this.reviewErrorMessage.set('');

    this.reviewService
      .getReviews(bookId)
      .pipe(finalize(() => this.reviewsLoading.set(false)))
      .subscribe({
        next: (items: Review[]) => {
          this.reviews.set(Array.isArray(items) ? items : []);
          this.syncDraftWithMyReview();
        },
        error: () => {
          this.reviews.set([]);
          this.reviewsErrorMessage.set('Failed to load reviews.');
        },
      });
  }

  fetchEligibility(): void {
    const bookId = this.book()?._id;
    if (!bookId) return;

    if (!this.authService.isLoggedIn()) {
      this.hasOrderedThisBook.set(false);
      this.hasDeliveredOrderForThisBook.set(false);
      return;
    }

    this.myOrdersLoading.set(true);
    this.orderService
      .getMyOrders()
      .pipe(finalize(() => this.myOrdersLoading.set(false)))
      .subscribe({
        next: (orders) => {
          const list = Array.isArray(orders) ? orders : [];
          const hasAny = list.some((o: any) => this.orderContainsBook(o, bookId));
          const hasDelivered = list.some((o: any) => this.orderContainsBook(o, bookId) && o?.status === 'delivered');
          this.hasOrderedThisBook.set(hasAny);
          this.hasDeliveredOrderForThisBook.set(hasDelivered);
        },
        error: () => {
          this.hasOrderedThisBook.set(false);
          this.hasDeliveredOrderForThisBook.set(false);
        },
      });
  }

  onDraftRatingChange(rating: number): void {
    this.draftRating.set(rating);
  }

  saveMyReview(): void {
    if (!this.showReviewForm()) return;
    const bookId = this.book()?._id;
    if (!bookId) return;

    const rating = Number(this.draftRating());
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      this.reviewErrorMessage.set('Rating must be between 1 and 5.');
      return;
    }

    this.reviewSaving.set(true);
    this.reviewErrorMessage.set('');

    const comment = this.draftComment().trim();
    const existing = this.myReview();
    const req = existing
      ? this.reviewService.updateReview(existing._id, { rating, comment: comment ? comment : undefined })
      : this.reviewService.createReview(bookId, { rating, comment: comment ? comment : undefined });

    req.pipe(finalize(() => this.reviewSaving.set(false))).subscribe({
      next: () => {
        this.fetchReviews();
      },
      error: () => {
        this.reviewErrorMessage.set(existing ? 'Failed to update your review.' : 'Failed to submit your review.');
      },
    });
  }

  deleteMyReview(): void {
    if (!this.showReviewForm()) return;
    const existing = this.myReview();
    if (!existing?._id) return;

    this.reviewSaving.set(true);
    this.reviewErrorMessage.set('');

    this.reviewService
      .deleteReview(existing._id)
      .pipe(finalize(() => this.reviewSaving.set(false)))
      .subscribe({
        next: () => {
          this.fetchReviews();
        },
        error: () => {
          this.reviewErrorMessage.set('Failed to delete your review.');
        },
      });
  }

  private syncDraftWithMyReview(): void {
    const r = this.myReview();
    if (!r) {
      this.draftRating.set(0);
      this.draftComment.set('');
      return;
    }
    this.draftRating.set(Number((r as any)?.rating) || 0);
    this.draftComment.set(String((r as any)?.comment ?? ''));
  }

  private orderContainsBook(order: any, bookId: string): boolean {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.some((it: any) => {
      const book = it?.bookId ?? it?.book;
      const id = typeof book === 'string' ? book : book?._id;
      return String(id ?? '') === String(bookId);
    });
  }

  private getCurrentUserId(): string | null {
    const u = this.authService.getCurrentUser();
    const id = u?.id ?? u?._id ?? u?.userId ?? u?.sub;
    return id ? String(id) : null;
  }
}
