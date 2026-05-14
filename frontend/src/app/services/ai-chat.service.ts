import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private apiUrl = `/api/ai-chat`;

  constructor(private http: HttpClient) { }

  sendMessage(message: string, chatHistory: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl, { message, chatHistory });
  }
}
