import { Book } from './book.model';

export interface Author {
  _id?: string;
  name: string;
  bio?: string;
  bookCount?: number;
  books?: Book[];
  createdAt?: string;
  updatedAt?: string;
}
