# 🎓 Khaled's Angular Study Guide — Everything You're Missing

> **Professor's Note:** This guide covers every concept you still need to implement in your Bookstore frontend.
> Each section follows the same structure: **Theory → Analogy → Code → Apply to Your Project.**
> Read it top-to-bottom. Each section builds on the previous one.

---

# Table of Contents

1. [localStorage vs Cookies — Aligning with the Team Contract](#1-localstorage-vs-cookies)
2. [Completing AuthService — The Brain of Your App](#2-completing-authservice)
3. [HTTP Interceptors — The Security Guards of Your App](#3-http-interceptors)
4. [Admin Guard — The VIP Bouncer](#4-admin-guard)
5. [Server Error Display — Talking to the User](#5-server-error-display)
6. [Form Disable During Loading — Preventing Chaos](#6-form-disable-during-loading)
7. [Connecting Profile to JWT — Real Data, Not Fake Data](#7-connecting-profile-to-jwt)
8. [TypeScript Interfaces — Stop Using `any`](#8-typescript-interfaces)
9. [Full Implementation Checklist](#9-full-implementation-checklist)

---

---

# 1. localStorage vs Cookies

## Aligning with the Team Contract

### 📖 Theory

The browser gives you several ways to store data on the client side. The two most common are:

| Feature                           | `localStorage`                   | Cookies (`CookieService`)                    |
| --------------------------------- | -------------------------------- | -------------------------------------------- |
| **Size limit**                    | ~5 MB                            | ~4 KB                                        |
| **Sent to server automatically?** | ❌ No — you attach it manually   | ✅ Yes — browser sends it with every request |
| **Accessible from JavaScript?**   | ✅ Always                        | ✅ Unless `HttpOnly` is set                  |
| **Expires**                       | Never (until you delete it)      | Configurable                                 |
| **Use case**                      | SPAs where you control API calls | Traditional server-rendered apps             |

**For Angular SPAs**, `localStorage` is the standard because:

- You control when the token is sent (via interceptors — we'll cover those next)
- You don't need the browser to auto-attach it
- It's simpler to manage

### 🧠 Analogy

Think of `localStorage` as a **wallet in your pocket**. You decide when to pull out your ID card and show it.

Cookies are like a **badge clipped to your shirt**. Everyone can see it automatically whether you want them to or not.

In a single-page app, you want the wallet approach — you choose exactly which requests get the token.

### 📝 Code Example

```typescript
// ✅ STORING with localStorage
localStorage.setItem('jwt_token', 'eyJhbGciOiJIUzI...');

// ✅ READING from localStorage
const token = localStorage.getItem('jwt_token');

// ✅ REMOVING from localStorage
localStorage.removeItem('jwt_token');

// ✅ CHECKING if it exists
const exists = localStorage.getItem('jwt_token') !== null;
```

Compare to what you currently do with cookies:

```typescript
// ❌ YOUR CURRENT CODE — using CookieService
this.cookieService.set('token', 'Bearer ' + res.token); // storing
this.cookieService.get('token'); // reading
this.cookieService.delete('token'); // removing
this.cookieService.check('token'); // checking
```

### 🔧 Apply to Your Project

**Step 1:** Open `src/app/features/auth/auth.service/auth-service.ts`

**Step 2:** Remove the `CookieService` import and injection:

```typescript
// ❌ REMOVE these
import { CookieService } from 'ngx-cookie-service';
private readonly cookieService = inject(CookieService);
```

**Step 3:** Replace every cookie call with localStorage:

```typescript
// In login (save token):
// ❌ OLD: this.cookieService.set('token', 'Bearer ' + res.token);
// ✅ NEW:
localStorage.setItem('jwt_token', token);

// In logout (remove token):
// ❌ OLD: this.cookieService.delete('token');
// ✅ NEW:
localStorage.removeItem('jwt_token');
```

**Step 4:** Open `src/app/features/auth/guard/auth-guard.ts` and `is-logged-guard.ts`

Replace:

```typescript
// ❌ OLD
const cookieService = inject(CookieService);
if (cookieService.check('token'))

// ✅ NEW
if (localStorage.getItem('jwt_token'))
```

**Step 5:** Remove `CookieService` from `app.config.ts` providers:

```typescript
// ❌ REMOVE this line
importProvidersFrom(CookieService);
```

**Step 6:** Open `src/app/features/auth/login/login.ts` and remove the `CookieService` import and injection there too.

> **Why `jwt_token` and not `token`?** Because the team contract says: "Token is stored in localStorage under the key `jwt_token`". Everyone agreed on this name. Use it exactly.

---

---

# 2. Completing AuthService

## The Brain of Your App

### 📖 Theory

The `AuthService` is the **single source of truth** for everything related to the logged-in user. Every other part of your app asks the AuthService: "Is someone logged in? Who are they? Are they admin?"

Your current AuthService has 4 methods. The plan requires **8 methods**. Here's what each one does:

| Method                | Purpose                                    | Who Uses It               |
| --------------------- | ------------------------------------------ | ------------------------- |
| `register(data)`      | POST to `/api/auth/register`               | Register component        |
| `login(email, pw)`    | POST to `/api/auth/login` → **save token** | Login component           |
| `logout()`            | Remove token → navigate to login           | Navbar, Error Interceptor |
| `getToken()`          | Read JWT string from localStorage          | **Token Interceptor**     |
| `getCurrentUser()`    | Decode JWT payload → return user object    | Profile, Navbar           |
| `isLoggedIn()`        | Check if token exists **and not expired**  | **Auth Guard**, Navbar    |
| `isAdmin()`           | Check if decoded user's role is `'admin'`  | **Admin Guard**, Navbar   |
| `updateProfile(data)` | PATCH to `/api/auth/profile`               | Profile component         |

### 🧠 Analogy

Think of AuthService as a **receptionist at a hotel**:

- `login()` = Guest checks in and receives a **room key card** (JWT)
- `getToken()` = Show me your key card
- `getCurrentUser()` = Read the key card to see which room and guest name is on it
- `isLoggedIn()` = Is this key card still valid? (hasn't expired?)
- `isAdmin()` = Does this key card have VIP access?
- `logout()` = Guest checks out — destroy the key card
- `updateProfile()` = Guest requests a name change on their reservation

Every other service in the hotel (room service, pool, spa) asks the receptionist: "Is this guest valid? What access do they have?"

### 📖 Deep Dive: How JWT Decoding Works

A JWT token looks like this:

```
eyJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI2NWYxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjE3MjAwMDAwMDB9.signature_here
```

It has 3 parts separated by dots:

1. **Header** — algorithm info (we don't need this)
2. **Payload** — the actual data (`_id`, `email`, `role`, `exp`)
3. **Signature** — verification (server checks this, not us)

To read the payload in the browser:

```typescript
const token = 'eyJhbGci...';
const payload = token.split('.')[1]; // Get the middle part
const decoded = JSON.parse(atob(payload)); // Base64 decode → JSON parse
// decoded = { _id: '65f1234567890', email: 'test@test.com', role: 'user', exp: 1720000000 }
```

`atob()` is a built-in browser function that decodes Base64 strings. No library needed.

The `exp` field is a Unix timestamp (seconds since Jan 1, 1970). To check if the token is expired:

```typescript
const isExpired = decoded.exp * 1000 < Date.now();
// exp is in seconds, Date.now() is in milliseconds → multiply by 1000
```

### 📝 Complete AuthService Code

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'jwt_token';

  // ─── Registration ────────────────────────────
  register(data: object): Observable<any> {
    return this.http.post(`${this.api}/register`, data);
  }

  // ─── Login: POST + save token ────────────────
  login(data: object): Observable<any> {
    return this.http.post<any>(`${this.api}/login`, data).pipe(
      tap((res) => {
        // The server returns { data: { token, user } }
        if (res.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
        }
      }),
    );
  }

  // ─── Logout: remove token + redirect ─────────
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }

  // ─── Get raw token string ────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ─── Decode JWT payload → user object ────────
  getCurrentUser(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  // ─── Is token present AND not expired? ───────
  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.exp) return false;
    return user.exp * 1000 > Date.now();
  }

  // ─── Does the current user have admin role? ──
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  // ─── Update profile: PATCH ────────────────────
  updateProfile(data: object): Observable<any> {
    return this.http.patch(`${this.api}/profile`, data);
  }
}
```

### 🔧 Apply to Your Project

**Step 1:** Replace the entire content of `src/app/features/auth/auth.service/auth-service.ts` with the code above.

**Step 2:** Update `login.ts` to use the **service's** login method properly:

```typescript
// ❌ OLD: You were saving the token in the component
this.cookieService.set('token', 'Bearer ' + res.token);

// ✅ NEW: The service handles token storage via tap()
// Just call login and navigate on success:
this.authService.login(this.loginForm.value).subscribe({
  next: () => {
    this.router.navigate(['/']); // Navigate to home
  },
  error: (err) => {
    // We'll handle this in Section 5
  },
});
```

**Step 3:** Remove `CookieService` import from `login.ts` — it's no longer needed anywhere.

> **Key Insight:** The token is saved inside the `login()` method via `tap()`. The component doesn't need to know anything about storage. This is called **encapsulation** — the service handles its own data.

---

---

# 3. HTTP Interceptors

## The Security Guards of Your App

### 📖 Theory

An **HTTP Interceptor** is a function that sits between your Angular app and the server. **Every** HTTP request and response passes through it.

There are two types:

1. **Request Interceptor** (Token Interceptor) — modifies outgoing requests
2. **Response Interceptor** (Error Interceptor) — reacts to incoming responses

```
┌──────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────┐
│  Your    │ ──► │ Token           │ ──► │ Error           │ ──► │  Server  │
│ Component│     │ Interceptor     │     │ Interceptor     │     │          │
│          │ ◄── │ (adds token)    │ ◄── │ (catches errors)│ ◄── │          │
└──────────┘     └─────────────────┘     └─────────────────┘     └──────────┘
```

### 🧠 Analogy

Imagine you're sending letters (HTTP requests) to a company (the server).

**Token Interceptor** = A secretary who stamps every letter with your company letterhead before it goes out. You don't put the stamp yourself — the secretary handles it automatically.

**Error Interceptor** = A mailroom clerk who opens every reply letter first. If the reply says "Access Denied" (401), the clerk calls security to escort you out (logout). If it says "Forbidden" (403), the clerk tells you "You can't go there" with a notification.

Without these, you'd have to stamp every letter yourself and check every reply yourself — in **every single component**. That's 20+ places to write the same code.

### 📖 Deep Dive: Angular 21 Interceptors

In Angular 21, interceptors are **functions**, not classes. They follow this signature:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const myInterceptor: HttpInterceptorFn = (req, next) => {
  // req  = the outgoing request (you can modify it)
  // next = a function that passes the request to the next interceptor or the server
  // You MUST call next(req) to let the request continue

  return next(req); // Pass it through unchanged
};
```

**To modify the request:**

```typescript
export const myInterceptor: HttpInterceptorFn = (req, next) => {
  // Requests are IMMUTABLE — you must clone them to modify
  const modifiedReq = req.clone({
    setHeaders: { 'X-Custom-Header': 'hello' },
  });
  return next(modifiedReq); // Send the modified version
};
```

**To react to the response:**

```typescript
import { catchError, throwError } from 'rxjs';

export const myInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // error.status = HTTP status code (401, 403, 500, etc.)
      console.log('Request failed:', error.status);
      return throwError(() => error); // Re-throw so the component can also handle it
    }),
  );
};
```

### 📝 Token Interceptor Code

Create file: `src/app/core/interceptors/token.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/auth.service/auth-service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Step 1: Ask AuthService for the token
  const token = inject(AuthService).getToken();

  // Step 2: If no token, pass the request through unchanged
  if (!token) return next(req);

  // Step 3: Clone the request and attach the Authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Step 4: Send the modified request
  return next(authReq);
};
```

**What this does line by line:**

1. Gets the JWT from localStorage (via AuthService)
2. If the user isn't logged in, the request goes out without any header (public routes like viewing books)
3. If the user IS logged in, clones the request and adds `Authorization: Bearer eyJhbG...`
4. Every HTTP call your teammates make (cart, orders, admin) will automatically have the token

### 📝 Error Interceptor Code

Create file: `src/app/core/interceptors/error.interceptor.ts`

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service/auth-service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // 401 = Unauthorized → token expired or invalid
      if (error.status === 401) {
        auth.logout(); // Clear token + redirect to login
      }

      // 403 = Forbidden → user doesn't have permission
      if (error.status === 403) {
        router.navigate(['/']);
        // Optional: show a notification (we're keeping it simple without Material)
        alert('Access denied');
      }

      // Re-throw the error so the component can ALSO react to it
      return throwError(() => error);
    }),
  );
};
```

**Why re-throw the error?**
The interceptor handles the **global** response (logout on 401, redirect on 403). But the individual component might want to show a specific message. By re-throwing, both the global handler AND the component handler run.

### 🔧 Apply to Your Project

**Step 1:** Create the interceptors directory:

```
src/app/core/interceptors/
├── token.interceptor.ts
└── error.interceptor.ts
```

**Step 2:** Create both files with the code above.

**Step 3:** Wire them in `app.config.ts`:

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor])),
    //                 ^^^^^^^^^^^^^^^^ THIS is the key change
  ],
};
```

> **Critical:** `withInterceptors()` is what **registers** the interceptors. Without it, they're just files sitting in a folder doing nothing.

**Step 4:** Remove `CookieService` from the providers — it's no longer needed.

**How to verify it works:**

1. Login to the app
2. Open DevTools → Network tab
3. Navigate to a page that makes an API call (e.g., Books)
4. Click on the request → Headers tab
5. You should see `Authorization: Bearer eyJhbG...` in the Request Headers
6. If you see it — the Token Interceptor is working ✅

---

---

# 4. Admin Guard

## The VIP Bouncer

### 📖 Theory

A **Route Guard** is a function that runs **before** a route loads. It answers one question: "Should this user be allowed to see this page?"

You already have two guards:

- `authGuard` → "Is the user logged in?" (yes → allow, no → redirect to login)
- `isLoggedGuard` → "Is the user already logged in?" (yes → redirect away from login/register)

You're missing:

- `adminGuard` → "Is the user an admin?" (yes → allow, no → redirect to home)

### 🧠 Analogy

Imagine a building with three doors:

1. **authGuard** = The front door. Show any valid key card to enter.
2. **isLoggedGuard** = The "already inside" check. If you're already in the building, don't go back to the entrance.
3. **adminGuard** = The VIP room door. Only key cards with the gold stripe (admin role) can open this.

### 📖 How Angular Guards Work (Under the Hood)

A guard is a function with the `CanActivateFn` type. It returns one of three things:

```typescript
import { CanActivateFn } from '@angular/router';

export const myGuard: CanActivateFn = (route, state) => {
  // Return TRUE → user can access the route
  return true;

  // Return FALSE → navigation is cancelled (user stays where they are)
  return false;

  // Return a UrlTree → user is REDIRECTED to that URL
  return inject(Router).createUrlTree(['/auth/login']);
};
```

The `route` parameter contains info about the route being navigated to (path, params, etc.).
The `state` parameter contains the full URL being navigated to.

For most guards, you only need `inject()` to get services.

### 📝 Admin Guard Code

Create file: `src/app/core/guards/admin.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service/auth-service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: is the user logged in at all?
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Second check: is the user an admin?
  if (!authService.isAdmin()) {
    return router.createUrlTree(['/']); // Redirect to home, not login
  }

  // Both checks passed — allow access
  return true;
};
```

**Why two checks?**
If a user is not logged in AND tries to go to `/admin`, we want to redirect to login (not home). If they ARE logged in but not admin, we redirect to home. This gives a better user experience.

### 🔧 Apply to Your Project

**Step 1:** Create `src/app/core/guards/admin.guard.ts` with the code above.

**Step 2:** Update `app.routes.ts` to use it:

```typescript
import { adminGuard } from './core/guards/admin.guard';

// Find the admin route and add the guard:
{
  path: 'admin',
  canActivate: [adminGuard],  // ← ADD THIS
  loadComponent: () => import('./features/admin/admin').then(c => c.Admin),
},
```

**Step 3:** While you're in `app.routes.ts`, also protect the profile route:

```typescript
import { authGuard } from '../app/features/auth/guard/auth-guard';

{
  path: 'profile',
  canActivate: [authGuard],  // ← ADD THIS
  loadComponent: () => import('./features/profile/profile').then(c => c.Profile),
},
```

**Step 4:** Also add protection to cart and orders:

```typescript
{
  path: 'cart',
  canActivate: [authGuard],  // ← ADD THIS
  loadComponent: () => import('./features/cart/cart').then(c => c.Cart),
},
{
  path: 'orders',
  canActivate: [authGuard],  // ← ADD THIS
  children: [ ... ]
},
```

---

---

# 5. Server Error Display

## Talking to the User

### 📖 Theory

Right now, when a login or register fails, your code does this:

```typescript
error: (err) => {
  console.log(err); // ← Only YOU see this in DevTools
};
```

The user sees... nothing. They click "Sign In", it fails, and the button just sits there. No message, no feedback. This is bad UX.

The server sends back error messages like:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

You need to **capture** that message and **display** it in the template.

### 🧠 Analogy

Imagine a customer at a bank counter. They hand over a form. The teller looks at it, shakes their head, and writes something on a sticky note and puts it in their pocket. The customer is standing there confused.

What SHOULD happen: the teller writes the problem on a piece of paper and slides it back to the customer. "Your signature doesn't match."

`console.log(err)` = sticky note in the pocket (developer sees it).
`serverError` signal = paper slid back to the customer (user sees it).

### 📖 The Signal Pattern for Error Display

Angular **signals** are perfect for this. A signal is a reactive value that automatically updates the template when it changes.

```typescript
// In the component class:
serverError = signal('');  // Empty string = no error

// In the error handler:
this.serverError.set(err.error?.message || 'Something went wrong');

// In the template:
@if (serverError()) {
  <div class="alert alert-danger">{{ serverError() }}</div>
}
```

**Why `err.error?.message`?**

- `err` is the HttpErrorResponse object
- `err.error` is the parsed JSON body from the server
- `err.error.message` is the human-readable message ("Invalid credentials", "Email already in use")
- The `?.` prevents crashes if the server returns something unexpected
- The `||` provides a fallback message

### 📝 Login Component with Error Display

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service/auth-service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal(false); // ← Changed to signal
  showPassword = false;
  serverError = signal(''); // ← NEW: holds server error message

  loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  submitLogin() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.serverError.set(''); // Clear any previous error

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']); // ← Fixed: was '/home'
      },
      error: (err) => {
        this.serverError.set(err.error?.message || 'Login failed. Please try again.');
        this.isLoading.set(false);
      },
    });
  }
}
```

### 📝 Template Change (login.html)

Add this **above** the submit button:

```html
<!-- Server Error Display -->
@if (serverError()) {
<div
  class="alert alert-danger d-flex align-items-center font-mono small mt-3 rounded-3"
  role="alert"
>
  <i class="fa-solid fa-circle-exclamation me-2"></i>
  {{ serverError() }}
</div>
}
```

### 🔧 Apply to Your Project

**For Login:**

1. Add `serverError = signal('');` to the class
2. Import `signal` from `@angular/core`
3. Update the error callback to set the signal
4. Add the error display HTML to `login.html`

**For Register — same pattern:**

```typescript
// In register.ts:
serverError = signal('');

submitRegisterForm() {
  if (this.registerForm.invalid) return;
  this.isLoading = true;
  this.serverError.set('');

  this.authService.register(this.registerForm.value).subscribe({
    next: (res) => {
      this.isLoading = false;
      this.router.navigate(['/auth/login']);  // ← Fixed: was '/login'
    },
    error: (err) => {
      this.serverError.set(err.error?.message || 'Registration failed.');
      this.isLoading = false;
    },
  });
}
```

Add the same error display HTML to `register.html`.

---

---

# 6. Form Disable During Loading

## Preventing Chaos

### 📖 Theory

When a user clicks "Sign In", the request takes time (maybe 1-3 seconds). During that time, if the form is still active:

- The user might change the email field while the old request is flying
- They might click the button again, sending a **duplicate** request
- The UX feels "broken" because nothing seems to be happening

The fix: **disable the entire form** while the request is in progress.

### 🧠 Analogy

You walk into an elevator and press floor 5. While the elevator is moving, the buttons should be **greyed out**. You can't press floor 3 mid-trip. Once you arrive, the buttons light up again.

`form.disable()` = grey out all buttons while moving.
`form.enable()` = light them up when you arrive.

### 📝 The Pattern

```typescript
submit() {
  if (this.form.invalid) return;

  // 1. Disable everything
  this.isLoading.set(true);
  this.loginForm.disable();        // ← All inputs become readonly
  this.serverError.set('');

  this.authService.login(this.loginForm.value).subscribe({
    next: () => {
      this.isLoading.set(false);
      this.router.navigate(['/']);
      // No need to re-enable — we're navigating away
    },
    error: (err) => {
      // 2. Re-enable on error so user can try again
      this.serverError.set(err.error?.message || 'Login failed.');
      this.isLoading.set(false);
      this.loginForm.enable();     // ← Inputs become editable again
    },
  });
}
```

### ⚠️ Important Gotcha

When you call `form.disable()`, the form becomes **invalid** (disabled forms are considered neither valid nor invalid). This means if you check `form.value` AFTER disabling:

```typescript
this.loginForm.disable();
console.log(this.loginForm.value);
// ❌ This might return {} because disabled controls are excluded!
```

**Solution:** Always grab the value **before** disabling:

```typescript
submit() {
  if (this.loginForm.invalid) return;

  const formData = this.loginForm.getRawValue();  // ← Gets ALL values, even disabled ones
  this.loginForm.disable();

  this.authService.login(formData).subscribe({ ... });
}
```

Or simply grab the value before disabling:

```typescript
const formData = this.loginForm.value;  // ← Captured while form is still enabled
this.loginForm.disable();
this.authService.login(formData).subscribe({ ... });
```

### 🔧 Apply to Your Project

Update both `login.ts` and `register.ts`:

1. Capture form data **before** disabling
2. Disable the form after capture
3. Re-enable on **error only** (on success you navigate away)

---

---

# 7. Connecting Profile to JWT

## Real Data, Not Fake Data

### 📖 Theory

Your profile page currently has:

```typescript
user = {
  firstName: 'Mohamed',
  lastName: 'Khaled',
  email: 'mohamed.khaled@example.com',
  // ... all hardcoded
};
```

The plan says: "On init read current user from `authService.getCurrentUser()` — no API call, just decode token."

This means:

1. User logs in → JWT token is stored in localStorage
2. User opens Profile → decode the JWT → extract `firstName`, `lastName`, `email` from the payload
3. Pre-fill the form with these values
4. On form submit → call `authService.updateProfile()` to PATCH the server

### 🧠 Analogy

You go to a hotel and check in. At check-in, they give you a key card with your name embedded in the chip.

Later, you go to the concierge desk and say "I want to update my room preferences."

The concierge doesn't ask "What's your name?" — they **scan your key card** and read it. That's `getCurrentUser()`.

Hardcoding the name is like the concierge having a sticky note that says "Mohamed Khaled" — it works for one person but fails for everyone else.

### 📝 Updated Profile Component

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service/auth-service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly authService = inject(AuthService);

  // User data from JWT (read-only display)
  user: any = {};

  // Form for editable fields
  profileForm!: FormGroup;
  isEditing = false;
  isLoading = signal(false);
  successMessage = signal('');

  ngOnInit(): void {
    // Decode the JWT — no API call
    const decoded = this.authService.getCurrentUser();

    if (decoded) {
      this.user = {
        firstName: decoded.firstName || '',
        lastName: decoded.lastName || '',
        email: decoded.email || '',
        role: decoded.role || 'user',
      };
    }

    // Initialize form with decoded data
    this.profileForm = new FormGroup({
      firstName: new FormControl(this.user.firstName, [Validators.required]),
      lastName: new FormControl(this.user.lastName, [Validators.required]),
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset to original values on cancel
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isLoading.set(true);
    this.successMessage.set('');

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        // Update the local user object with new values
        this.user.firstName = this.profileForm.get('firstName')?.value;
        this.user.lastName = this.profileForm.get('lastName')?.value;
        this.isEditing = false;
        this.isLoading.set(false);
        this.successMessage.set('Profile updated successfully!');
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || 'Failed to update profile');
      },
    });
  }
}
```

### 🔧 Apply to Your Project

**Step 1:** Replace the hardcoded `user` object with the `ngOnInit` approach above.

**Step 2:** Import and inject `AuthService`.

**Step 3:** Update the `saveProfile` method to call `authService.updateProfile()`.

**Step 4:** In `profile.html`, replace `*ngIf="isEditing"` with `@if (isEditing)`:

```html
<!-- ❌ OLD -->
<div class="mt-4 pt-3" *ngIf="isEditing">
  <!-- ✅ NEW -->
  @if (isEditing) {
  <div class="mt-4 pt-3">...</div>
  }
</div>
```

**Step 5:** Remove `CommonModule` from the imports (you won't need `*ngIf` anymore).

> **Note:** The JWT payload might not contain `firstName` and `lastName` — it depends on what your backend puts in the token. If the JWT only has `_id`, `email`, and `role`, then you'll need to make an API call (`GET /api/auth/me`) to get the full user data. Check with your backend.

---

---

# 8. TypeScript Interfaces

## Stop Using `any`

### 📖 Theory

TypeScript's biggest superpower is its **type system**. When you write `signal<any[]>([])`, you're telling TypeScript: "I don't know what's in this array. Don't check anything."

This means:

- No autocomplete when you type `book.` (TypeScript doesn't know what properties exist)
- No error if you type `book.naem` instead of `book.name` (TypeScript can't spot the typo)
- Bugs hide until runtime instead of being caught at compile time

### 🧠 Analogy

Using `any` is like putting unlabeled boxes in a warehouse.

- `any` = "This box could contain anything. Don't check what's inside."
- `Book` = "This box contains a book. It MUST have a name, price, and author."

With labeled boxes, if someone tries to put a shoe in the book box, the forklift operator (TypeScript compiler) says "Hey, this doesn't belong here!" BEFORE it goes on the shelf.

With unlabeled boxes, you only find out there's a shoe where a book should be when a customer opens it (runtime error).

### 📝 Before vs After

```typescript
// ❌ BEFORE — You defined the interface but used any
import { Book } from '../../../core/models';

popularBooks = signal<any[]>([]);
// TypeScript: "I don't know what's in here. Good luck!"

// You can write this and TypeScript won't warn you:
this.popularBooks()[0].naem; // ← Typo! But no error.

// ────────────────────────────────────────

// ✅ AFTER — Using the interface you already wrote
import { Book } from '../../../core/models';

popularBooks = signal<Book[]>([]);
// TypeScript: "This is an array of Book objects."

// Now if you write:
this.popularBooks()[0].naem; // ← ERROR: Property 'naem' does not exist on type 'Book'
this.popularBooks()[0].name; // ← ✅ Autocomplete suggests this!
```

### 📝 Your Models — What's There vs What's Missing

You have these in `src/app/core/models/`:
| Interface | Status |
|---|---|
| `User` | ✅ Exists |
| `Book` | ✅ Exists |
| `Author` | ✅ Exists |
| `Category` | ✅ Exists |
| `Review` | ✅ Exists |
| `Order` | ✅ Exists |
| `Cart` | ✅ Exists |
| `ApiResponse<T>` | ✅ Exists |
| `PaginationMeta` | ✅ Exists |

You're missing these (from the guide):
| Interface | Needed By |
|---|---|
| `CartItem` | Cart component |
| `OrderItem` | Order history |
| `ShippingDetails` | Checkout |

### 🔧 Apply to Your Project

**Step 1:** Add the missing interfaces to `src/app/core/models/`:

Add to the relevant model files:

```typescript
// In cart.model.ts — add if not already there:
export interface CartItem {
  book: Book;
  quantity: number;
}

// In order.model.ts — add if not already there:
export interface OrderItem {
  book: Pick<Book, '_id' | 'name' | 'coverImage'>;
  quantity: number;
  priceAtPurchase: number;
}

export interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  phone: string;
}
```

**Step 2:** Update `index.ts` to export them.

**Step 3:** In your own components, start replacing `any`:

```typescript
// In AuthService:
// ❌ OLD
registerForm(data: object): Observable<any>

// ✅ NEW
register(data: Partial<User> & { password: string }): Observable<ApiResponse<User>>
```

```typescript
// In profile.ts:
// ❌ OLD
user: any = {};

// ✅ BETTER
user: Partial<User> = {};
```

> **Pro tip:** You don't have to fix ALL `any` at once. Start with your own files (AuthService, Login, Register, Profile). Let your teammates fix their own.

---

---

# 9. Full Implementation Checklist

Here's the **exact order** to implement everything, with estimated time for each:

### Phase 1: Foundation (30 min)

- [ ] Remove `ngx-cookie-service` usage everywhere
- [ ] Switch to `localStorage` with key `jwt_token`
- [ ] Remove `CookieService` from `app.config.ts` providers
- [ ] Complete `AuthService` with all 8 methods

### Phase 2: Interceptors (20 min)

- [ ] Create `src/app/core/interceptors/token.interceptor.ts`
- [ ] Create `src/app/core/interceptors/error.interceptor.ts`
- [ ] Update `app.config.ts` with `withInterceptors([tokenInterceptor, errorInterceptor])`

### Phase 3: Guards (10 min)

- [ ] Create `src/app/core/guards/admin.guard.ts`
- [ ] Add `canActivate: [authGuard]` to profile, cart, orders routes
- [ ] Add `canActivate: [adminGuard]` to admin route

### Phase 4: Fix Login/Register (20 min)

- [ ] Add `serverError = signal('')` to both components
- [ ] Display error in template with `@if (serverError())`
- [ ] Disable form during loading with `form.disable()` / `form.enable()`
- [ ] Fix navigation: `/home` → `/` and `/login` → `/auth/login`

### Phase 5: Fix Profile (15 min)

- [ ] Replace hardcoded data with `authService.getCurrentUser()`
- [ ] Replace `*ngIf` with `@if`
- [ ] Wire `saveProfile()` to `authService.updateProfile()`
- [ ] Remove `CommonModule` import

### Phase 6: TypeScript (15 min)

- [ ] Replace `any` with proper types in AuthService
- [ ] Replace `any` with proper types in your components
- [ ] Add missing interfaces (`CartItem`, `OrderItem`, `ShippingDetails`)
- [ ] Update `index.ts` barrel exports

---

**Total estimated time: ~2 hours**

> **Professor's advice:** Don't try to do everything at once. Follow the phases in order. Each one builds on the previous. Test after each phase to make sure nothing is broken. 🎯
