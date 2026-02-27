import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminToolbar } from '../../../../shared/components/admin-toolbar/admin-toolbar';
import { AdminModal } from '../../../../shared/components/admin-modal/admin-modal';
import { finalize, timeout } from 'rxjs/operators';
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
    AdminConfirmModal,
  ],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements OnInit {
  loading = signal(true);
  saving = signal(false);
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

  advanceOpen = signal(false);
  selectedForAdvance = signal<Order | null>(null);
  nextStatus = signal<Order['status'] | null>(null);

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
        error: () => {
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

  openAdvance(order: Order): void {
    const next = this.getNextStatus(order?.status);
    if (!next) return;
    this.selectedForAdvance.set(order);
    this.nextStatus.set(next);
    this.advanceOpen.set(true);
  }

  closeAdvance(): void {
    this.advanceOpen.set(false);
    this.selectedForAdvance.set(null);
    this.nextStatus.set(null);
  }

  confirmAdvance(): void {
    const order = this.selectedForAdvance();
    const status = this.nextStatus();
    if (!order?._id || !status) return;

    this.saving.set(true);
    this.errorMessage.set('');

    this.http
      .patch<any>(`${environment.apiUrl}/orders/${order._id}`, { status })
      .pipe(
        timeout(15000),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.closeAdvance();
          this.fetchOrders();
        },
        error: () => {
          this.errorMessage.set('Failed to update order status.');
        },
      });
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

  formatStatus(status: string): string {
    if (!status) return '';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatPayment(payment: string): string {
    if (!payment) return '';
    return payment.charAt(0).toUpperCase() + payment.slice(1);
  }

  getNextStatus(current: Order['status'] | string | null | undefined): Order['status'] | null {
    if (current === 'processing') return 'out_for_delivery';
    if (current === 'out_for_delivery') return 'delivered';
    return null;
  }
}
