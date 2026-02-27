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

type SortType = 'createdAt:desc' | 'createdAt:asc' | '';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminToolbar, AdminTable, AdminFormModal, AdminConfirmModal],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  search = '';
  roleFilter = '';
  verifiedFilter = '';
  sort: SortType = 'createdAt:desc';

  page = 1;
  pageSize = 10;

  users = signal<any[]>([]);

  columns: AdminTableColumn[] = [
    { label: 'Name' },
    { label: 'Email' },
    { label: 'Role', width: '130px' },
    { label: 'Verified', width: '140px' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '160px', align: 'end' },
  ];

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  selectedForDelete = signal<any | null>(null);
  draft = signal<{ firstName: string; lastName: string; email: string; role: string; isVerified: boolean }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    isVerified: false,
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/users`)
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          const data = res?.data ?? res;
          const raw = data?.users ?? data?.items ?? data;
          this.users.set(Array.isArray(raw) ? raw : []);
        },
        error: () => {
          this.errorMessage.set('Failed to load users.');
        },
      });
  }

  onSearchChange(value: string): void {
    this.search = value;
    this.page = 1;
  }

  onFilterChange(): void {
    this.page = 1;
  }

  onSortChange(value: SortType): void {
    this.sort = value;
    this.page = 1;
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  displayName(user: any): string {
    const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return name || '—';
  }

  get filteredUsers(): any[] {
    const query = this.search.trim().toLowerCase();
    let items = [...(this.users() || [])];

    if (query) {
      items = items.filter((u) => {
        const name = this.displayName(u).toLowerCase();
        const email = String(u?.email ?? '').toLowerCase();
        return name.includes(query) || email.includes(query);
      });
    }

    if (this.roleFilter) {
      items = items.filter((u) => String(u?.role ?? '') === this.roleFilter);
    }

    if (this.verifiedFilter) {
      const shouldBeVerified = this.verifiedFilter === 'true';
      items = items.filter((u) => Boolean(u?.isVerified) === shouldBeVerified);
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
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pagedUsers(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.draft.set({ firstName: '', lastName: '', email: '', role: 'user', isVerified: false });
    this.formOpen.set(true);
  }

  openEdit(user: any): void {
    this.editingId.set(user?._id ?? null);
    this.draft.set({
      firstName: String(user?.firstName ?? ''),
      lastName: String(user?.lastName ?? ''),
      email: String(user?.email ?? ''),
      role: String(user?.role ?? 'user'),
      isVerified: !!user?.isVerified,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDraft(): void {
    const d = this.draft();
    const email = d.email.trim();
    if (!email) return;

    const id = this.editingId();
    if (id) {
      this.users.set(this.users().map((u) => (u?._id === id ? { ...u, ...d, email } : u)));
    } else {
      const newUser = {
        _id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
        ...d,
        email,
        createdAt: new Date().toISOString(),
      };
      this.users.set([newUser, ...this.users()]);
    }

    this.formOpen.set(false);
  }

  openDelete(user: any): void {
    this.selectedForDelete.set(user);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedForDelete();
    if (!selected?._id) return;
    this.users.set(this.users().filter((u) => u?._id !== selected._id));
    this.closeDelete();
  }
}
