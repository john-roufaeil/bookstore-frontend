import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'books',
        loadChildren: () => import('./features/books/books.routes').then(m => m.BOOKS_ROUTES)
    },
    {
        path: 'categories',
        redirectTo: 'books',
        pathMatch: 'full'
    },
    {
        path: 'authors',
        loadChildren: () => import('./features/authors/authors.routes').then(m => m.AUTHORS_ROUTES)
    },
    {
        path: 'cart',
        loadChildren: () => import('./features/cart/cart.routes').then(m => m.CART_ROUTES)
    },
    {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES)
    },
    {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
    },
    {
        path: '',
        loadComponent: () => import('./features/books/home/home').then(m => m.Home)
    }
];