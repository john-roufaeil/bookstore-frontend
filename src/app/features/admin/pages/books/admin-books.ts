import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { finalize, map, switchMap, timeout } from 'rxjs/operators';

import { AuthorService } from '../../../../core/services/author.service';
import { BookService } from '../../../../core/services/book.service';
import { CategoryService } from '../../../../core/services/category.service';
import { AdminConfirmModal } from '../../../../shared/components/admin-confirm-modal/admin-confirm-modal';
import { AdminFormModal } from '../../../../shared/components/admin-form-modal/admin-form-modal';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { AdminTable, AdminTableColumn } from '../../../../shared/components/admin-table/admin-table';
import { environment } from '../../../../../environments/environment';

type SortType = 'price:asc' | 'price:desc' | 'stock:asc' | 'stock:desc' | '';

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToolbar, AdminTable, AdminFormModal, AdminConfirmModal],
  templateUrl: './admin-books.html',
  styleUrl: './admin-books.css',
})
export class AdminBooks implements OnInit {
  loading = signal(true);
  saving = signal(false);
  uploadingCover = signal(false);
  pageErrorMessage = signal('');
  modalErrorMessage = signal('');

  search = '';
  authorFilter = '';
  categoryFilter = '';
  sort: SortType = '';

  page = 1;
  pageSize = 10;

  books = signal<any[]>([]);
  authors = signal<any[]>([]);
  categories = signal<any[]>([]);

  columns: AdminTableColumn[] = [
    { label: 'Cover', width: '70px' },
    { label: 'Name' },
    { label: 'Price', width: '110px' },
    { label: 'Stock', width: '110px' },
    { label: 'Author', width: '200px' },
    { label: 'Category', width: '200px' },
    { label: 'Actions', width: '160px', align: 'end' },
  ];

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  selectedForDelete = signal<any | null>(null);

  coverObjectUrl: string | null = null;
  coverPreview = signal<string | null>(null);
  selectedCoverFile = signal<File | null>(null);

  draft = signal<{
    name: string;
    price: number;
    stock: number;
    authorId: string;
    categoryId: string;
    coverImage: string;
  }>({
    name: '',
    price: 0,
    stock: 0,
    authorId: '',
    categoryId: '',
    coverImage: '',
  });

  constructor(
    private http: HttpClient,
    private bookService: BookService,
    private categoryService: CategoryService,
    private authorService: AuthorService
  ) { }

  ngOnInit(): void {
    this.fetchLookups();
    this.fetchBooks();
  }

  fetchLookups(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(Array.isArray(data) ? data : []),
    });

    this.authorService.getAuthors({ limit: 200 }).subscribe({
      next: (data) => this.authors.set(Array.isArray(data) ? data : []),
    });
  }

  fetchBooks(): void {
    this.loading.set(true);
    this.pageErrorMessage.set('');

    this.bookService
      .getBooks({ limit: 200 })
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data) => {
          const items = Array.isArray(data?.books) ? data.books : [];
          this.books.set(items);
        },
        error: () => {
          this.pageErrorMessage.set('Failed to load books.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
  }

  onFilterChange(): void {
    this.page = 1;
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.setCoverPreview(null);
    this.selectedCoverFile.set(null);
    this.modalErrorMessage.set('');
    this.draft.set({
      name: '',
      price: 0,
      stock: 0,
      authorId: '',
      categoryId: '',
      coverImage: '',
    });
    this.formOpen.set(true);
  }

  openEdit(book: any): void {
    const authorId = typeof book?.author === 'string' ? book.author : book?.author?._id;
    const categoryId = typeof book?.category === 'string' ? book.category : book?.category?._id;

    this.editingId.set(book?._id ?? null);
    this.setCoverPreview(book?.coverImage ?? null);
    this.selectedCoverFile.set(null);
    this.modalErrorMessage.set('');
    this.draft.set({
      name: String(book?.name ?? ''),
      price: Number(book?.price) || 0,
      stock: Math.floor(Number(book?.stock) || 0),
      authorId: String(authorId ?? ''),
      categoryId: String(categoryId ?? ''),
      coverImage: String(book?.coverImage ?? ''),
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.modalErrorMessage.set('');
  }

  saveDraft(): void {
    const d = this.draft();
    const name = d.name.trim();
    if (!name) return;
    d.stock = Math.floor(Number(d.stock) || 0);

    const price = Number(d.price);
    if (!Number.isFinite(price) || price < 1 || price > 1000) {
      this.modalErrorMessage.set('Price must be between 1 and 1000.');
      return;
    }

    const stock = Number(d.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      this.modalErrorMessage.set('Stock cannot be negative.');
      return;
    }

    const hasCover = Boolean(d.coverImage) || Boolean(this.selectedCoverFile());
    if (!hasCover) {
      this.modalErrorMessage.set('Cover image is required.');
      return;
    }

    this.saving.set(true);
    this.modalErrorMessage.set('');

    const body: any = {
      name,
      price,
      stock,
      author: d.authorId ? d.authorId : null,
      category: d.categoryId ? d.categoryId : null,
    };

    const id = this.editingId();
    const req = id ? this.bookService.updateBook(id, body) : this.bookService.createBook(body);

    const coverFile = this.selectedCoverFile();
    const coverUrl$ = coverFile ? this.uploadCoverToCloudinary(coverFile) : of(String(d.coverImage ?? ''));

    coverUrl$
      .pipe(
        switchMap((coverUrl) => {
          if (!coverUrl) return throwError(() => new Error('Missing cover upload URL.'));
          body.coverImage = coverUrl;
          return req.pipe(timeout(15000));
        }),
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.formOpen.set(false);
          this.selectedCoverFile.set(null);
          this.fetchBooks();
        },
        error: (err) => {
          const msg =
            String(err?.message ?? '') === 'Missing cover upload URL.'
              ? 'Failed to upload cover image.'
              : id
                ? 'Failed to update book.'
                : 'Failed to create book.';
          this.modalErrorMessage.set(msg);
        },
      });
  }

  openDelete(book: any): void {
    this.selectedForDelete.set(book);
    this.deleteOpen.set(true);
    this.modalErrorMessage.set('');
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
    this.modalErrorMessage.set('');
  }

  confirmDelete(): void {
    this.saving.set(true);
    this.modalErrorMessage.set('');
    const selected = this.selectedForDelete();
    if (!selected?._id) return;

    this.bookService
      .deleteBook(selected._id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.closeDelete();
          this.fetchBooks();
        },
        error: () => {
          this.modalErrorMessage.set('Failed to delete book.');
        },
      });
  }

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    this.setCoverPreview(localPreview);
    this.selectedCoverFile.set(file);
    this.modalErrorMessage.set('');
  }

  private setCoverPreview(url: string | null): void {
    if (this.coverObjectUrl) URL.revokeObjectURL(this.coverObjectUrl);
    this.coverObjectUrl = url;
    this.coverPreview.set(url);
  }

  private uploadCoverToCloudinary(file: File): Observable<string> {
    this.uploadingCover.set(true);
    this.modalErrorMessage.set('');

    return this.http.get<any>(`${environment.apiUrl}/cloudinary-signature`).pipe(
      timeout(15000),
      map((res) => res?.data ?? res),
      switchMap((sig) => {
        const signature = sig?.signature;
        const timestamp = sig?.timestamp;
        const apiKey = sig?.apiKey ?? sig?.api_key ?? environment.cloudinary?.apiKey;
        const cloudName = sig?.cloudName ?? sig?.cloud_name ?? environment.cloudinary?.cloudName;
        const folder = sig?.folder ?? environment.cloudinary?.folder;
        const uploadUrl =
          sig?.uploadUrl ?? (cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : null);

        if (!signature || !timestamp || !apiKey || !uploadUrl) {
          return throwError(() => new Error('Missing Cloudinary signature fields.'));
        }

        const form = new FormData();
        form.append('file', file);
        form.append('api_key', String(apiKey));
        form.append('timestamp', String(timestamp));
        form.append('signature', String(signature));
        if (folder) form.append('folder', String(folder));
        form.append('resource_type', 'image');
        if (cloudName) form.append('cloudName', String(cloudName));

        return this.http.post<any>(uploadUrl, form).pipe(
          timeout(60000),
          map((uploadRes) => String(uploadRes?.secure_url ?? uploadRes?.url ?? ''))
        );
      }),
      finalize(() => this.uploadingCover.set(false))
    );
  }

  displayAuthor(book: any): string {
    if (!book?.author) return '—';
    if (typeof book.author === 'string') {
      return this.authors().find((a) => a?._id === book.author)?.name ?? '—';
    }
    return book.author?.name ?? '—';
  }

  displayCategory(book: any): string {
    if (!book?.category) return '—';
    if (typeof book.category === 'string') {
      return this.categories().find((c) => c?._id === book.category)?.name ?? '—';
    }
    return book.category?.name ?? '—';
  }

  get filteredBooks(): any[] {
    const query = this.search.trim().toLowerCase();
    let items = [...(this.books() || [])];

    if (query) items = items.filter((b) => String(b?.name ?? '').toLowerCase().includes(query));
    if (this.authorFilter) {
      items = items.filter((b) => {
        const id = typeof b?.author === 'string' ? b.author : b?.author?._id;
        return String(id ?? '') === this.authorFilter;
      });
    }
    if (this.categoryFilter) {
      items = items.filter((b) => {
        const id = typeof b?.category === 'string' ? b.category : b?.category?._id;
        return String(id ?? '') === this.categoryFilter;
      });
    }

    if (this.sort) {
      const [sortBy, sortOrder] = this.sort.split(':');
      const dir = sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const av = Number(a?.[sortBy]) || 0;
        const bv = Number(b?.[sortBy]) || 0;
        return (av - bv) * dir;
      });
    }

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBooks.length / this.pageSize));
  }

  get pagedBooks(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredBooks.slice(start, start + this.pageSize);
  }
}
