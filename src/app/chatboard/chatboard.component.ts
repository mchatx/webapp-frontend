import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { faArrowLeft, faLaughBeam, faFrownOpen, faLanguage, faQuestionCircle, faWrench } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare, faMinusSquare } from '@fortawesome/free-regular-svg-icons';
import { faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { ChatskimmerService } from '../services/chatskimmer.service';
import { environment } from '../../environments/environment';
import * as tmi from 'tmi.js';

class MessageEntry {
  type: string = "";
  data: any | undefined;
}

class Listener {
  id: string = "";
  config: {
    title: string;
    type: string;
    link: string | undefined;
    channel: string | undefined;
    TL: boolean;
  } = { 
    title: "",
    type: "",
    link: undefined,
    channel: undefined,
    TL: false
  };
  WS: WebSocket | undefined;
  ES: EventSource | undefined;
  TMIC : tmi.Client | undefined;
  Connected: boolean = false;
  AuxData: any;
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
  MaxDisplay = 300;
  BGColour:string = "#28282B";
  OT:number = 1;

  ModalMenu:number = 0;
  AddLink:string = "";

  ModalNotif:boolean = false;
  NotifText: string = "";

  EntryLoader: boolean = false;
  TempEntryContainer: MessageEntry[] = [];
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
    this.ChatSource.forEach(e => {
      if (e.ES) {
        e.ES.close();
      }
      if (e.WS) {
        e.WS.close();
      }
      if (e.TMIC) {
        e.TMIC.disconnect();
      }
    })
    if (this.ForceRefresh){
      clearInterval(this.ForceRefresh);
    }
  }

  ShortenStreamLink(s : string){
    const os = s;

    if (s.indexOf("https://www.youtube.com/watch?v=") != -1){
      s = s.replace("https://www.youtube.com/watch?v=", "YT_");
      if (s.indexOf("?") != -1){
        s = s.slice(0, s.indexOf("?"));
      }
      if (s.indexOf("/") != -1){
        s = s.slice(0, s.indexOf("/"));
      }
      return ({
        title: os,
        type: "YT",
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
        title: os,
        type: "YT",
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
        title: os,
        type: "TW",
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
        title: os,
        type: "TC",
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
    let URLquery: any = this.ShortenStreamLink(this.AddLink);
    const ID = Date.now().toString();
   
    var Source:Listener = {
      id: ID,
      config: URLquery,
      Connected: false,
      WS: undefined,
      ES: undefined,
      TMIC: undefined,
      AuxData : undefined
    };

    this.ChatSource.push(Source);

    if (!URLquery) {
      this.ModalNotif = true;
      this.NotifText = "UNRECOGNIZED LINK";
    } else {
      if (URLquery.TL == "OK") {
        if (URLquery.link){
          this.StartSync(Source, URLquery.link.slice(0, 2));
        } else {
          this.StartSync(Source, URLquery.channel.slice(0, 2));
        }
      } else if (URLquery.link){
        switch (URLquery.link.slice(0, 3)) {
          case "TC_":
            this.StartSyncWS(Source);
            break;

          case "TW_":
            this.StartSyncTMI(Source);
            break;

          case "YT_":
            this.StartSync(Source, "YT");
            break;  

          default:
            this.StartSync(Source, "SYS");  
            break;
        }
      } else {
        this.StartSync(Source, "SYS")
      }
    }

    this.AddLink = "";
  }

  //-----------------------------------  SYNCING  -----------------------------------
  ForceRefresh: number | undefined = undefined;
  ChatSource: Listener[] = [];

  DeSync(UID: string) {
    this.ChatSource.filter(e => e.id == UID).forEach(e => {
      if (e.ES){
        e.ES.close();
      }
      if (e.WS) {
        e.WS.close();
      }
      if (e.TMIC) {
        e.TMIC.disconnect();
      }
    });
    this.ChatSource = this.ChatSource.filter(e => e.id != UID);
  }

  TLSwitch(UID: string) {
    this.ChatSource.filter(e => e.id == UID).map(e => {
      e.config.TL = !e.config.TL;
      e.Connected = false;
      return e;
    }).forEach(async (e) => {
      if (e.config.TL){
        if (e.WS){
          await e.WS.close();
          delete e.WS;
          this.StartSync(e, e.config.type);
        }
        if (e.TMIC){
          await e.TMIC.disconnect();
          delete e.TMIC;
          this.StartSync(e, e.config.type);
        }
        if (e.ES){
          await e.ES.close();
          delete e.ES;
          this.StartSync(e, e.config.type);
        }
      } else {
        await e.ES?.close();
        delete e.ES;
        switch (e.config.type) {
          case "YT":
            this.StartSync(e, "YT");
            break;
        
          case "TW":
            this.StartSyncTMI(e);
            break;

          case "TC":
            this.StartSyncWS(e);
            break;
        }
      }
    });
  }

  StartSync(Target: Listener, Type: string) {
    var ESLink: string = this.URLConstructor(Target.config);

    if (!this.ForceRefresh){
      this.ForceRefresh = window.setInterval(() => {
        this.PushNewEntryList({
          type: "PING",
          data: undefined
        });
      }, 1000);  
    }

    var ES = new EventSource(ESLink);
    Target.ES = ES;

    ES.onmessage = e => {
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
                  type: parseData[i].type,
                  SC: parseData[i].SC,
                  BC: parseData[i].BC,
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

    ES.onerror = e => {
      ES.close();
      this.ChatSource.filter(e => e.id == Target.id).map(e => {
        e.Connected = false;
        return e;
      });
    }

    ES.onopen = e => {
      console.log("START SYNCING");
      Target.Connected = true;
    }
  }

  StartSyncWS(Target: Listener) {
    this.ChatSkimmer.SendRequest(Target.config).subscribe({
      error: error => {
        this.ChatSource.filter(e => e.id == Target.id).map(e => {
          e.Connected = false;
          return e;
        });
      },
      next: data => {
        var WS = new WebSocket(data.url);

        WS.onmessage = e => {
          if (e.data != "[]"){
            JSON.parse(e.data).forEach((dt:any) => {
              if (dt.type == "comment"){
                this.PushNewEntryList({
                  type: "TC",
                  data: {
                    author: dt.author.name,
                    authorPhoto: dt.author.profileImage,
                    grade: dt.author.grade,
                    message: dt.htmlMessage ? dt.htmlMessage : dt.message
                  }
                })
              }
            });
          }
        }
    
        WS.onerror = e => {
          WS.close();
          this.ChatSource.filter(e => e.id == Target.id).map(e => {
            e.Connected = false;
            return e;
          });
        }
    
        WS.onopen = e => {
          Target.Connected = true;
        }

        Target.WS = WS;
      }
    });
  }

  async StartSyncTMI(Target: Listener){
    var channel: string = "";
    if (Target.config.link){
      channel = Target.config.link.slice(3);
      this.GetTwitchBadge(Target.config.link, Target.id);
    }
    
    if (!this.TwitchBadgeArray){
      this.GetGlobalTwitchBadge();
    }

    const TMIOptions: tmi.Options = {
      channels: [channel],
      connection: {
        maxReconnectAttempts: 2,
        maxReconnectInverval: 10,
        reconnect: true,
        secure: true
      }
    };

    var TMIClient: tmi.Client = tmi.Client(TMIOptions);

    await TMIClient.connect();
    Target.Connected = true;
    Target.TMIC = TMIClient;

    TMIClient.on("message", (channel, tags, message, self) => {
      if (self) return;

      if (tags["display-name"]) {
        this.PushNewEntryList({
          type: "TW " + Target.id,
          data: {
            author: tags["display-name"],
            badges: tags.badges,
            emotes: tags.emotes,
            message: message,
          }
        })
      }
    });


    TMIClient.on("disconnected", reason => {
      this.ChatSource.filter(e => e.id == Target.id).map(e => {
        e.Connected = false;
        return e;
      });
    });
    //this.TMIClient.on("join", (channel, username, self) => {});
    //this.client.on("logon", () => {});
  }
  //===================================  SYNCING  ===================================



  //----------------------------  TWITCH BADGE HANDLER  ----------------------------
  TwitchBadgeArray: any;

  GetGlobalTwitchBadge(){
    this.ChatSkimmer.GetTwitchGlobal().subscribe({
      next: data => {
        this.TwitchBadgeArray = data.badge_sets;
      },
      error: err => {
        console.log("ERR GET TWITCH DATA")
      }
    });
  }

  GetTwitchBadge(ChannelID : string, UID: string){
    this.ChatSkimmer.TwitchID(ChannelID).subscribe({
      next: data => {
        this.ChatSkimmer.GetTwitchData(data.ChannelID).subscribe({
          next: data => {
            this.ChatSource.filter(e => e.id == UID).map(e => {
              e.AuxData = data.badge_sets;
              return e;
            });
          },
          error: err => {
            console.log("ERR GET TWITCH DATA")
          }
        })
      },
      error: err => {
        console.log("ERR GET TWITCH DATA")
      }
    });
  }

  TwitchURLBadge(dt:any): string{
    switch (dt.type) {
      case "subscriber":
        try {
          return(this.ChatSource.filter(e => e.id == dt.ID)[0].AuxData[dt.type]["versions"][dt.prop]["image_url_1x"]);
        } catch (error) {
          return("");
        }
        break;
   
      default:
        try {
          return(this.TwitchBadgeArray[dt.type]["versions"][dt.prop]["image_url_1x"]);
        } catch (error) {
          return("");
        }
        break;
    }
  }
  //==============================  TWITCH BADGE HANDLER  =============================



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

  YTColourScheme(type: number):string {
    switch (type) {
      case 1:
        return("#008013");
        break;
      
      case 2:
        return("#2832C2");
        break;

      case 3:
        return("#FBB917");
        break;

      default:
        return("");
        break;
    }
  }

  PushNewEntryList(Entry: MessageEntry) {
    switch (Entry.type.slice(0, 2)) {
      case "TW":
        const ID = Entry.type.split(" ")[1];
        Entry.type = Entry.type.slice(0, 2);
        if (Entry.data.badges) {
          const BadgesArr = Entry.data.badges;
          Entry.data.badges = [];
          Object.entries(BadgesArr).forEach(([type, prop]: any) => {
            Entry.data.badges.push({
              type: type,
              prop: prop,
              ID: ID
            });
          })
        }

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
          this.TempEntryContainer.push(Entry);
        } else {
          Entry.data.message = [{
            type: "S",
            content: Entry.data.message
          }]
          this.TempEntryContainer.push(Entry);
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
        this.TempEntryContainer.push(Entry);
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
        this.TempEntryContainer.push(Entry);
        break;

      default:
        this.TempEntryContainer.push(Entry);
        break;
    }    

    if (!this.EntryLoader){
      this.EntryLoader = true;
      this.StartLoader();
    }
  }

  StartLoader(): void {
    const EntryTemp = this.TempEntryContainer.shift();
    if (EntryTemp != undefined){
      this.EntryList.push(EntryTemp);

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
        }, 50);
      }
      
      if (this.TempEntryContainer.length > 50){
        setTimeout(() => {
          this.StartLoader();
        }, 100);
      } else {
        setTimeout(() => {
          this.StartLoader();
        }, 333);
      }
    } else {
      this.EntryLoader = false;
    }
  }

  faFrown = faFrownOpen;
  faBeaming = faLaughBeam;
  faArrowLeft = faArrowLeft;
  faPlusSquare = faPlusSquare;
  faMinusSquare = faMinusSquare;
  faLanguage = faLanguage;
  faTwitch = faTwitch;
  faYoutube = faYoutube;
  faQuestionCircle = faQuestionCircle;
  faWrench = faWrench;
}
