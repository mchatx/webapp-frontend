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
    clearInterval(this.ForceRefresh);
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
      TargetURL += "&TL=OK";
    }
  
    return (TargetURL);
  }

  AddChatSkimmer() {
    this.ModalMenu = 0;
    let URLquery: any = this.ShortenStreamLink(this.AddLink);
    URLquery.TL = "OK";

    if (!URLquery) {
      this.ModalNotif = true;
      this.NotifText = "UNRECOGNIZED LINK";
    } else {
      if (URLquery.TL == "OK") {
        if (URLquery.link){
          this.StartSync(this.URLConstructor(URLquery), URLquery.link.slice(0, 2));
        } else {
          this.StartSync(this.URLConstructor(URLquery), URLquery.channel.slice(0, 2));
        }
      } else if (URLquery.link){
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

          case "YT_":
            this.StartSync(this.URLConstructor(URLquery), "YT");
            break;  

          default:
            this.StartSync(this.URLConstructor(URLquery), "SYS")  
            break;
        }
      } else {
        this.StartSync(this.URLConstructor(URLquery), "SYS")
      }
    }
  }

  //-----------------------------------  SYNCING  -----------------------------------
  Synced:boolean = false;
  ES: EventSource | undefined = undefined;
  SyncToken:string = "";
  WS: WebSocket | undefined = undefined;
  TMIClient: tmi.Client | undefined = undefined;
  ForceRefresh: number | undefined = undefined;

  StartSync(ESLink: string, Type: string) {
    if (!this.ForceRefresh){
      this.ForceRefresh = window.setInterval(() => {
        this.PushNewEntryList({
          type: "PING",
          data: undefined
        });
      }, 1000);  
    }

    this.ES = new EventSource(ESLink);
    
    this.ES.onmessage = e => {
      if (e.data == "[]") return;
      
      var parseData = JSON.parse(e.data);
      if (!parseData.flag){
        for (var i = 0; i < parseData.length; i++){
          switch (Type) {
            case "YT":
              this.PushNewEntryList({
                type: Type,
                data: {
                  author: parseData[i].author,
                  authorPhoto: parseData[i].authorPhoto,
                  mod: parseData[i].Mod,
                  badge: parseData[i].badgeContent,
                  message: parseData[i].content,
                  TL: parseData[i].TL
                }
              })                  
              break;
            
            case "TW":
              this.PushNewEntryList({
                type: Type,
                data: {
                  author: parseData[i].author,
                  badges: parseData[i].badges,
                  emotes: parseData[i].emotes,
                  message: parseData[i].message,
                  TL: parseData[i].TL
                }
              })
              break;
            
            case "TC":
              this.PushNewEntryList({
                type: Type,
                data: {
                  author: parseData[i].author,
                  authorPhoto: parseData[i].authorPhoto,
                  grade: parseData[i].grade,
                  message: parseData[i].message,
                  TL: parseData[i].TL
                }
              })
              break;
          }
        }
      }
    }

    this.ES.onerror = e => {
      this.ES?.close();
      clearInterval(this.ForceRefresh);
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
    
      case "TC":
        //https://twitcasting.tv/
        var TempCont: string = Entry.data.message;
        Entry.data.message = [];

        while (TempCont.indexOf('<img') != -1){
          const start = TempCont.indexOf('<img');
          const end = TempCont.indexOf('/>');
          if ((start == -1) || (end == -1)) {
            break;
          }
          Entry.data.message.push({
            type: "S",
            content: TempCont.slice(0, start)
          });
          var ImgHtml = TempCont.slice(start, end + 2);
          ImgHtml = ImgHtml.slice(ImgHtml.indexOf("src=") + 5);
          ImgHtml = ImgHtml.slice(0, ImgHtml.indexOf("\""));
          Entry.data.message.push({
            type: "M",
            content: "https://twitcasting.tv" + ImgHtml
          });
          TempCont = TempCont.slice(end + 2);
        }
        
        if (TempCont != ""){
          Entry.data.message.push({
            type: "S",
            content: TempCont
          })
        }
        this.EntryList.push(Entry);
        break;

      case "YT":
        Entry.data.message = Entry.data.message.map((e:string) => {
          if (e.indexOf("http") == 0){
            return({
              type: "M",
              content: e
            })
          } else {
            return({
              type: "S",
              content: e
            })
          }
        });
        this.EntryList.push(Entry);
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