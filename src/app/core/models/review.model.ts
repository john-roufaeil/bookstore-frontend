import { Book } from "./book.model";
import { User } from "./user.model";

export interface Review {
  _id: string;
  user: User;
  book?: Book;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
