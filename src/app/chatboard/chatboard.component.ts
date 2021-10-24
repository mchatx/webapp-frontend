import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare } from '@fortawesome/free-regular-svg-icons';
import { ChatskimmerService } from '../services/chatskimmer.service';
import { environment } from '../../environments/environment';
import * as tmi from 'tmi.js';

@Component({
  selector: 'app-chatboard',
  templateUrl: './chatboard.component.html',
  styleUrls: ['./chatboard.component.scss']
})
export class ChatboardComponent implements OnInit, OnDestroy {

  ModalMenu:number = 0;
  AddLink:string = "";

  ModalNotif:boolean = false;
  NotifText: string = "";

  constructor(
    private ChatSkimmer: ChatskimmerService
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.ES?.close();
    this.WS?.close();
    this.TMIClient?.disconnect();
  }

  @ViewChild('navMenu') navMenu!: ElementRef;

  toggleNavbar() {
    this.navMenu.nativeElement.classList.toggle('is-active');
  }

  ShortenStreamLink(s : string){
    if (s.indexOf("https://www.youtube.com/watch?v=") != -1){
      s = s.replace("https://www.youtube.com/watch?v=", "YT_");
      if (s.indexOf("?") != -1){
        s = s.slice(0, s.indexOf("?"));
      }
      if (s.indexOf("/") != -1){
        s = s.slice(0, s.indexOf("/"));
      }
      return ({
        link: s
      });
    } else if (s.indexOf("https://www.youtube.com/channel/") != -1) {
      s = s.replace("https://www.youtube.com/channel/", "YT_");
      if (s.indexOf("?") != -1){
        s = s.slice(0, s.indexOf("?"));
      }
      if (s.indexOf("/") != -1){
        s = s.slice(0, s.indexOf("/"));
      }
      return ({
        channel: s
      });
    } else if (s.indexOf("https://www.twitch.tv/") != -1) {
      s = s.replace("https://www.twitch.tv/", "TW_");
      if (s.indexOf("?") != -1){
        s = s.slice(0, s.indexOf("?"));
      }
      if (s.indexOf("/") != -1){
        s = s.slice(0, s.indexOf("/"));
      }
      return ({
        link: s
      });
    } else if (s.match(/http(.*)twitcasting.tv\//g)?.length != 0) {
      s = s.replace(/http(.*)twitcasting.tv\//g, "TC_");
      if (s.indexOf("?") != -1){
        s = s.slice(0, s.indexOf("?"));
      }
      if (s.indexOf("/") != -1){
        s = s.slice(0, s.indexOf("/"));
      }
      return ({
        link: s
      });
    } else {
      return (false);
    }
  }

  URLConstructor(query: any) : string {
    let TargetURL: string = environment.DBConn3 + '/ChatProxy?';
  
    if (query.link) {
      TargetURL += "link=" + encodeURIComponent(query.link);
    } else if (query.channel) {
      TargetURL += "channel=" + encodeURIComponent(query.channel);
    }
  
    if (query.TL) {
      TargetURL += "&TL=ok";
    }
  
    return (TargetURL);
  }

  AddChatSkimmer() {
    this.ModalMenu = 0;
    let URLquery = this.ShortenStreamLink(this.AddLink);
    
    if (!URLquery) {
      this.ModalNotif = true;
      this.NotifText = "UNRECOGNIZED LINK";
    } else {
      if (URLquery.link){
        switch (URLquery.link.slice(0, 3)) {
          case "TC_":
            this.ChatSkimmer.SendRequest(URLquery).subscribe({
              error: error => {
                this.ModalNotif = true;
                this.NotifText = "ERROR FETCHING DATA";
              },
              next: data => {
                this.StartSyncWS(data.url);
              }
            });
            break;

          case "TW_":
            this.StartSyncTMI(URLquery.link.slice(3));
            break;
        
          default:
            this.StartSync(this.URLConstructor(URLquery))  
            break;
        }
      } else {
        this.StartSync(this.URLConstructor(URLquery))
      }
    }
  }

//-----------------------------------  SYNCING  -----------------------------------
Synced:boolean = false;
ES: EventSource|undefined = undefined;
SyncToken:string = "";

StartSync(ESLink: string) {
  this.ES = new EventSource(ESLink);
    
  this.ES.onmessage = e => {
    console.log(e);
  }

  this.ES.onerror = e => {
    this.ES?.close();
  }

  this.ES.onopen = e => {
    console.log("START SYNCING");
  }
}

StopSync() {
}

WS: WebSocket|undefined = undefined;
StartSyncWS(WSLink: string) {
  this.WS = new WebSocket(WSLink);

  this.WS.onmessage = e => {
    console.log(e);
  }

  this.WS.onerror = e => {
    this.WS?.close();
  }

  this.WS.onopen = e => {
    console.log("START SYNCING WS");
  }
}

TMIClient: tmi.Client|undefined = undefined;
async StartSyncTMI(channel: string){
  const TMIOptions: tmi.Options = {
    channels: [channel],
    connection: {
      maxReconnectAttempts: 2,
      maxReconnectInverval: 10,
      reconnect: true,
      secure: true
    }
  };

  this.TMIClient = tmi.Client(TMIOptions);

  await this.TMIClient.connect();

  this.TMIClient.on("message", (channel, tags, message, self) => {
    if (self) return;

    console.log({
        author: tags["display-name"],
        badges: tags.badges,
        emotes: tags.emotes,
        message: message,
    })
  });

  this.TMIClient.on("connected", (address, port) => {
    console.log("TMI CONNECTED");
  });

  //this.TMIClient.on("disconnected", reason => {});
  //this.TMIClient.on("join", (channel, username, self) => {});
  //this.client.on("logon", () => {});
}
//===================================  SYNCING  ===================================

  faArrowLeft = faArrowLeft;
  faPlusSquare = faPlusSquare;
}
