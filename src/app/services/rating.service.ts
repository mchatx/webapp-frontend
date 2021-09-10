import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RatingService {

  constructor(private httpclient: HttpClient) { }

  RatingPost(
    bToken: string,
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Rating/', {
      BToken : bToken,
    }, { headers, observe: 'response', responseType: 'text' }));
  }
}
