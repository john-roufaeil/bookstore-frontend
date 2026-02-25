import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/books/home/home').then(m => m.Home)
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
    children: [
      {
        path: '',
        loadComponent: () => import('./features/books/book-list/book-list').then(m => m.BookList)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/books/book-detail/book-detail').then(m => m.BookDetail)
      }
    ]
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
