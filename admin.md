# Admin Dashboard Plan

## 1) URL + Routing Strategy

- Admin dashboard should live at: **`/admin`**
- Add a **lazy-loaded admin route group**:
  - `path: 'admin'` -> loads admin routes/components only when needed
- Backend returns a **signed token** (JWT) or session that includes:
  - `role: 'admin' | 'user'` (or permissions like `['manage:books', ...]`)
- After successful login:
  - If role is `admin` -> navigate to `/admin`
  - Else -> navigate to normal home (e.g. `/` or `/books`)
- Not logged in to redirect to `/login` (and preserve `returnUrl`)
- Logged in but not admin to redirect to `/` (or show “403 Forbidden” page)
- Guards you should have
1) **Auth guard** (must be logged in)
2) **Admin/Role guard** (must be admin)
- Use component state + services (RxJS)

## 6) CRUD Pages Pattern (consistent for each entity)

For each entity (books, categories, orders, users, authors, reviews):
- List page
  - pagination, search, filters, sort
  - actions: view/edit/delete
- Create page
  - reactive form
  - submit -> API
- Edit page
  - load by id
  - patch form
  - submit -> API


## 7) Cloudinary Cover Upload Flow (Book Creation)

### Goal
Upload a cover image securely without exposing Cloudinary secret in frontend.

### Recommended flow
1) Admin fills form (title, price, etc.) and selects an image file.
2) Frontend calls backend: `POST /uploads/cloudinary-signature`
    - Backend returns `{ signature, timestamp, apiKey, cloudName, folder, ... }`
3) Frontend uploads directly to Cloudinary:
    - `POST https://api.cloudinary.com/v1_1/<cloudName>/image/upload`
    - Use `FormData` with file + returned signature fields
4) Cloudinary responds with:
    - `secure_url` (store this as `coverImage`)
    - `public_id` (store this too if you want delete/replace later)
5) Frontend then creates/updates the book in backend:
    - `POST /admin/books` with `coverImageUrl`, `coverImagePublicId`, etc.

### Where to put this code
- `core/services/upload.service.ts` (Cloudinary signature + upload)
- Admin book form calls upload service, then book service


## 9) Minimal Security Checklist
- Route guards: auth + role
- HTTP interceptor adds token to requests
- Store token securely (prefer httpOnly cookies if your backend supports it; otherwise be careful
with localStorage)
- Logout clears auth state
- Handle 401 globally to redirect to `/login`

## 10) Implementation Order (recommended)
1) Auth flow (login + get current user with role)
2) Guards + `/admin` route group + admin layout shell
3) Admin dashboard overview page (placeholder)
4) CRUD: categories + authors (simpler)
5) CRUD: books (includes Cloudinary upload)
6) CRUD: orders
7) CRUD: users
8) Reviews moderation
9) Polish: table components, confirm dialogs, toasts, loading states

## 11) “Done” Definition
Admin can:
- Create/edit/delete categories, authors, books (with cover upload)
- View/manage orders (status updates, etc.)
- View/manage users (role changes if supported)
- Moderate reviews
- Access is blocked for non-admin users on both frontend and backend
