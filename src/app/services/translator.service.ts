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

    return (this.httpclient.post(environment.DBConn2 + '/Archive/', {
      Act: 'GetArchive',
      Room: room,
      Token: token
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  Login(token: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Login/', {
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  FetchRaw(token: string, btoken: string): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    return (this.httpclient.post(environment.DBConn + '/FetchRaw/', {
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  SendSync(token: string, dt: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return (this.httpclient.post(environment.DBConn + '/sync/', {
      UID: token,
      data: dt
    }, { headers, observe: 'response', responseType: 'text'}));
  }
}
