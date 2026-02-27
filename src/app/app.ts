import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Footer } from './shared/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('my-angular-app');

  protected readonly isAdminRoute = signal(false);

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        this.isAdminRoute.set(nav.urlAfterRedirects.startsWith('/admin'));
      });
  }
}
