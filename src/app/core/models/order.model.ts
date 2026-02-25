// Snapshot of an item at the time of purchase
import { Book } from "./book.model";

export interface OrderItem {
  book:Book;
  quantity: number;
  priceAtPurchase: number;  
}

export interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  phone: string;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  shippingDetails: ShippingDetails;
  status: 'processing' | 'out_for_delivery' | 'delivered';
  paymentMethod: string;
  paymentStatus: 'pending' | 'success';
  createdAt: string;
}