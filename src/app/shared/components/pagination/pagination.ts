import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination.html',
    styleUrl: './pagination.css'
})
export class Pagination {
    currentPage = input.required<number>();
    totalPages = input.required<number>();

    pageChange = output<number>();

    pages = computed(() => {
        return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
    });

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.pageChange.emit(page);
        }
    }
}
