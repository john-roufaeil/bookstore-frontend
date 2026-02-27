import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminModal } from '../admin-modal/admin-modal';

@Component({
  selector: 'app-admin-form-modal',
  standalone: true,
  imports: [CommonModule, AdminModal],
  templateUrl: './admin-form-modal.html',
})
export class AdminFormModal {
  @Input() open = false;
  @Input() title = '';
  @Input() submitText = 'Save';
  @Input() submitDisabled = false;

  @Output() submitted = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
}

