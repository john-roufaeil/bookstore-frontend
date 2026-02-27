import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, Pagination],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();
}

