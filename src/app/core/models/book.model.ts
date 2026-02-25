import { Author } from './author.model';
import { Category } from './category.model';

export interface Book {
    _id: string;
    name: string;
    price: number;
    stock: number;
    coverImage: string;
    author: Author;
    category: Category | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}
