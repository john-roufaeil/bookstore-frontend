import { Book } from "./book.model";

export interface CartItem {
  book: Book;       
  quantity: number;
}
export interface Cart {
  _id: string;
  user: string;      
  items: CartItem[];
  total: number;  
}
