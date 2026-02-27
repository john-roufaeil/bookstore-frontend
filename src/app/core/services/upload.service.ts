import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

type CloudinarySignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder?: string;
  uploadPreset?: string;
};

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId?: string;
};

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiUrl = `${environment.apiUrl}/uploads`;

  constructor(private http: HttpClient) {}

  getCloudinarySignature(): Observable<CloudinarySignature> {
    return this.http.post<any>(`${this.apiUrl}/cloudinary-signature`, {}).pipe(map((res) => res.data));
  }

  uploadBookCover(file: File): Observable<CloudinaryUploadResult> {
    return this.getCloudinarySignature().pipe(
      switchMap((sig) => {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        if (sig.folder) form.append('folder', sig.folder);
        if (sig.uploadPreset) form.append('upload_preset', sig.uploadPreset);

        return this.http
          .post<any>(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, form)
          .pipe(
            map((res) => ({
              secureUrl: res.secure_url as string,
              publicId: res.public_id as string | undefined,
            }))
          );
      })
    );
  }
}

