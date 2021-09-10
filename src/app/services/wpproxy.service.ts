import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WPproxyService {

  constructor(private httpclient: HttpClient) { }

  getRoom(): Observable<any>  {
    return (this.httpclient.get(environment.DBConn + '/Room/'));
  }

  ListenToRoom(btoken: string):Observable<any> {
    const headers = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    };

    return (this.httpclient.get(environment.DBConn + '/FetchRaw/?BToken=' + btoken, {headers: headers}));
  }

  TestRoom(btoken: string):Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/FetchRaw/', { 
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  getArchive(btoken: string):Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/FetchRaw/', { 
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text'}));
  }
}
