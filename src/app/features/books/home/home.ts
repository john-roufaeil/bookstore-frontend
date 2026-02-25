import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookCard } from '../../../shared/components/book-card/book-card';
import { AuthorCard } from '../../../shared/components/author-card/author-card';
import { BookService } from '../../../core/services/book.service';
import { AuthorService } from '../../../core/services/author.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCard, AuthorCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  popularBooks = signal<any[]>([]);
  popularAuthors = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private bookService: BookService,
    private authorService: AuthorService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.bookService.getBooks({ limit: 8 }).subscribe({
      next: (data) => {
        this.popularBooks.set(data.books || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.authorService.getAuthors({ limit: 4 }).subscribe({
      next: (data) => {
        this.popularAuthors.set((data as any[] || []));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onAddToCart(book: any): void {
    alert(`Added "${book.name}" to cart!`);
  }
}
