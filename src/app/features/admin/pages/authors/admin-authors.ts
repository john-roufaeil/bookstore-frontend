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
import { Author } from '../../../../core/models';

type SortType =
  | 'createdAt:desc'
  | 'createdAt:asc'
  | 'bookCount:desc'
  | 'bookCount:asc'
  | '';

@Component({
  selector: 'app-admin-authors',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToolbar, AdminTable, AdminFormModal, AdminConfirmModal],
  templateUrl: './admin-authors.html',
  styleUrl: './admin-authors.css',
})
export class AdminAuthors implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  search = '';
  sort: SortType = '';

  page = 1;
  pageSize = 10;

  authors = signal<Author[]>([]);

  columns: AdminTableColumn[] = [
    { label: 'Name' },
    { label: 'Books', width: '120px' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '160px', align: 'end' },
  ];

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  draft = signal<{ name: string; bio: string }>({ name: '', bio: '' });

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchAuthors();
  }

  fetchAuthors(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/authors`)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.authors.set((res.data.authors) ? res.data.authors : []);
        },
        error: () => {
          this.errorMessage.set('Failed to load authors.');
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

  get filteredAuthors(): Author[] {
    const query = this.search.trim().toLowerCase();
    let items = [...(this.authors() || [])];

    if (query) {
      items = items.filter((a) => String(a?.name ?? '').toLowerCase().includes(query));
    }

    if (this.sort) {
      const [sortBy, sortOrder] = this.sort.split(':');
      const dir = sortOrder === 'desc' ? -1 : 1;

      items.sort((a, b) => {
        if (sortBy === 'bookCount') {
          const a1 = Number(a?.bookCount) || 0;
          const b1 = Number(b?.bookCount) || 0;
          return (a1 - b1) * dir;
        }
        if (sortBy === 'createdAt') {
          const a2 = new Date(a?.createdAt ?? 0).getTime();
          const b2 = new Date(b?.createdAt ?? 0).getTime();
          return (a2 - b2) * dir;
        }
        return 0;
      });
    }

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAuthors.length / this.pageSize));
  }

  get pagedAuthors(): Author[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredAuthors.slice(start, start + this.pageSize);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.draft.set({ name: '', bio: '' });
    this.formOpen.set(true);
  }

  openEdit(author: Author): void {
    this.editingId.set(author?._id ?? null);
    this.draft.set({ name: String(author?.name ?? ''), bio: String(author?.bio ?? '') });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDraft(): void {
    const { name, bio } = this.draft();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = this.editingId();
    if (id) {
      const updated = this.authors().map((a) =>
        a?._id === id ? { ...a, name: trimmedName, bio } : a
      );
      this.authors.set(updated);
    } else {
      const newAuthor = {
        name: trimmedName,
        bio
      };
      this.authors.set([newAuthor, ...this.authors()]);
    }

    this.formOpen.set(false);
  }

  selectedForDelete = signal<Author | null>(null);

  openDelete(author: Author): void {
    this.selectedForDelete.set(author);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedForDelete();
    if (!selected?._id) return;
    this.authors.set(this.authors().filter((a) => a?._id !== selected._id));
    this.closeDelete();
  }
}
