import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslatorService {

  constructor(private httpclient: HttpClient) { }

  GetAllArchive(
    room: string,
    token: string
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'GetArchive',
      Room: room,
      Token: token
    }, { headers, observe: 'response', responseType: 'text' }));
  }
}
