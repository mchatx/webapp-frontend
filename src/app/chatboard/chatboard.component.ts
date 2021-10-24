import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare } from '@fortawesome/free-regular-svg-icons';
import { ChatskimmerService } from '../services/chatskimmer.service';
import { environment } from '../../environments/environment';
import * as tmi from 'tmi.js';

class MessageEntry {
  type: string = "";
  data: any | undefined;
}

@Component({
  selector: 'app-chatboard',
  templateUrl: './chatboard.component.html',
  styleUrls: ['./chatboard.component.scss']
})
export class ChatboardComponent implements OnInit, OnDestroy {
  @ViewChild('cardcontainer') cardcontainer !: ElementRef; 

  FFsize:number = 15;
  FStyle:string = "Ubuntu";
  TxAlign:CanvasTextAlign = "left";
  MaxDisplay = 200;
  BGColour:string = "#28282B";
  OT:number = 1;

  ModalMenu:number = 0;
  AddLink:string = "";

  ModalNotif:boolean = false;
  NotifText: string = "";

  EntryList: MessageEntry[] = [];

  constructor(
    private ChatSkimmer: ChatskimmerService
  ) { }

  ngOnInit(): void {
    this.PushNewEntryList({
      type: "SYS",
      data: {
        author: "SERVER",
        message: "チャット板にようこそ"
      }
    });
  }

  ngOnDestroy(): void {
    this.ES?.close();
    this.WS?.close();
    this.TMIClient?.disconnect();
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
  WS: WebSocket|undefined = undefined;
  TMIClient: tmi.Client|undefined = undefined;

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

  StartSyncWS(WSLink: string) {
    this.WS = new WebSocket(WSLink);

    this.WS.onmessage = e => {
      if (e.data != "[]"){
        JSON.parse(e.data).forEach((dt:any) => {
          if (dt.type == "comment"){
            console.log(dt);
            this.PushNewEntryList({
              type: "TC",
              data: {
                author: dt.author.name,
                message: dt.htmlMessage ? dt.htmlMessage : dt.message
              }
            })
          }
        });
      }
    }

    this.WS.onerror = e => {
      this.WS?.close();
    }

    this.WS.onopen = e => {
      console.log("START SYNCING WS");
    }
  }

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

      if (tags["display-name"]) {
        this.PushNewEntryList({
          type: "TW",
          data: {
            author: tags["display-name"],
            badges: tags.badges,
            emotes: tags.emotes,
            message: message,
          }
        })
      }
    });

    this.TMIClient.on("connected", (address, port) => {
      console.log("TMI CONNECTED");
    });

    //this.TMIClient.on("disconnected", reason => {});
    //this.TMIClient.on("join", (channel, username, self) => {});
    //this.client.on("logon", () => {});
  }
  //===================================  SYNCING  ===================================

  AutoScroll:boolean = true;

  ElementScrolled(){
    const threshold = 50;
    const position = this.cardcontainer.nativeElement.scrollTop + this.cardcontainer.nativeElement.offsetHeight;
    const height = this.cardcontainer.nativeElement.scrollHeight;
    if (position > height - threshold){
      this.AutoScroll = true;
    } else {
      this.AutoScroll = false;
    }
  }

  PushNewEntryList(Entry: MessageEntry) {
    switch (Entry.type) {
      case "TW":
        /*
        Object { 304822010: (2) […], 304822061: (3) […] }
        */
        //https://static-cdn.jtvnw.net/emoticons/v1/[emote_id]/2.0
        //https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_e2c96c0c122e486db7474bee9a35b398/default/light/3.0
        if (Entry.data.emotes) {
          var EmoteList: any[] = [];
  ​        Object.entries(Entry.data.emotes).forEach(([id, positions]: any) => {
            positions.forEach( (e:string) => {
              const [start, end] = e.split("-");
              EmoteList.push({
                id: id,
                start: start,
                end: end
              });
            });
          });
          EmoteList.sort((a,b) => a.start - b.start);

          var HTMLMessage: any[] = [];
          for (let i = 0; i < EmoteList.length; i++){
            if (i == 0){
              if (EmoteList[i].start != 0){
                HTMLMessage.push({
                  type: "S",
                  content: Entry.data.message.slice(0, EmoteList[i].start)
                });
              }
              if (EmoteList[i].id.indexOf("emotesv2") == 0){
                HTMLMessage.push({
                  type: "M",
                  content: "https://static-cdn.jtvnw.net/emoticons/v2/" + EmoteList[i].id + "/default/light/3.0"
                });
              } else {
                HTMLMessage.push({
                  type: "M",
                  content: "https://static-cdn.jtvnw.net/emoticons/v1/" + EmoteList[i].id + "/2.0"
                });
              }
            } else {
              HTMLMessage.push({
                type: "S",
                content: Entry.data.message.slice(EmoteList[i - 1].end + 1, EmoteList[i].end)
              });
              if (EmoteList[i].id.indexOf("emotesv2") == 0){
                HTMLMessage.push({
                  type: "M",
                  content: "https://static-cdn.jtvnw.net/emoticons/v2/" + EmoteList[i].id + "/default/light/3.0"
                });
              } else {
                HTMLMessage.push({
                  type: "M",
                  content: "https://static-cdn.jtvnw.net/emoticons/v1/" + EmoteList[i].id + "/2.0"
                });
              }
            }
            
            if (i == EmoteList.length - 1){
              if (EmoteList[i].end != Entry.data.message.length - 1){
                HTMLMessage.push({
                  type: "S",
                  content: Entry.data.message.slice(EmoteList[i].end + 1)
                });
              }
            } 
          }

          delete Entry.data.emotes;
          Entry.data.message = HTMLMessage;
          this.EntryList.push(Entry);
        } else {
          Entry.data.message = [{
            type: "S",
            content: Entry.data.message
          }]
          this.EntryList.push(Entry);
        }
        break;
    
      default:
        this.EntryList.push(Entry);
        break;
    }    

    if (this.EntryList.length > this.MaxDisplay){
      this.EntryList.shift();
    }

    if (this.AutoScroll) {
      setTimeout(() => {
        if (this.cardcontainer){
          const SaveScroll = this.AutoScroll;
          this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
          this.AutoScroll = SaveScroll;
        }
      }, 100);
    }
  }


  faArrowLeft = faArrowLeft;
  faPlusSquare = faPlusSquare;
}
