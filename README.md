# 📚 Bookstore Frontend

> Angular frontend for a full-featured online bookstore — built as a team project during our ITI training.

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://iti-bookstore.vercel.app)

**Live:** https://iti-bookstore.vercel.app  
**Backend repo:** https://github.com/john-roufaeil/bookstore-backend

---

## 📖 Table of Contents

- [📚 Bookstore Frontend](#-bookstore-frontend)
  - [📖 Table of Contents](#-table-of-contents)
  - [🛠 Tech Stack](#-tech-stack)
  - [🚀 Getting Started Locally](#-getting-started-locally)
  - [📁 Project Structure](#-project-structure)
  - [🗺 Pages \& Routes](#-pages--routes)
  - [⚙️ How It Works](#️-how-it-works)
    - [Authentication](#authentication)
    - [Interceptors](#interceptors)
    - [Cart](#cart)
    - [Admin Panel](#admin-panel)
  - [🌙 Dark Mode](#-dark-mode)
  - [🌍 Environment Configuration](#-environment-configuration)
  - [👥 Team](#-team)
  - [📜 Scripts](#-scripts)

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| **Angular 21** | Framework (standalone components, zoneless change detection) |
| **Angular Signals** | Reactive state for cart and navbar |
| **RxJS** | HTTP calls and async data streams |
| **Bootstrap 5** | Layout and UI components |
| **Bootstrap Icons** + **FontAwesome** | Icon sets |
| **Vercel** | Frontend deployment |

---

## 🚀 Getting Started Locally

**Requirements:** Node.js, Angular CLI

```bash
git clone <this-repo-url>
cd bookstore-frontend
npm install
ng serve
```

App runs on `http://localhost:4200`

> By default the app points to the live backend. To run the backend locally too, change `apiUrl` in `src/environments/environment.ts` to `http://localhost:5000/api`.

---

## 📁 Project Structure

```
src/app/
├── app.config.ts             # App-level providers (router, HttpClient, interceptors)
├── app.routes.ts             # All route definitions
├── core/
│   ├── interceptors/
│   │   ├── header-interceptor.ts   # Attaches JWT to every outgoing request
│   │   └── error-interceptor.ts    # Handles 401 (auto logout) and 403 (redirect)
│   ├── models/               # TypeScript interfaces for all data shapes
│   └── services/             # HttpClient-based services for each resource
├── features/
│   ├── auth/                 # Login, Register, AuthService, route guards
│   ├── books/                # Home page, book list with filters, book detail
│   ├── authors/              # Author list, author detail
│   ├── cart/                 # Cart page
│   ├── orders/               # Checkout, order history
│   ├── profile/              # User profile and edit form
│   └── admin/                # Admin panel (lazy-loaded)
├── shared/
│   ├── components/           # Reusable components (BookCard, Pagination, StarRating, etc.)
│   ├── navbar/               # Top navigation bar
│   └── footer/               # Footer
└── not-found/                # 404 page
```

---

## 🗺 Pages & Routes

| Route | Auth Required | Description |
|-------|:-------------:|-------------|
| `/` | — | Home page — featured books and authors |
| `/books` | — | Book list with search, category, author, and price filters |
| `/books/:id` | — | Book detail page with reviews |
| `/authors` | — | All authors |
| `/authors/:id` | — | Single author with their books |
| `/auth/login` | — | Login form (redirects if already logged in) |
| `/auth/register` | — | Registration form (redirects if already logged in) |
| `/cart` | ✅ | Cart with quantity controls and total |
| `/orders/checkout` | ✅ | Shipping form and order summary |
| `/orders` | ✅ | Order history |
| `/profile` | ✅ | View and edit profile |
| `/admin` | 🔐 Admin | Admin panel |

---

## ⚙️ How It Works

### Authentication

- After login, the JWT returned by the backend is stored in `localStorage`.
- `AuthService` decodes the token **client-side** (no extra API call) to read the user's name, role, and expiry.
- `isLoggedIn()` checks whether the token exists and hasn't expired.
- `isAdmin()` reads the `role` field from the decoded token.
- On logout, the token is removed and the user is redirected to the login page.

**Route Guards:**

| Guard | Behavior |
|-------|----------|
| `authGuard` | Redirects to `/auth/login` if not logged in |
| `adminGuard` | Redirects to `/` if logged in but not an admin |
| `isLoggedGuard` | Redirects to `/` if already logged in (blocks login/register pages) |

### Interceptors

**`header-interceptor`** — Runs on every HTTP request. If a JWT exists in `localStorage`, it clones the request and adds `Authorization: Bearer <token>` before sending.

**`error-interceptor`** — Runs on every HTTP error response. A `401` triggers `authService.logOut()` to clear the token and redirect. A `403` redirects to the home page.

### Cart

`CartService` holds the cart state in an **Angular Signal** (`cartItems`), so any component reading from the cart updates automatically — no manual subscriptions needed.

- `cartCount` and `cartTotal` are **computed signals** derived from `cartItems`
- On add, remove, or quantity change — the service calls the backend and updates the signal with the response
- The navbar reads `cartCount` directly from the service to show a live badge count

### Admin Panel

Accessible at `/admin` for users with the `admin` role. Lazy-loaded with its own sidebar layout.

| Section | Capabilities |
|---------|-------------|
| **Books** | View all, add, edit, delete |
| **Authors** | View all, add, edit, delete |
| **Categories** | View all, add, edit, delete |
| **Orders** | View all, update status (processing → out for delivery → delivered) |
| **Reviews** | View all, delete |

---

## 🌙 Dark Mode

A toggle button in the navbar switches between light and dark mode. The preference is saved in `localStorage` and restored on page load. Implemented via CSS custom properties — the `body.dark` class overrides them.

---

## 🌍 Environment Configuration

```
src/environments/
├── environment.ts        # Development — points to localhost:5000
└── environment.prod.ts   # Production — points to live backend
```

Angular automatically uses the correct file for `ng serve` vs `ng build --configuration production`.

---

## 👥 Team

This project was built by a team of 4 as part of our ITI training program.

| Member | Responsibilities |
|--------|-----------------|
| **Mohamed Khaled** | Core infrastructure, AuthService, guards, interceptors, all TypeScript models, Login, Register, Profile pages, frontend deployment |
| **Rana Mohamed** | BookService, Home page, Book List with filters, Book Detail, BookCard component, StarRating component |
| **Salma Yasser** | CartService, Navbar, Cart page, Checkout, Order History |
| **John Roufail** | AdminService, all Admin panel tables, Review component |

---

## 📜 Scripts

```bash
ng serve        # start dev server on localhost:4200
ng build        # production build into /dist
ng test         # run unit tests with Vitest
```
