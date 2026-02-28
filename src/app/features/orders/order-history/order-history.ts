import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CurrencyPipe,
  DatePipe,
  TitleCasePipe,
  NgClass,
  SlicePipe,
  UpperCasePipe,
} from '@angular/common';
import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, TitleCasePipe, NgClass, SlicePipe, UpperCasePipe],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css',
})
export class OrderHistory {
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.orderService.getMyOrders().subscribe({
      next: (orders: any) => {
        this.orders.set(orders || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.isLoading.set(false);
      },
    });
  }

  getOrderTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'processing':
        return 'bg-primary';
      case 'out_for_delivery':
        return 'bg-warning text-dark';
      case 'delivered':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }
}
