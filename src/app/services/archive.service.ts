import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {

  constructor(private httpclient: HttpClient) { }

  //------------------------------------------- ARCHIVE GET PAGE HANDLER -------------------------------------------
  FetchArchive(
    btoken: string,
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/FetchRaw/', {
      BToken: btoken
    }, { headers, observe: 'response', responseType: 'text' }));
  }
  //=========================================== ARCHIVE GET PAGE HANDLER ===========================================



  //------------------------------------------- ARCHIVE EDIT HANDLER -------------------------------------------
  AddArchive(
    room: string,
    token: string,
    nick: string | undefined,
    link: string,
    hidden: boolean,
    extshare: boolean,
    tags: string | undefined,
    pass: boolean,
    passstr: string,
    streamlink: string | undefined,
    entries: any,
    note : string | undefined,
    downloadable: boolean,
    auxlink: string[]
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'Add',
      Room: room,
      Token: token,
      Nick: nick,
      Link: link,
      Hidden: hidden,
      ExtShare: extshare,
      Pass: pass,
      PassStr: passstr,
      Tags: tags,
      StreamLink: streamlink,
      Entries: entries,
      Note: note,
      Downloadable: downloadable,
      AuxLink: auxlink
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  UpdateArchive(
    room: string,
    token: string,
    link: string | undefined,
    entries: any
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'Update',
      Room: room,
      Token: token,
      Link: link,
      Entries: entries
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  EditArchive(
    room: string,
    token: string,
    link: string | undefined,
    nick: string | undefined,
    hidden: boolean,
    extshare: boolean,
    tags: string | undefined,
    pass: boolean,
    passstr: string,
    streamlink: string | undefined,
    note: string | undefined,
    downloadable: boolean,
    auxlink: string[]
  ): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    if (!link){
      link = "";
    }
    if (!nick){
      nick = "";
    }
    if (!tags){
      tags = "";
    }
    if (!streamlink){
      streamlink = "";
    }
    if (!note){
      note = "";
    }

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'Edit',
      Room: room,
      Token: token,
      Link: link,
      Nick: nick,
      Hidden: hidden,
      ExtShare: extshare,
      Pass: pass,
      PassStr: passstr,
      Tags: tags,
      StreamLink: streamlink,
      Note : note,
      Downloadable: downloadable,
      AuxLink: auxlink
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  DeleteArchive(
    room: string,
    token: string,
    link: string | undefined
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'Delete',
      Room: room,
      Token: token,
      Link: link
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  GetAllArchive(
    room: string,
    token: string,
    page: number | undefined = undefined
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    if (page) {
      return (this.httpclient.post(environment.DBConn + '/Archive/', {
        Act: 'GetArchive',
        Room: room,
        Page: page,
        Token: token
      }, { headers, observe: 'response', responseType: 'text' }));
    } else {
      return (this.httpclient.post(environment.DBConn + '/Archive/', {
        Act: 'GetArchive',
        Room: room,
        Token: token
      }, { headers, observe: 'response', responseType: 'text' }));
    }
  }

  GetOneArchive(
    room: string,
    token: string,
    link: string | undefined
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'GetOne',
      Room: room,
      Token: token,
      Link: link
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  GetOneArchiveInfo(
    room: string,
    token: string,
    link: string | undefined
  ): Observable<any> {

    const headers = { 'Content-Type': 'application/json' };

    return (this.httpclient.post(environment.DBConn + '/Archive/', {
      Act: 'GetArchiveInfo',
      Room: room,
      Token: token,
      Link: link
    }, { headers, observe: 'response', responseType: 'text' }));
  }

  //=========================================== ARCHIVE EDIT HANDLER ===========================================



  //-------------------- SESSION SAVER -------------------
  Autosave(data: any, Token: string, room: string, link: string) {
    const headers = {
      'Content-Type': 'application/json',
      'authorization': 'Bearer ' + Token
    }
  
    return (this.httpclient.post(environment.DBConn + '/AutoSave', {
      Room: room,
      Link: link,
      ...data
    }, { headers, observe: 'response', responseType: 'text' }));
  }
  
}
