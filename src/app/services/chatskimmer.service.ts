import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class ChatskimmerService {

  constructor(
    private httpclient: HttpClient
    ) { }


  SendRequest(query: any): Observable<any> {
    /*
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
    */
    let TargetURL: string = environment.DBConn3 + '/ChatProxy?';

    if (query.link) {
      TargetURL += "link=" + encodeURIComponent(query.link);
    } else if (query.channel) {
      TargetURL += "channel=" + encodeURIComponent(query.channel);
    }

    if (query.TL) {
      TargetURL += "&TL=ok";
    }

    return (this.httpclient.get(TargetURL));
  }

  TwitchID(ChannelID: string): Observable<any> {
    return (this.httpclient.get(environment.DBConn3 + '/AuxData?ChannelID=' + encodeURIComponent(ChannelID)));
  }

  GetTwitchData(ChannelID: string): Observable<any> {
    return (this.httpclient.get("https://badges.twitch.tv/v1/badges/channels/" + ChannelID + "/display"));
  }

  GetTwitchGlobal(): Observable<any> {
    return (this.httpclient.get("https://badges.twitch.tv/v1/badges/global/display"));
  }
}
