import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorService } from '../../../core/services/author.service';
import { Author } from '../../../core/models/author.model';
import { AuthorCard } from '../../../shared/components/author-card/author-card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-author-list',
  standalone: true,
  imports: [CommonModule, AuthorCard, FormsModule],
  templateUrl: './author-list.html',
  styleUrl: './author-list.css',
})
export class AuthorList implements OnInit {
  authors = signal<Author[]>([]);
  search = '';
  loading = signal(true);

  constructor(private authorService: AuthorService) { }

  ngOnInit(): void {
    this.loadAuthors();
  }

  loadAuthors(): void {
    this.loading.set(true);
    this.authorService.getAuthors().subscribe({
      next: (authors) => {
        this.authors.set(authors);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get filteredAuthors() {
    const search = this.search.toLowerCase();
    return this.authors().filter(a => a.name.toLowerCase().includes(search));
  }
}
