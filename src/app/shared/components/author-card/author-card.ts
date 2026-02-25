import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Author } from '../../../core/models/author.model';

@Component({
  selector: 'app-author-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './author-card.html',
  styleUrl: './author-card.css'
})
export class AuthorCard {
  @Input() author!: Author;
}
