import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthorService {
    private apiUrl = `${environment.apiUrl}/authors`;

    constructor(private http: HttpClient) { }

    getAuthors(): Observable<any[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(res => res.data)
        );
    }
}
