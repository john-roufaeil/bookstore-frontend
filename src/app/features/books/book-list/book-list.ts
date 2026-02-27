import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookCard } from '../../../shared/components/book-card/book-card';
import { BookFilters, FilterState } from '../../../shared/components/book-filters/book-filters';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthorService } from '../../../core/services/author.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCard, BookFilters, Pagination, EmptyState],
  templateUrl: './book-list.html',
  styleUrl: './book-list.css',
})
export class BookList implements OnInit {
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  limit = signal(8);

  currentFilters = signal<FilterState>({
    search: '',
    category: '',
    author: '',
    minPrice: null,
    maxPrice: null,
  });

  books = signal<any[]>([]);
  categories = signal<any[]>([]);
  authors = signal<any[]>([]);

  constructor(
    private bookService: BookService,
    private categoryService: CategoryService,
    private authorService: AuthorService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadBooks();
  }

  loadFilters(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data || []),
    });
    this.authorService.getAuthors().subscribe({
      next: (data) => this.authors.set(data || []),
    });
  }

  loadBooks(): void {
    this.loading.set(true);
    const filters = this.currentFilters();
    const params: any = {
      page: this.currentPage(),
      limit: this.limit(),
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.author) params.author = filters.author;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;

    this.bookService.getBooks(params).subscribe({
      next: (data) => {
        this.books.set(data.books || []);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(filters: FilterState): void {
    this.currentFilters.set(filters);
    this.currentPage.set(1);
    this.loadBooks();
  }

  onClearFilters(): void {
    this.currentFilters.set({
      search: '',
      category: '',
      author: '',
      minPrice: null,
      maxPrice: null,
    });
    this.currentPage.set(1);
    this.loadBooks();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadBooks();
  }

  onAddToCart(book: any): void {
    this.cartService.addToCart(book._id);
  }
}
