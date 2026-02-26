import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout').then((c) => c.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'books' },
      {
        path: 'books',
        loadComponent: () => import('./pages/books/admin-books').then((c) => c.AdminBooks),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/admin-categories').then((c) => c.AdminCategories),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/admin-orders').then((c) => c.AdminOrders),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./pages/reviews/admin-reviews').then((c) => c.AdminReviews),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/admin-users').then((c) => c.AdminUsers),
      },
      {
        path: 'authors',
        loadComponent: () => import('./pages/authors/admin-authors').then((c) => c.AdminAuthors),
      },
    ],
  },
];
