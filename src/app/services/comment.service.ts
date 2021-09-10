import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(private httpclient: HttpClient) { }

  GetArchiveData(
    bToken: string,
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/ArchiveCheck/', {
      BToken : bToken,
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  CommentPost(
    bToken: string,
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Comment/', {
      BToken : bToken,
    }, { headers, observe: 'response', responseType: 'text' }));
  }
}
