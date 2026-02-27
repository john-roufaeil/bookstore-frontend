import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { Review } from '../../../core/models';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-book-reviews',
  standalone: true,
  imports: [CommonModule, StarRating],
  templateUrl: './book-reviews.html',
})
export class BookReviews {
  reviews = input<Review[]>([]);
  loading = input(false);
  error = input('');
}
