import { Component, OnInit, Renderer2, ViewChild, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { SHA256, enc } from 'crypto-js';
import { DomSanitizer } from '@angular/platform-browser';
import { timer } from 'rxjs';
import { ChatskimmerService } from '../services/chatskimmer.service';
import { environment } from '../../environments/environment';
import * as tmi from 'tmi.js';

/*
  Params
  room = room nick
  pass = room pass
  max = maximum number of displayed text
  ot = outline thickness

  Css
  html:
    background-color
  h1:
    background-color
    font-size
    font-family
    text-align
*/

class FullEntry {
  Author: string | undefined;
  Stext: string | undefined;
  Stime: number = 0;
  CC: string | undefined;
  OC: string | undefined;
  key: string | undefined;
}

@Component({
  selector: 'app-proxyapp',
  templateUrl: './proxyapp.component.html',
  styleUrls: ['./proxyapp.component.scss'],
})


export class ProxyappComponent implements OnInit, OnDestroy {
  @ViewChild('cardcontainer', { static: false }) cardcontainer !: ElementRef;
  @ViewChild('ChatContainer', { static: false }) ChatContainer !: ElementRef;
  @ViewChildren('item') itemElements!: QueryList<any>;
  scrollContainer: any;

  Status: string | undefined = "";
  EntryLoader: boolean = false;
  TempEntryContainer: FullEntry[] = [];
  EntryList: FullEntry[] = [];
  EntryContainer: any[] = [];
  DisplayElem: HTMLHeadingElement[] = [];
  FFsize: number = 40;
  FStyle: string = "Ubuntu";
  TxAlign: string = "center";
  MaxDisplay = 100;
  OT: number = 1;
  Ani: string = "";
  ChatProxyEle: HTMLIFrameElement | undefined;
  LoadFont: boolean = false;

  CardBGColour = {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  }

  scrollend: boolean = true;
  ChatFilterMode: boolean = false;
  Filter = {
    author: [""],
    keyword: ""
  }
  AuthName: boolean = true;
  AniDuration: number = 300;

  OverrideCStyle: boolean = false;
  OverrideCC: string = "#000000"
  OverrideOC: string = "#000000"

  constructor(
    private Renderer: Renderer2,
    private TGEnc: TsugeGushiService,
    private route: ActivatedRoute,
    private Sanitizer: DomSanitizer,
    private ChatSkimmer: ChatskimmerService
  ) { }

  ngOnDestroy(): void {
    this.ES?.close();
    this.WS?.close();
    this.TMIClient?.disconnect();
  }


  ngOnInit(): void {
    this.ParamParse(this.route.snapshot.paramMap.get('token'));
  }

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustResourceUrl("https://fonts.googleapis.com/css2?family=" + this.FStyle[0].replace(/ /g, "+") + "&display=swap");
    } else {
      return ("Error");
    }
  }
  //--------------------------------------------- PARAM PARSER ---------------------------------------------
  ParamParse(Token: string | null) {
    if (Token == null) {
      return;
    }

    try {
      var ParamsList = JSON.parse(decodeURI(this.TGEnc.TGDecoding(decodeURIComponent(Token))));
    } catch (error) {
      return;
    }

    if (ParamsList["max"]) {
      var test = ParamsList["max"].toString();
      if (Number(test) != NaN) {
        this.MaxDisplay = Number(test);
      }
    }

    if (ParamsList["FSF"]) {
      this.FFsize = ParamsList["FSF"];
    }
    if (ParamsList["FSS"]) {
      this.FStyle = ParamsList["FSS"];
    }
    this.LoadFont = true;

    if (ParamsList["TAL"]) {
      this.TxAlign = ParamsList["TAL"];
    }

    if (ParamsList["OCS"]) {
      this.OverrideCStyle = true;
    }

    if (ParamsList["CCC"]) {
      this.OverrideCC = ParamsList["CCC"];
    }

    if (ParamsList["COC"]) {
      this.OverrideOC = ParamsList["COC"];
    }

    if (ParamsList["ot"]) {
      var test = ParamsList["ot"].toString();
      if (Number(test) != NaN) {
        this.OT = Number(test);
      }
    }

    if (ParamsList["ani"]) {
      var test = ParamsList["ani"].toString();
      if (test != null) {
        this.Ani = test;
      }
    }

    if (ParamsList["CBC"]){
      this.CardBGColour = ParamsList["CBC"];
    }

    if (ParamsList["AuthName"]) {
      this.AuthName = false;
    } else {
      this.AuthName = true;
    }

    if (ParamsList["FilterMode"]) {
      this.ChatFilterMode = true;
    } else {
      this.ChatFilterMode = false;
    }

    if (ParamsList["room"]) {
      if (ParamsList["room"] == "TEST") {
        this.RoomTest();
        return;
      }

      var test = ParamsList["pass"];
      if (test != null) {
        this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'Listen',
          Room: ParamsList["room"].toString(),
          Pass: SHA256(test).toString(enc.Hex).toLowerCase()
        })), ParamsList["room"].toString());
      } else {
        this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'Listen',
          Room: ParamsList["room"].toString()
        })), ParamsList["room"].toString());
      }
    } else if (ParamsList["lc"] && ParamsList["vid"]) {
      if (ParamsList["FilterMode"]) {
        this.Filter.author = [];
        if (ParamsList["keywords"]) {
          this.Filter.keyword = "";
          ParamsList["keywords"].forEach((e: string) => {
            if (this.Filter.keyword == "") {
              this.Filter.keyword = e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            } else {
              this.Filter.keyword += "|" + e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            }
          });
        }
        if (ParamsList["author"]) {
          this.Filter.author = ParamsList["author"];
        }
      }

      if (ParamsList["tp"] == false){
        this.AddChatSkimmer({
          channel : ParamsList["lc"] + "_" + ParamsList["vid"]
        });
      } else {
        this.AddChatSkimmer({
          link: ParamsList["lc"] + "_" + ParamsList["vid"]
        });
      }
    } else {
      for (let i: number = 0; i < 10; i++) {
        if (i % 2 != 0) {
          this.MEntryAdd({
            Author: "TEST",
            Stext: "TEST" + i.toString() + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx",
            Stime: 10000,
            CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            key: ""
          })
        } else {
          this.MEntryAdd({
            Author: "TEST",
            Stext: "TEST" + i.toString(),
            Stime: 10000,
            CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            key: ""
          })
        }
      }
    }
  }
  //============================================= PARAM PARSER =============================================



  //----------------------------------------------  TESTING MODULE  ----------------------------------------------
  RoomTest() {
    timer(999, 999).subscribe((t) => {
      var s = "";
      switch (t % 5) {
        case 0:
          s = "the quick brown fox jumps over the lazy dog";
          break;

        case 1:
          s = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
          break;

        case 2:
          s = "以呂波耳本部止 千利奴流乎和加 餘多連曽津祢那 良牟有為能於久 耶万計不己衣天 阿佐伎喩女美之 恵比毛勢須";
          break;

        case 3:
          s = "いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす";
          break;

        case 4:
          s = "イロハニホヘト　チリヌルヲ　ワカヨタレソ　ツネナラム　ウヰノオクヤマ　ケフコエテ　アサキユメミシ　ヱヒモセス";
          break;
      }

      this.MEntryAdd({
        Author: "TEST",
        Stime: 0,
        Stext: s,
        CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
        OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
        key: ""
      });
    });
  }
  //==============================================  TESTING MODULE  ==============================================



  //--------------------------------------------- MCHAD ROOM MODE ---------------------------------------------
  StartListening(Btoken: string, room: string): void {
    this.Status = Btoken;
    const RoomES = new EventSource('https://repo.mchatx.org/FetchRaw/?BToken=' + Btoken);

    this.Status = "1";

    RoomES.onmessage = e => {
      if (e.data == '{ "flag":"Connect", "content":"CONNECTED TO SECURE SERVER"}') {
      } else if (e.data != '{}') {
        var DecodedString = this.TGEnc.TGDecoding(e.data);
        if (DecodedString == '{ "flag":"Timeout", "content":"Translator side time out" }') {
          RoomES.close();
        } else {
          var dt = JSON.parse(DecodedString);
          var tempFE: FullEntry = {
            Author: room,
            Stext: dt["content"]["Stext"],
            key: dt["content"]["key"],
            Stime: 0,
            CC: "",
            OC: ""
          };

          if (dt["content"]["CC"]) {
            tempFE.CC = dt["content"]["CC"]
          } 

          if (dt["content"]["OC"]) {
            tempFE.OC = dt["content"]["OC"];
          } 

          if (dt["flag"] == "insert") {
            this.MEntryAdd(tempFE);
          } else if (dt["flag"] == "update") {
            this.MEntryReplace(tempFE);
          }
        }
      }
    }

    RoomES.onerror = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "CONNECTION ERROR",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
    }

    RoomES.onopen = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "CONNECTED",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
    }

    RoomES.addEventListener('open', function (e) {
    }, false);

    RoomES.addEventListener('message', function (e) {
    }, false);

    RoomES.addEventListener('error', function (e) {
    }, false);

  }
  //============================================= MCHAD ROOM MODE =============================================



  //-----------------------------------  SYNCING  -----------------------------------
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

  AddChatSkimmer(URLquery: any) {
    if (!URLquery.link){
      URLquery.link = URLquery.channel
    }

    switch (URLquery.link.slice(0, 3)) {
      case "TC_":
        this.ChatSkimmer.SendRequest(URLquery).subscribe({
          error: error => {
            this.MEntryAdd({
              Author: "SYS",
              Stime: 0,
              Stext: "ERROR CONNECTION",
              CC: "",
              OC: "",
              key: ""
            });
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
        if (URLquery.channel){
          delete URLquery.link;
        }

        this.StartSync(this.URLConstructor(URLquery), "YT");
        break;  

      default:
        this.StartSync(this.URLConstructor(URLquery), "SYS")  
        break;
    }
  }

  Synced:boolean = false;
  ES: EventSource | undefined = undefined;
  SyncToken:string = "";
  WS: WebSocket | undefined = undefined;
  TMIClient: tmi.Client | undefined = undefined;

  StartSync(ESLink: string, Type: string) {
    this.ES = new EventSource(ESLink);
    
    this.ES.onmessage = e => {
      if (e.data == "[]") return;
      
      var parseData = JSON.parse(e.data);
      if (!parseData.flag){
        for (var i = 0; i < parseData.length; i++){
          switch (Type) {
            case "YT":
              let s = "";
              parseData[i].content.forEach((dt:string) => {
                  if (dt.indexOf("https://") == -1){
                  s += dt + " ";
                  }
              });
              this.MEntryAdd({
                Author: parseData[i].author,
                Stime: 0,
                Stext: s,
                CC: "",
                OC: "",
                key: ""
              });
              break;
            
            case "TW":
              this.MEntryAdd({
                Author: parseData[i].author,
                Stime: 0,
                Stext: parseData[i].message,
                CC: "",
                OC: "",
                key: ""
              });
              break;
            
            case "TC":
              this.MEntryAdd({
                Author: parseData[i].author,
                Stime: 0,
                Stext: parseData[i].message,
                CC: "",
                OC: "",
                key: ""
              });
              break;
          }
        }
      }
    }

    this.ES.onerror = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "DISCONNECTED",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
      this.ES?.close();
    }

    this.ES.onopen = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "CONNECTED",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
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
            this.MEntryAdd({
              Author: dt.author.name,
              Stime: 0,
              Stext: dt.message,
              CC: "",
              OC: "",
              key: ""
            });
          }
        });
      }
    }

    this.WS.onerror = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "DISCONNECTED",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
      this.WS?.close();
    }

    this.WS.onopen = e => {
      this.MEntryAdd({
        Author: "SYS",
        Stime: 0,
        Stext: "CONNECTED",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
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
    this.MEntryAdd({
      Author: "SYS",
      Stime: 0,
      Stext: "CONNECTED",
      OC: "000000",
      CC: "FFFFFF",
      key: ""
    })

    this.TMIClient.on("message", (channel, tags, message, self) => {
      if (self) return;

      if (tags["display-name"]) {
        this.MEntryAdd({
          Author: tags["display-name"],
          Stime: 0,
          Stext: message,
          CC: "",
          OC: "",
          key: ""
        });
      }
    });
    //this.TMIClient.on("disconnected", reason => {});
    //this.TMIClient.on("join", (channel, username, self) => {});
    //this.client.on("logon", () => {});
  }
  //===================================  SYNCING  ===================================



  //--------------------------------------------- ENTRY DISPLAY ---------------------------------------------
  MEntryReplace(dt: FullEntry): void {
    for (let i: number = 0; i < this.EntryList.length; i++) {
      if (this.EntryList[i].key == dt.key) {
        const Stext = dt.Stext;
        const CC = dt.CC;
        const OC = dt.OC;
        if (Stext != undefined) {
          this.DisplayElem[i].textContent = Stext;
        }

        var CCctx = "#";
        if (CC != undefined) {
          CCctx += CC;
        } else {
          CCctx += "000000"
        }
        var OCctx = "#";
        if (OC != undefined) {
          OCctx += OC;
        } else {
          OCctx += "000000"
        }

        if (this.OverrideCStyle){
          CCctx = this.OverrideCC;
          OCctx = this.OverrideOC;
        }

        this.DisplayElem[i].style.webkitTextFillColor = CCctx;
        this.DisplayElem[i].style.webkitTextStrokeColor = OCctx;

        this.EntryList[i] = dt;
        break;
      }
    }
  }

  MEntryAdd(dt: FullEntry): void {
    if (dt.Stext == ""){
      return;
    }

    if (this.ChatFilterMode){
      if (dt.Author && (this.Filter.author.length != 0)){
        if (this.Filter.author.indexOf(dt.Author) == -1) {
          return;
        }
      }

      if (dt.Stext && (this.Filter.keyword != "")){
        if (dt.Stext.match(new RegExp(this.Filter.keyword, 'i')) == null) {
          return;
        }
      }
    }

    this.TempEntryContainer.push(dt);
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
  
      if (this.DisplayElem.length == this.MaxDisplay) {
        this.DisplayElem.shift()?.remove();
        this.EntryList.shift();
      }
  
      const cvs: HTMLHeadingElement = this.Renderer.createElement('h1');
      cvs.style.marginTop = "5px";
      cvs.id = "BoxShape";
  
      if (this.Ani != "") {
        cvs.className = "animate__animated animate__" + this.Ani;
      }
      cvs.style.webkitTextStrokeWidth = this.OT.toString() + "px";
  
      var Stext = EntryTemp.Stext;
  
      if (this.AuthName && EntryTemp.Author != "SYS") {
        Stext = EntryTemp.Author + " : " + Stext;
      }
  
      const CC = EntryTemp.CC;
      const OC = EntryTemp.OC;
      if (Stext != undefined) {
        cvs.textContent = Stext;
      }
  
      var CCctx = "#";
      if (CC != undefined) {
        CCctx += CC;
      } else {
        CCctx += "000000"
      }
      var OCctx = "#";
      if (OC != undefined) {
        OCctx += OC;
      } else {
        OCctx += "000000"
      }
  
      if (this.OverrideCStyle){
        CCctx = "#" + this.OverrideCC;
        OCctx = "#" + this.OverrideOC;
      }
  
      cvs.style.webkitTextFillColor = CCctx;
      cvs.style.webkitTextStrokeColor = OCctx;
      cvs.style.backgroundColor = "rgba(" + this.CardBGColour.r.toString() + ", " + this.CardBGColour.g.toString() + ", " + this.CardBGColour.b.toString() + ", " + this.CardBGColour.a.toString() + ")";
      cvs.style.fontFamily = this.FStyle;
      cvs.style.fontSize = this.FFsize + "px";
      cvs.style.textAlign = this.TxAlign;
      this.Renderer.appendChild(this.cardcontainer.nativeElement, cvs);
  
      this.EntryList.push(EntryTemp);
      this.DisplayElem.push(cvs);
  
      this.cardcontainer.nativeElement.scroll({
        top: this.cardcontainer.nativeElement.scrollHeight,
        left: 0
      });
      
      if (this.TempEntryContainer.length > 50){
        setTimeout(() => {
          this.StartLoader();
        }, 100);
      } else {
        setTimeout(() => {
          this.StartLoader();
        }, 200);
      }
    } else {
      this.EntryLoader = false;
    }
  }
  //============================================= ENTRY DISPLAY =============================================
}
