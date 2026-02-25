import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FilterState {
    search: string;
    category: string;
    author: string;
    minPrice: number | null;
    maxPrice: number | null;
}

@Component({
    selector: 'app-book-filters',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './book-filters.html'
})
export class BookFilters {
    categories = input<any[]>([]);
    authors = input<any[]>([]);

    search = signal('');
    category = signal('');
    author = signal('');
    minPrice = signal<number | null>(null);
    maxPrice = signal<number | null>(null);

    filterChange = output<FilterState>();
    clear = output<void>();

    private searchSubject = new Subject<string>();

    constructor() {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(term => {
            this.search.set(term);
            this.emitChange();
        });
    }

    onSearchInput(event: Event): void {
        const term = (event.target as HTMLInputElement).value;
        this.searchSubject.next(term);
    }

    onCategoryChange(val: string): void {
        this.category.set(val);
        this.emitChange();
    }

    onAuthorChange(val: string): void {
        this.author.set(val);
        this.emitChange();
    }

    emitChange(): void {
        this.filterChange.emit({
            search: this.search(),
            category: this.category(),
            author: this.author(),
            minPrice: this.minPrice(),
            maxPrice: this.maxPrice()
        });
    }

    onClear(): void {
        this.search.set('');
        this.category.set('');
        this.author.set('');
        this.minPrice.set(null);
        this.maxPrice.set(null);
        this.clear.emit();
    }
}
