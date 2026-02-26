import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/auth.service/auth-service';

export const headerInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
if(!token) return next(req);
const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
return next(authReq);
};
