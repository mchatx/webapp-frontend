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

    return (this.httpclient.post(environment.DBConn2 + '/Login/', {
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  FetchRaw(token: string, btoken: string): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    return (this.httpclient.post(environment.DBConn2 + '/FetchRaw/', {
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text'}));
  }
  
  CheckIfMemberOnly(VidID: string): Observable<any> {
    return (this.httpclient.get("https://holodex.net/api/v2/videos/" + VidID));
  }

  HolodexBounce(btoken: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn2 + '/HolodexBounce/', {
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text'}));
  }
  //-------------------------- SYNC HANDLER --------------------------
  SignInSync(dt: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return (this.httpclient.post(environment.DBConn4 + '/SignIn/', {
      data: dt
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  SendSync(token: string, dt: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Btoken ' + token
    };

    return (this.httpclient.post(environment.DBConn4 + '/Master/', dt, { headers, observe: 'response', responseType: 'text'}));
  }

  AutoResync(BToken: string): Observable<any> {
    const headers = {
      'Content-Type': 'application/json'
    };

    return (this.httpclient.post(environment.DBConn4 + '/AutoSync/Master', {
      BToken: BToken
    }, { headers, observe: 'response', responseType: 'text'}));
  }
}
