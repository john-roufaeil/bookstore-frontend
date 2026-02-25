import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './empty-state.html'
})
export class EmptyState {
    title = input<string>('No results found');
    message = input<string>('Try adjusting your search or filters');
    icon = input<string>('bi-journal-x');
    buttonText = input<string | null>(null);

    action = output<void>();
}
