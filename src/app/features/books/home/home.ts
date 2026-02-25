import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookCard } from '../../../shared/components/book-card/book-card';
import { BookService } from '../../../core/services/book.service';
import { AuthorService } from '../../../core/services/author.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCard],
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

    this.authorService.getAuthors().subscribe({
      next: (data) => {
        this.popularAuthors.set((data as any[]).slice(0, 4));
      }
    });
  }

  onAddToCart(book: any): void {
    alert(`Added "${book.name}" to cart!`);
  }
}
