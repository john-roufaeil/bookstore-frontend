import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getReviews(bookId: string): Observable<Review[]> {
    return this.http.get<any>(`${this.apiUrl}/books/${bookId}/reviews`).pipe(
      map((res) => {
        const data = res?.data ?? res;
        const reviews = data?.reviews ?? data?.data ?? data;
        return Array.isArray(reviews) ? (reviews as Review[]) : [];
      }),
    );
  }

  createReview(bookId: string, payload: { rating: number; comment?: string }): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/books/${bookId}/reviews`, payload)
      .pipe(map((res) => res?.data ?? res));
  }

  updateReview(id: string, payload: { rating: number; comment?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/reviews/${id}`, payload).pipe(map((res) => res?.data ?? res));
  }

  deleteReview(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/reviews/${id}`).pipe(map((res) => res?.data ?? res));
  }
}
