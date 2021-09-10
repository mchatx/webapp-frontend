import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  constructor(private httpclient: HttpClient) { }

  PushRoomApplication(nick:string, pass:string, note:string, contact:string):Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Room/', { 
      Nick: nick, 
      Pass: pass, 
      Note: note, 
      Contact: contact
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  // RETURN TOKEN WHEN SUCCESS OR HTTP STATUS 400 FOR ERROR
  GetToken(room:string, pass: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Login/', {
      Room: room, 
      Pass: pass
    }, { headers, observe: 'response'}));
  }

  GetTokenPublic(room:string, pass: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Login/', {
      Room: room, 
      Pass: pass,
      Public: true
    }, { headers, observe: 'response'}));
  }

  //  SIGN UP SEND DATA
  PostSignUp(Data: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', {
      Act: 'SignUp', 
      BToken: Data
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  //  VERIVY NEW ACCOUNT
  PostVerivy(token: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', {
      Act: 'Verivy', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  PostResetPass(token: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'ResetPass', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  GetAccountData(token:string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'Get', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  //  ACCOUNT ROOM HANDLER
  PostDeleteAccount(token:string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'Delete', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  PostChangePass(token:string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'ChangePass', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  PostChangeEmail(token:string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'ChangeEmail', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  PostChangeFPInfo(token:string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};
    return (this.httpclient.post(environment.DBConn + '/Account/', { 
      Act: 'ChangeFPInfo', 
      BToken: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  // RETURN OK WHEN SUCCESS OR HTTP STATUS 400 FOR ERROR
  CheckToken(room:string, token: string): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Login/', { 
      Room: room, 
      Token: token
    }, { headers, observe: 'response', responseType: 'text'}));
  }

}
