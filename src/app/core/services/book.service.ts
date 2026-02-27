import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BookService {
    private apiUrl = `${environment.apiUrl}/books`;

    constructor(private http: HttpClient) { }

    getBooks(params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        author?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.page) httpParams = httpParams.set('page', params.page.toString());
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
            if (params.search) httpParams = httpParams.set('search', params.search);
            if (params.category) httpParams = httpParams.set('category', params.category);
            if (params.author) httpParams = httpParams.set('author', params.author);
            if (params.minPrice) httpParams = httpParams.set('minPrice', params.minPrice.toString());
            if (params.maxPrice) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
            if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
            if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
        }

        return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
            map(res => res.data)
        );
    }

    getBook(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(res => res.data)
        );
    }

    createBook(payload: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, payload).pipe(
            map(res => res.data)
        );
    }

    updateBook(id: string, payload: any): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${id}`, payload).pipe(
            map(res => res.data)
        );
    }

    deleteBook(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
            map(res => res.data)
        );
    }
}
