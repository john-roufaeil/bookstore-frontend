import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Injector, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  skip,
  switchMap,
  timeout,
} from 'rxjs/operators';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthorService } from '../../../../core/services/author.service';
import { BookService } from '../../../../core/services/book.service';
import { CategoryService } from '../../../../core/services/category.service';
import { UploadService } from '../../../../core/services/upload.service';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { Author, Book, Category } from '../../../../core/models';

type ModalType = 'create' | 'edit' | 'delete';

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTable],
  templateUrl: './admin-books.html',
  styleUrl: './admin-books.css',
})
export class AdminBooks implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  coverPreviewUrl = signal<string | null>(null);

  private coverFile: File | null = null;
  private coverObjectUrl: string | null = null;

  search = signal('');
  authorFilter = signal('');
  categoryFilter = signal('');
  sort = signal<'price:asc' | 'price:desc' | 'stock:asc' | 'stock:desc' | ''>('');
  currentPage = signal(1);
  totalPages = signal(1);
  limit = signal(10);

  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  authors = signal<Author[]>([]);

  modal = signal<ModalType | null>(null);
  selectedBook = signal<Book | null>(null);

  isFormModalOpen = computed(() => this.modal() === 'create' || this.modal() === 'edit');

  bookForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    author: ['', [Validators.required]],
    category: [''],
    coverImage: [''],
  });

  constructor(
    private bookService: BookService,
    private categoryService: CategoryService,
    private authorService: AuthorService,
    private uploadService: UploadService
  ) { }

  ngOnInit(): void {
    this.loadLookups();
    this.bindInstantSearch();
    this.loadBooks();
  }

  private bindInstantSearch(): void {
    toObservable(this.search, { injector: this.injector })
      .pipe(skip(1), debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadBooks();
      });
  }

  loadLookups(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data || []),
    });

    this.authorService.getAuthors({ limit: 200 }).subscribe({
      next: (data) => this.authors.set(data || []),
    });
  }

  loadBooks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit(),
    };
    if (this.search().trim()) params.search = this.search().trim();
    if (this.authorFilter()) params.author = this.authorFilter();
    if (this.categoryFilter()) params.category = this.categoryFilter();

    const sort = this.sort();
    if (sort) {
      const [sortBy, sortOrder] = sort.split(':');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }

    this.bookService
      .getBooks(params)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (data) => {
          const items = Array.isArray(data?.books) ? data.books : [];
          this.books.set(this.applyClientSort(items));
          this.totalPages.set(data?.totalPages || 1);
        },
        error: () => {
          this.errorMessage.set('Failed to load books.');
        },
      });
  }

  private applyClientSort(items: any[]): any[] {
    const sort = this.sort();
    if (!sort) return items;

    const sorted = [...items];
    const [sortBy, sortOrder] = sort.split(':') as ['price' | 'stock', 'asc' | 'desc'];
    const direction = sortOrder === 'desc' ? -1 : 1;

    const value = (book: any): number => {
      const raw = sortBy === 'price' ? book?.price : book?.stock;
      const numeric = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    sorted.sort((a, b) => (value(a) - value(b)) * direction);
    return sorted;
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadBooks();
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  clearSearch(): void {
    this.search.set('');
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  openCreate(): void {
    this.errorMessage.set(null);
    this.selectedBook.set(null);
    this.setCoverFile(null);
    this.bookForm.reset({
      name: '',
      price: 0,
      stock: 0,
      author: '',
      category: '',
      coverImage: '',
    });
    this.modal.set('create');
  }

  openEdit(book: any): void {
    this.errorMessage.set(null);
    this.selectedBook.set(book);

    const authorId = typeof book?.author === 'string' ? book.author : book?.author?._id;
    const categoryId = typeof book?.category === 'string' ? book.category : book?.category?._id;

    this.bookForm.reset({
      name: book?.name ?? '',
      price: book?.price ?? 0,
      stock: book?.stock ?? 0,
      author: authorId ?? '',
      category: categoryId ?? '',
      coverImage: book?.coverImage ?? '',
    });
    this.setCoverFile(null, book?.coverImage ?? null);

    this.modal.set('edit');
  }

  openDelete(book: any): void {
    this.errorMessage.set(null);
    this.selectedBook.set(book);
    this.modal.set('delete');
  }

  closeModal(): void {
    this.modal.set(null);
    this.selectedBook.set(null);
    this.saving.set(false);
    this.setCoverFile(null);
  }

  onCoverFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.setCoverFile(file);
  }

  private setCoverFile(file: File | null, previewUrl: string | null = null): void {
    if (this.coverObjectUrl) {
      URL.revokeObjectURL(this.coverObjectUrl);
      this.coverObjectUrl = null;
    }

    this.coverFile = file;

    if (file) {
      this.coverObjectUrl = URL.createObjectURL(file);
      this.coverPreviewUrl.set(this.coverObjectUrl);
      return;
    }

    this.coverPreviewUrl.set(previewUrl);
  }

  saveBook(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload: any = {
      ...this.bookForm.getRawValue(),
    };

    const modal = this.modal();
    const selected = this.selectedBook();

    const save$ =
      modal === 'edit' && selected?._id
        ? this.bookService.updateBook(selected._id, payload)
        : this.bookService.createBook(payload);

    const request$ = this.coverFile
      ? this.uploadService.uploadBookCover(this.coverFile).pipe(
        catchError(() => {
          this.saving.set(false);
          this.errorMessage.set('Failed to upload cover image.');
          return EMPTY;
        }),
        switchMap((upload) => {
          payload.coverImage = upload.secureUrl;
          payload.coverImagePublicId = upload.publicId;
          return save$;
        })
      )
      : save$;

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadBooks();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(modal === 'edit' ? 'Failed to update book.' : 'Failed to create book.');
      },
    });
  }

  confirmDelete(): void {
    const selected = this.selectedBook();
    if (!selected?._id) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    this.bookService.deleteBook(selected._id).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadBooks();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Failed to delete book.');
      },
    });
  }

  trackById(_: number, item: any): string {
    return item?._id;
  }

  displayAuthor(book: any): string {
    if (!book?.author) return '—';
    if (typeof book.author === 'string') return '—';
    return book.author?.name ?? '—';
  }

  displayCategory(book: any): string {
    if (!book?.category) return '—';
    if (typeof book.category === 'string') return '—';
    return book.category?.name ?? '—';
  }
}
