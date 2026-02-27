import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { StarRating } from '../../../../shared/components/star-rating/star-rating';
import { finalize, timeout } from 'rxjs/operators';
import { AdminFormModal } from '../../../../shared/components/admin-form-modal/admin-form-modal';
import { AdminConfirmModal } from '../../../../shared/components/admin-confirm-modal/admin-confirm-modal';
import { AdminTable, AdminTableColumn } from '../../../../shared/components/admin-table/admin-table';
import { Book, Review } from '../../../../core/models';

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
    AdminFormModal,
    AdminConfirmModal,
  ],
  templateUrl: './admin-reviews.html',
  styleUrl: './admin-reviews.css',
})
export class AdminReviews implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  booksLoading = signal(true);
  selectedBookId = signal('');
  books = signal<Book[]>([]);
  reviews = signal<Review[]>([]);

  minRating: number | '' = '';
  sort: SortType = 'createdAt:desc';
  page = 1;
  pageSize = 10;

  columns: AdminTableColumn[] = [
    { label: 'Rating', width: '140px' },
    { label: 'Comment' },
    { label: 'User', width: '220px' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '160px', align: 'end' },
  ];

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  selectedForDelete = signal<Review | null>(null);
  draft = signal<{ rating: number; comment: string }>({ rating: 5, comment: '' });

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.booksLoading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/books`)
      .pipe(
        timeout(15000),
        finalize(() => this.booksLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          const books = res.data.books ? res.data.books : [];
          this.books.set(books);
        },
        error: () => {
          this.errorMessage.set('Failed to load books.');
          this.loading.set(false);
          this.books.set([]);
        },
      });
  }

  fetchReviews(): void {
    const bookId = this.selectedBookId();
    if (!bookId) {
      this.reviews.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/books/${bookId}/reviews`)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          const reviews = res.data.reviews ? res.data.reviews : [];
          this.reviews.set(reviews);
        },
        error: () => {
          this.errorMessage.set('Failed to load reviews.');
        },
      });
  }

  onBookChange(bookId: string): void {
    this.selectedBookId.set(bookId);
    this.page = 1;
    this.fetchReviews();
  }

  openEdit(review: Review): void {
    this.editingId.set(review?._id ?? null);
    this.draft.set({ rating: Number(review?.rating) || 0, comment: String(review?.comment ?? '') });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDraft(): void {
    const rating = Math.max(1, Math.min(5, Number(this.draft().rating) || 1));
    const comment = this.draft().comment;

    const id = this.editingId();
    if (id) {
      this.reviews.set(this.reviews().map((r) => (r?._id === id ? { ...r, rating, comment } : r)));
    }
    this.formOpen.set(false);
  }

  openDelete(review: any): void {
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
    this.reviews.set(this.reviews().filter((r) => r?._id !== selected._id));
    this.closeDelete();
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

  get filteredReviews(): any[] {
    let items = [...(this.reviews() || [])];

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
