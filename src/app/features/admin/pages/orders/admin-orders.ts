import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { AdminModal } from '../../../../shared/components/admin-modal/admin-modal';
import { finalize, timeout } from 'rxjs/operators';
import { AdminFormModal } from '../../../../shared/components/admin-form-modal/admin-form-modal';
import { AdminConfirmModal } from '../../../../shared/components/admin-confirm-modal/admin-confirm-modal';
import { AdminTable, AdminTableColumn } from '../../../../shared/components/admin-table/admin-table';
import { Order } from '../../../../core/models';

type SortType = 'createdAt:desc' | 'createdAt:asc' | 'total:desc' | 'total:asc' | '';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminToolbar,
    AdminTable,
    AdminModal,
    AdminFormModal,
    AdminConfirmModal,
  ],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements OnInit {
  loading = signal(true);
  errorMessage = signal('');

  statusFilter = '';
  paymentFilter = '';
  sort: SortType = 'createdAt:desc';

  page = 1;
  pageSize = 10;

  orders = signal<Order[]>([]);

  columns: AdminTableColumn[] = [
    { label: 'Order', width: '120px' },
    { label: 'User' },
    { label: 'Items', width: '110px' },
    { label: 'Total', width: '140px' },
    { label: 'Status', width: '160px' },
    { label: 'Payment', width: '160px' },
    { label: 'Created', width: '190px' },
    { label: 'Actions', width: '190px', align: 'end' },
  ];

  viewOpen = false;
  selectedOrder: Order | null = null;

  formOpen = signal(false);
  deleteOpen = signal(false);
  editingId = signal<string | null>(null);
  selectedForDelete = signal<Order | null>(null);
  draft = signal<{ status: string; paymentStatus: string }>({ status: 'processing', paymentStatus: 'pending' });

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http
      .get<any>(`${environment.apiUrl}/orders?page=1&limit=200`, {
      })
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.orders.set(res.data.data ? res.data.data : []);
        },
        error: (err) => {
          this.orders.set([]);
          this.errorMessage.set('Failed to load orders.');
        },
      });
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

  openView(order: Order): void {
    this.selectedOrder = order;
    this.viewOpen = true;
  }

  closeView(): void {
    this.viewOpen = false;
    this.selectedOrder = null;
  }

  openEdit(order: Order): void {
    this.editingId.set(order?._id ?? null);
    this.draft.set({
      status: String(order?.status ?? 'processing'),
      paymentStatus: String(order?.paymentStatus ?? 'pending'),
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDraft(): void {
    const id = this.editingId();
    const draft = this.draft();

    if (id) {
      this.orders.set(this.orders().map((o) =>
        o?._id === id
          ? {
              ...o,
              status: draft.status as Order['status'],
              paymentStatus: draft.paymentStatus as Order['paymentStatus'],
            }
          : o
      ));
    }
    this.formOpen.set(false);
  }

  openDelete(order: Order): void {
    this.selectedForDelete.set(order);
    this.deleteOpen.set(true);
  }

  closeDelete(): void {
    this.deleteOpen.set(false);
    this.selectedForDelete.set(null);
  }

  confirmDelete(): void {
    const selected = this.selectedForDelete();
    if (!selected?._id) return;
    this.orders.set(this.orders().filter((o) => o?._id !== selected._id));
    this.closeDelete();
  }

  orderTotal(order: Order): number {
    const items = Array.isArray(order?.items) ? order.items : [];
    return items.reduce((sum: number, item: any) => {
      return sum + (Number(item?.quantity) || 0) * (Number(item?.priceAtPurchase) || 0);
    }, 0);
  }

  get filteredOrders(): any[] {
    let items = [...(this.orders() || [])];

    if (this.statusFilter) items = items.filter((o) => String(o?.status ?? '') === this.statusFilter);
    if (this.paymentFilter) items = items.filter((o) => String(o?.paymentStatus ?? '') === this.paymentFilter);

    if (this.sort) {
      const [sortBy, sortOrder] = this.sort.split(':');
      const dir = sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        if (sortBy === 'total') return (this.orderTotal(a) - this.orderTotal(b)) * dir;
        const at = new Date(a?.createdAt ?? 0).getTime();
        const bt = new Date(b?.createdAt ?? 0).getTime();
        return (at - bt) * dir;
      });
    }

    return items;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  get pagedOrders(): Order[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get rows(): Order[] {
    return this.pagedOrders;
  }
}
