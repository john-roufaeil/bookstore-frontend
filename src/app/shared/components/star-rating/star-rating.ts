import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css'
})
export class StarRating {
  rating = input(0);
  readonly = input(true);
  ratingChange = output<number>();

  hoveredStar = signal(0);

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  getStarClass(star: number): string {
    const activeRating = this.hoveredStar() || this.rating();
    return star <= activeRating ? 'bi bi-star-fill star-filled' : 'bi bi-star star-empty';
  }

  onStarHover(star: number): void {
    if (!this.readonly()) {
      this.hoveredStar.set(star);
    }
  }

  onStarLeave(): void {
    this.hoveredStar.set(0);
  }

  onStarClick(star: number): void {
    if (!this.readonly()) {
      this.ratingChange.emit(star);
    }
  }
}
