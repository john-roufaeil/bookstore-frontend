import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { StarRating } from '../../../../shared/components/star-rating/star-rating';
import { finalize, timeout } from 'rxjs/operators';
import { AdminModal } from '../../../../shared/components/admin-modal/admin-modal';
import { AdminConfirmModal } from '../../../../shared/components/admin-confirm-modal/admin-confirm-modal';
import { AdminTable, AdminTableColumn } from '../../../../shared/components/admin-table/admin-table';
import { Review } from '../../../../core/models';

type SortType = 'createdAt:desc' | 'createdAt:asc' | 'rating:desc' | 'rating:asc' | '';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminToolbar,
    AdminTable,
    StarRating,
    AdminModal,
    AdminConfirmModal,
  ],
  templateUrl: './admin-reviews.html',
  styleUrl: './admin-reviews.css',
})
export class AdminReviews implements OnInit {
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');

  reviews = signal<Review[]>([]);

  selectedBookId = signal('');
  minRating: number | '' = '';
  sort: SortType = 'createdAt:desc';
  page = 1;
  pageSize = 10;

  columns: AdminTableColumn[] = [
    { label: 'Book', width: '240px' },
    { label: 'Rating', width: '140px' },
    { label: 'User', width: '220px' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '170px', align: 'end' },
  ];

  viewOpen = signal(false);
  selectedReview = signal<Review | null>(null);
  deleteOpen = signal(false);
  selectedForDelete = signal<Review | null>(null);

  constructor(private http: HttpClient) { }

  fetchReviews(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.http
      .get<any>(`${environment.apiUrl}/reviews`)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.reviews.set(res.data.reviews ? res.data.reviews : []);
        },
        error: () => {
          this.reviews.set([]);
          this.errorMessage.set('Failed to load reviews.');
        }
      });
  }

  ngOnInit(): void {
    this.fetchReviews();
  }

  onBookChange(bookId: string): void {
    this.selectedBookId.set(bookId);
    this.page = 1;
  }

  openView(review: Review): void {
    this.selectedReview.set(review);
    this.viewOpen.set(true);
  }

  closeView(): void {
    this.viewOpen.set(false);
    this.selectedReview.set(null);
  }

  openDelete(review: Review): void {
    this.selectedForDelete.set(review);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedForDelete();
    if (!selected?._id) return;

    this.saving.set(true);
    this.errorMessage.set('');

    this.http
      .delete<any>(`${environment.apiUrl}/reviews/${selected._id}`)
      .pipe(
        timeout(15000),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.closeDelete();
          this.fetchReviews();
        },
        error: () => {
          this.errorMessage.set('Failed to delete review.');
        },
      });
  }

  onFilterChange(): void {
    this.page = 1;
  }

  onSortChange(value: SortType): void {
    this.sort = value;
    this.page = 1;
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  get bookOptions(): Array<{ id: string; name: string }> {
    const map = new Map<string, string>();
    for (const r of this.reviews() || []) {
      const id = r.book?._id;
      const name = r.book?.name ?? '—';
      if (id && !map.has(id)) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }

  get filteredReviews(): any[] {
    let items = [...(this.reviews() || [])];

    const bookId = this.selectedBookId();
    if (bookId) {
      items = items.filter((r) => r.book?._id === bookId);
    }

    if (this.minRating !== '') {
      items = items.filter((r) => Number(r?.rating) >= Number(this.minRating));
    }

    if (this.sort) {
      const [sortBy, sortOrder] = this.sort.split(':');
      const dir = sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        if (sortBy === 'rating') {
          return ((Number(a?.rating) || 0) - (Number(b?.rating) || 0)) * dir;
        }
        const at = new Date(a?.createdAt ?? 0).getTime();
        const bt = new Date(b?.createdAt ?? 0).getTime();
        return (at - bt) * dir;
      });
    }

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReviews.length / this.pageSize));
  }

  get pagedReviews(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredReviews.slice(start, start + this.pageSize);
  }
}
