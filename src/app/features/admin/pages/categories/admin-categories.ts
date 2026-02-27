import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { finalize, timeout } from 'rxjs/operators';
import { AdminFormModal } from '../../../../shared/components/admin-form-modal/admin-form-modal';
import { AdminConfirmModal } from '../../../../shared/components/admin-confirm-modal/admin-confirm-modal';
import { AdminTable, AdminTableColumn } from '../../../../shared/components/admin-table/admin-table';
import { Category } from '../../../../core/models';

type SortType = 'createdAt:desc' | 'createdAt:asc' | '';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToolbar, AdminTable, AdminFormModal, AdminConfirmModal],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  search = '';
  sort: SortType = '';

  page = 1;
  pageSize = 10;

  categories = signal<Category[]>([]);

  columns: AdminTableColumn[] = [
    { label: 'Name' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '160px', align: 'end' },
  ];

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  draftName = signal('');
  selectedForDelete = signal<Category | null>(null);

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/categories`)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          const categories = res.data.categories ? res.data.categories: [];
          this.categories.set(categories);
        },
        error: () => {
          this.errorMessage.set('Failed to load categories.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
  }

  onSortChange(value: SortType): void {
    this.sort = value;
    this.page = 1;
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  get filteredCategories(): Category[] {
    const query = this.search.trim().toLowerCase();
    let items = [...(this.categories() || [])];

    if (query) {
      items = items.filter((c) => String(c?.name ?? '').toLowerCase().includes(query));
    }

    if (this.sort) {
      const [sortBy, sortOrder] = this.sort.split(':');
      const dir = sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const at = new Date(a?.createdAt ?? 0).getTime();
        const bt = new Date(b?.createdAt ?? 0).getTime();
        return (at - bt) * dir;
      });
    }

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
  }

  get pagedCategories(): Category[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.draftName.set('');
    this.formOpen.set(true);
  }

  openEdit(category: Category): void {
    this.editingId.set(category?._id ?? null);
    this.draftName.set(String(category?.name ?? ''));
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDraft(): void {
    const name = this.draftName().trim();
    if (!name) return;

    const id = this.editingId();
    if (id) {
      this.categories.set(this.categories().map((c) => (c?._id === id ? { ...c, name } : c)));
    } else {
      const newCategory = {
        _id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
        name,
        createdAt: new Date().toISOString(),
      };
      this.categories.set([newCategory, ...this.categories()]);
    }

    this.formOpen.set(false);
  }

  openDelete(category: Category): void {
    this.selectedForDelete.set(category);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedForDelete();
    if (!selected?._id) return;
    this.categories.set(this.categories().filter((c) => c?._id !== selected._id));
    this.closeDelete();
  }
}
