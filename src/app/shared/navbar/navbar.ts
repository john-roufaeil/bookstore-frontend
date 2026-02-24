import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  isLoggedIn = false;
  isAdmin = false;
  cartItemCount = 10;

  onLogout() {
    // TODO: add onLogout logic when auth is available
    console.log('Logout');
  }
}
