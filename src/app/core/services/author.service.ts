import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Author } from '../models/author.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private apiUrl = `${environment.apiUrl}/authors`;

  constructor(private http: HttpClient) { }

  getAuthors(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<Author[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(res => res.data.authors as Author[])
    );
  }

  getAuthor(id: string): Observable<Author> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data as Author)
    );
  }
}
