import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminModal } from '../admin-modal/admin-modal';

@Component({
  selector: 'app-admin-confirm-modal',
  standalone: true,
  imports: [CommonModule, AdminModal],
  templateUrl: './admin-confirm-modal.html',
})
export class AdminConfirmModal {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Delete';
  @Input() confirmDisabled = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
}

