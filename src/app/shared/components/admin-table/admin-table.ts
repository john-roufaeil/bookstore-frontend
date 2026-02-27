import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, ContentChild, output, input } from '@angular/core';
import { DataTable } from '../data-table/data-table';

export type AdminTableColumn = {
  label: string;
  width?: string;
  align?: 'start' | 'end';
};

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule, DataTable],
  templateUrl: './admin-table.html',
})
export class AdminTable {
  columns = input<AdminTableColumn[]>([]);
  rows = input<any[]>([]);
  loading = input(false);

  emptyText = input('No results.');
  emptyIcon = input('bi bi-journal-x');

  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  @ContentChild(TemplateRef) rowTemplate?: TemplateRef<any>;

  trackByValue(index: number, row: any): any {
    return row?._id ?? index;
  }
}

