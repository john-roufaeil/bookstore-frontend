import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-modal.html',
  styleUrl: './admin-modal.css',
})
export class AdminModal {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}

