import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly TOKEN_KEY = 'jwt_token';

  registerForm(data: object): Observable<any> {
    return this.http.post(environment.apiUrl + '/auth/register', data);
  }

  loginForm(data: object): Observable<any> {
    return this.http.post<any>(environment.apiUrl + '/auth/login', data).pipe(
      tap(res => {
        if (res.data?.token) {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
        } else if (res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }
      })
    );
  }

  logOut(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

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

  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.exp) return false;
    return user.exp * 1000 > Date.now();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  updateProfile(data: object): Observable<any> {
    return this.http.patch(environment.apiUrl + '/auth/profile', data);
  }
}
