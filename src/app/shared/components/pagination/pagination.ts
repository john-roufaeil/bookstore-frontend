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
        const total = this.totalPages();
        const current = this.currentPage();

        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 4) {
            return [1, 2, 3, 4, 5, '…', total] as const;
        }

        if (current >= total - 3) {
            return [1, '…', total - 4, total - 3, total - 2, total - 1, total] as const;
        }

        return [1, '…', current - 1, current, current + 1, '…', total] as const;
    });

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.pageChange.emit(page);
        }
    }

    onPageTokenClick(page: number | string): void {
        if (typeof page === 'number') this.onPageChange(page);
    }
}
