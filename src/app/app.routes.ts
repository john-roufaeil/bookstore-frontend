import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'books',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((c) => c.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((c) => c.Register),
      },
    ],
  },
  {
    path: 'books',
    loadComponent: () => import('./features/books/book-list/book-list').then((c) => c.BookList),
  },
  {
    path: 'authors',
    loadComponent: () =>
      import('./features/authors/author-list/author-list').then((c) => c.AuthorList),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((c) => c.Cart),
  },
  {
    path: 'orders',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/orders/order-history/order-history').then((c) => c.OrderHistory),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/orders/checkout/checkout').then((c) => c.Checkout),
      },
    ],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((c) => c.Profile),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((c) => c.Admin),
  },
  {
    path: '**',
    component: NotFound,
  },
];
