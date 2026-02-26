import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-authors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-authors.html',
  styleUrl: './admin-authors.css',
})
export class AdminAuthors {}

