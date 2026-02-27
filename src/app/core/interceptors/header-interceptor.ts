import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/auth.service/auth-service';
import { environment } from '../../../environments/environment';

export const headerInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  const isApiRequest =
    req.url.startsWith(environment.apiUrl) ||
    req.url.startsWith('/api/') ||
    req.url === '/api';

  if (!isApiRequest) {
    if (req.headers.has('Authorization')) {
      return next(req.clone({ headers: req.headers.delete('Authorization') }));
    }
    return next(req);
  }

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  return next(authReq);
};
