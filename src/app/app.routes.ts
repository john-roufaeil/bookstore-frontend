import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { authGuard } from '../app/features/auth/guard/auth-guard';
import { isLoggedGuard } from '../app/features/auth/guard/is-logged-guard';
import { adminGuard } from '../app/features/auth/guard/admin-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/books/home/home').then(m => m.Home)
  },
  {
    path: 'auth',
    canActivate: [isLoggedGuard],
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
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/authors/author-list/author-list').then((c) => c.AuthorList)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/authors/author-detail/author-detail').then((c) => c.AuthorDetail)
      }
    ]
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart').then((c) => c.Cart),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((c) => c.Profile),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    component: NotFound,
  },
];
