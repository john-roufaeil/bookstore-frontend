import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order, ShippingDetails } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getMyOrders(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`).pipe(
      map((res) => {
        const result = res.data;
        const orders = result.data || [];
        return orders.map((order: any) => ({
          ...order,
          items: order.items.map((item: any) => ({
            ...item,
            book: item.bookId || item.book,
          })),
        }));
      }),
    );
  }

  placeOrder(shippingDetails: ShippingDetails, paymentMethod: string = 'COD'): Observable<Order> {
    return this.http
      .post<any>(this.apiUrl, { shippingDetails, paymentMethod })
      .pipe(map((res) => res.data));
  }
}
