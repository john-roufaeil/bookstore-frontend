import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-toolbar.html',
  styleUrl: './admin-toolbar.css',
})
export class AdminToolbar {
  @Input() title = '';
  @Input() subtitle = '';

  @Input() showSearch = true;
  @Input() search = '';
  @Input() searchPlaceholder = 'Search…';
  @Output() searchChange = new EventEmitter<string>();

  @Output() refresh = new EventEmitter<void>();

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.searchChange.emit('');
  }
}
