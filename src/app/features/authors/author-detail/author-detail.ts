import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthorService } from '../../../core/services/author.service';
import { Author } from '../../../core/models/author.model';
import { BookCard } from '../../../shared/components/book-card/book-card';

@Component({
  selector: 'app-author-detail',
  standalone: true,
  imports: [CommonModule, BookCard, RouterLink],
  templateUrl: './author-detail.html',
  styleUrl: './author-detail.css',
})
export class AuthorDetail implements OnInit {
  author = signal<Author | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private authorService: AuthorService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading.set(true);
      this.authorService.getAuthor(id).subscribe({
        next: (author) => {
          this.author.set(author);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });

    } else {
      this.loading.set(false);
    }
  }
}
