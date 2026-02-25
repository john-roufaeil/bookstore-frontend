import { Routes } from '@angular/router';
import { BookList } from './book-list/book-list';
import { BookDetail } from './book-detail/book-detail';

export const BOOKS_ROUTES: Routes = [
    {
        path: '',
        component: BookList
    },
    {
        path: ':id',
        component: BookDetail
    }
];