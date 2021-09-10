import { Component, OnInit, Renderer2, AfterViewInit, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { SHA256, enc } from 'crypto-js';
import { filter } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription, timer } from 'rxjs';

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


export class ProxyappComponent implements OnInit, AfterViewInit {
  @ViewChild('cardcontainer', { static: false }) cardcontainer !: ElementRef;
  @ViewChild('ChatContainer', { static: false }) ChatContainer !: ElementRef;
  @ViewChildren('item') itemElements!: QueryList<any>;
  scrollContainer: any;

  Status: string | undefined = "";
  EntryList: any[] = [];
  EntryContainer: any[] = [];
  DisplayElem: HTMLHeadingElement[] = [];
  FFsize: number = 40;
  FStyle: string = "Ubuntu";
  TxAlign: string = "center";
  MaxDisplay = 100;
  OT: number = 1;
  Ani: string = "";
  ChatProxyEle: HTMLIFrameElement | undefined;

  ChatProxy: boolean = false;
  scrollend: boolean = true;
  EntryLoader: boolean = false;
  ChatFilterMode: boolean = false;
  Filter = {
    author: [""],
    keyword: ""
  }
  AuthPP: boolean = true;
  AuthName: boolean = true;
  AuthBadge: boolean = true;
  AuthHead: boolean = true;
  AniDuration: number = 300;

  OverrideCStyle: boolean = false;
  OverrideCC: string = "#000000"
  OverrideOC: string = "#000000"
  OverrideCCAuthor: string = "#000000"
  OverrideOCAuthor: string = "#000000"

  constructor(
    private Renderer: Renderer2,
    private TGEnc: TsugeGushiService,
    private route: ActivatedRoute,
    private Sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.ParamParse(this.route.snapshot.paramMap.get('token'));
  }

  ngAfterViewInit(): void {
    this.scrollContainer = this.cardcontainer.nativeElement;
    this.itemElements.changes.subscribe(() => { this.onItemElementsChanged(); });

    if (this.ChatProxy) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length != 0) {
            setTimeout(() => {
              this.StartYTCprint();
            }, this.AniDuration);
          }
        });
      });

      observer.observe(this.ChatContainer.nativeElement, {
        childList: true,
      });
    }
  }

  onScrollView(): void {
    this.scrollend = this.isNearBottom();
  }

  onItemElementsChanged(): void {
    if (this.scrollend) {
      this.scrollContainer.scroll({
        top: this.scrollContainer.scrollHeight,
        left: 0
      });
    }
  }

  isNearBottom(): boolean {
    const threshold = 150;
    const position = this.scrollContainer.scrollTop + this.scrollContainer.offsetHeight;
    const height = this.scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustResourceUrl("https://fonts.googleapis.com/css2?family=" + this.FStyle.replace(/ /g, "+") + "&display=swap");
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
    if (ParamsList["TAL"]) {
      this.TxAlign = ParamsList["TAL"];
    }

    if (ParamsList["OCS"]) {
      this.OverrideCStyle = true;
    }

    if (ParamsList["CCC"]) {
      this.OverrideCC = "#" + ParamsList["CCC"];
    }

    if (ParamsList["COC"]) {
      this.OverrideOC = "#" + ParamsList["COC"];
    }

    if (ParamsList["ACC"]) {
      this.OverrideCCAuthor = "#" + ParamsList["ACC"];
    }

    if (ParamsList["AOC"]) {
      this.OverrideOCAuthor = "#" + ParamsList["AOC"];
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
        })));
      } else {
        this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'Listen',
          Room: ParamsList["room"].toString()
        })));
      }
    } else if (ParamsList["lc"] && ParamsList["vid"]) {
      this.ChatProxy = true;
      if (ParamsList["AuthPP"]) {
        this.AuthPP = false;
      }
      if (ParamsList["AuthName"]) {
        this.AuthName = false;
      }
      if (ParamsList["AuthBadge"]) {
        this.AuthBadge = false;
      }
      if (!this.AuthPP && !this.AuthName && !this.AuthBadge) {
        this.AuthHead = false;
      }

      if (ParamsList["FilterMode"]) {
        this.Filter.author = [];
        this.ChatFilterMode = true;
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

        if (ParamsList["vid"] == "TEST") {
          this.ChatProxyTest();
        } else {
          this.StartChatProxy(ParamsList["lc"], ParamsList["vid"], true, ParamsList["tp"]);
        }
      } else {
        if (ParamsList["vid"] == "TEST") {
          this.ChatProxyTest();
        } else {
          this.StartChatProxy(ParamsList["lc"], ParamsList["vid"], false, ParamsList["tp"]);
        }
      }
    } else {
      for (let i: number = 0; i < 10; i++) {
        if (i % 2 != 0) {
          this.MEntryAdd({
            Stext: "TEST" + i.toString() + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx",
            Stime: 10000,
            CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
            key: ""
          })
        } else {
          this.MEntryAdd({
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



  //--------------------------------------------- MCHAD ROOM MODE ---------------------------------------------
  StartListening(Btoken: string): void {
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
            Stext: dt["content"]["Stext"],
            key: dt["content"]["key"],
            Stime: 0,
            CC: "",
            OC: ""
          };

          if (!dt["content"]["CC"]) {
            tempFE.CC = "FFFFFF";
          } else {
            tempFE.CC = dt["content"]["CC"];
          }
          if (!dt["content"]["OC"]) {
            tempFE.OC = "000000";
          } else {
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
        Stime: 0,
        Stext: "CONNECTION ERROR",
        OC: "000000",
        CC: "FFFFFF",
        key: ""
      })
    }

    RoomES.onopen = e => {
      this.MEntryAdd({
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

    const Stext = dt.Stext;
    const CC = dt.CC;
    const OC = dt.OC;
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
      CCctx = this.OverrideCC;
      OCctx = this.OverrideOC;
    }

    cvs.style.webkitTextFillColor = CCctx;
    cvs.style.webkitTextStrokeColor = OCctx;
    cvs.style.fontFamily = this.FStyle;
    cvs.style.fontSize = this.FFsize + "px";
    cvs.style.textAlign = this.TxAlign;
    this.Renderer.appendChild(this.cardcontainer.nativeElement, cvs);

    this.EntryList.push(dt);
    this.DisplayElem.push(cvs);

    this.cardcontainer.nativeElement.scroll({
      top: this.cardcontainer.nativeElement.scrollHeight,
      left: 0
    });

  }
  //============================================= MCHAD ROOM MODE =============================================



  //--------------------------------------------- CHAT PROXY MODE ---------------------------------------------
  StartChatProxy(ChatType: string, ID: string, filter: boolean, Vid: boolean) {
    switch (ChatType) {
      case "YT":
        var RoomES;
        var QueryS = ID;
        if (Vid){
          QueryS = "VidID=" + QueryS;
        } else {
          QueryS = "ChannelID=" + QueryS;
        }

        if (filter) {
          RoomES = new EventSource('http://localhost:31023/PureProxy?' + QueryS);
        } else {
          RoomES = new EventSource('http://localhost:31023/AutoTL?' + QueryS);
        }

        this.Status = "1";

        RoomES.onmessage = e => {
          if (e.data == '{ "flag":"Connect", "content":"CONNECTED TO SERVER"}') {
          } else if (e.data.indexOf('{ \"flag\":\"DELETE\"') != -1) {
            var dt = JSON.parse(e.data);
            if (dt.Nick) {
              this.EntryContainer = this.EntryContainer.filter(e => e.author != dt.Nick);
              this.EntryList = this.EntryList.filter(e => e.author != dt.Nick);
            }
          } else if (e.data != '{}') {

            if (this.EntryContainer.length > 80) {
              this.AniDuration = 25;
            } else if (this.EntryContainer.length > 40) {
              this.AniDuration = 50;
            } else if (this.EntryContainer.length > 20) {
              this.AniDuration = 100;
            } else if (this.EntryContainer.length > 10) {
              this.AniDuration = 200;
            } else {
              this.AniDuration = 300;
            }

            if (this.ChatFilterMode) {
              if ((this.Filter.author.length != 0) && (this.Filter.keyword != "")) {
                JSON.parse(e.data).forEach((dt: any) => {
                  if (this.Filter.author.indexOf(dt.author) != -1) {
                    for (let i = 0; i < dt.content.length; i++) {
                      if (dt.content[i].indexOf('https://') != -1) {
                        return;
                      } else if (dt.content[i].match(new RegExp(this.Filter.keyword, 'i')) != null) {
                        this.EntryContainer.push(dt);
                        break;
                      }
                    }
                  }
                });
              } else if (this.Filter.author.length != 0) {
                JSON.parse(e.data).forEach((dt: any) => {
                  if (this.Filter.author.indexOf(dt.author) != -1) {
                    this.EntryContainer.push(dt);
                  }
                });
              } else if (this.Filter.keyword != "") {
                JSON.parse(e.data).forEach((dt: any) => {
                  for (let i = 0; i < dt.content.length; i++) {
                    if (dt.content[i].indexOf('https://') != -1) {
                      return;
                    } else if (dt.content[i].match(new RegExp(this.Filter.keyword, 'i')) != null) {
                      this.EntryContainer.push(dt);
                      break;
                    }
                  }
                });
              } else {
                JSON.parse(e.data).forEach((dt: any) => {
                  this.EntryContainer.push(dt);
                });
              }
            } else {
              JSON.parse(e.data).forEach((dt: any) => {
                this.EntryContainer.push(dt);
              });
            }
            if (!this.EntryLoader) {
              this.EntryLoader = true;
              this.StartYTCprint();
            }
          }
        }

        RoomES.onerror = e => {
        }

        RoomES.onopen = e => {
        }

        RoomES.addEventListener('open', function (e) {
        }, false);

        RoomES.addEventListener('message', function (e) {
        }, false);

        RoomES.addEventListener('error', function (e) {
        }, false);

        break;

      case "TW":
        this.ChatProxyEle = this.Renderer.createElement("iframe");
        if (this.ChatProxyEle) {
          this.ChatProxyEle.src = "https://www.twitch.tv/embed/" + ID + "/chat?parent=" + window.location.hostname;
          this.ChatProxyEle.style.height = "100%";
          this.ChatProxyEle.frameBorder = "0";
          this.Renderer.appendChild(this.cardcontainer.nativeElement.parentNode, this.ChatProxyEle);
          this.cardcontainer.nativeElement.remove();
        }
        break;
    }
  }

  StartYTCprint() {
    if (this.EntryContainer.length == 0) {
      this.EntryLoader = false;
      return;
    }

    if (this.EntryList.length == this.MaxDisplay) {
      this.EntryList.splice(0, 1);
    }

    let dt = this.EntryContainer.shift();

    this.EntryList.push(dt);
  }

  ClassSeparator(type: number | undefined): string {
    if (!type) {
      return "";
    } else {
      switch (type) {
        case 1:
          return "NormalMessage";

        case 2:
          return "ModMessage";

        default:
          return "OwnerMessage";
      }
    }
  }
  //============================================= CHAT PROXY MODE =============================================



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
        Stime: 0,
        Stext: s,
        CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
        OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
        key: ""
      });
    });
  }

  ChatProxyTest() {
    timer(999, 999).subscribe((t) => {
      //https://via.placeholder.com/150?text=Visit+WhoIsHostingThis.com+Buyers+Guide

      var s: any = {};
      s["authorPhoto"] = "https://via.placeholder.com/48?text=AUTHOR";

      switch (t % 10) {
        //  SC STICKER
        case 0:
          s["author"] = "test SC STICKER";
          s["type"] = "SCS";
          s["SC"] = "XXX $";
          s["content"] = ["https://via.placeholder.com/96?text=PAID+STICKER"]
          s["BC"] = "#" + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16);
          break;

        //  SC MESSAGE
        case 1:
          s["author"] = "test SC";
          if ((Date.now() % 2) == 0) {
            s["TL"] = "AUTO TRANSLATED TEXT";
          }

          switch (Date.now() % 5) {
            case 0:
              s["content"] = ["the quick brown fox jumps over the lazy dog"];
              break;

            case 1:
              s["content"] = ["THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"];
              break;

            case 2:
              s["content"] = ["以呂波耳本部止 千利奴流乎和加 餘多連曽津祢那 良牟有為能於久 耶万計不己衣天 阿佐伎喩女美之 恵比毛勢須"];
              break;

            case 3:
              s["content"] = ["いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす"];
              break;

            case 4:
              s["content"] = ["イロハニホヘト　チリヌルヲ　ワカヨタレソ　ツネナラム　ウヰノオクヤマ　ケフコエテ　アサキユメミシ　ヱヒモセス"];
              break;
          }
          s["type"] = "SC";
          s["SC"] = "XXX $$";
          s["BC"] = "#" + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16);
          break;

        //  MEMBER
        case 2:
          s["author"] = "test NEW MEMBER WELCOME";
          s["content"] = ["WELCOME TO XXXXXXXXXXX"];
          s["type"] = "MEMBER";
          break;

        //  MESSAGE OWNER
        case 3:
          s["author"] = "test OWNER MESSAGE";
          if ((Date.now() % 2) == 0) {
            s["TL"] = "AUTO TRANSLATED TEXT";
          }

          switch (Date.now() % 5) {
            case 0:
              s["content"] = ["the quick brown fox jumps over the lazy dog"];
              break;

            case 1:
              s["content"] = ["THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"];
              break;

            case 2:
              s["content"] = ["以呂波耳本部止 千利奴流乎和加 餘多連曽津祢那 良牟有為能於久 耶万計不己衣天 阿佐伎喩女美之 恵比毛勢須"];
              break;

            case 3:
              s["content"] = ["いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす"];
              break;

            case 4:
              s["content"] = ["イロハニホヘト　チリヌルヲ　ワカヨタレソ　ツネナラム　ウヰノオクヤマ　ケフコエテ　アサキユメミシ　ヱヒモセス"];
              break;
          }
          s["Mod"] = 3; //  OWNER
          break;

        //  MESSAGE MOD
        case 4:
          s["author"] = "test MOD MESSAGE";
          if ((Date.now() % 2) == 0) {
            s["TL"] = "AUTO TRANSLATED TEXT";
          }

          switch (Date.now() % 5) {
            case 0:
              s["content"] = ["the quick brown fox jumps over the lazy dog"];
              break;

            case 1:
              s["content"] = ["THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"];
              break;

            case 2:
              s["content"] = ["以呂波耳本部止 千利奴流乎和加 餘多連曽津祢那 良牟有為能於久 耶万計不己衣天 阿佐伎喩女美之 恵比毛勢須"];
              break;

            case 3:
              s["content"] = ["いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす"];
              break;

            case 4:
              s["content"] = ["イロハニホヘト　チリヌルヲ　ワカヨタレソ　ツネナラム　ウヰノオクヤマ　ケフコエテ　アサキユメミシ　ヱヒモセス"];
              break;
          }
          s["Mod"] = 2; //  MOD
          break;

        //  MESSAGE NORMAL
        default:
          if ((Date.now() % 2) == 0) {
            s["author"] = "test MEMBER";
            s["Mod"] = 1; //  MEMBER
            s["badgeContent"] = [{ Thumbnail: "https://via.placeholder.com/48?text=BADGE" }];
          } else {
            s["author"] = "test NON MEMBER";
          }

          if ((Date.now() % 2) == 0) {
            s["TL"] = "AUTO TRANSLATED TEXT";
          }

          switch (Date.now() % 5) {
            case 0:
              s["content"] = ["the quick brown fox jumps over the lazy dog"];
              break;

            case 1:
              s["content"] = ["THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"];
              break;

            case 2:
              s["content"] = ["以呂波耳本部止 千利奴流乎和加 餘多連曽津祢那 良牟有為能於久 耶万計不己衣天 阿佐伎喩女美之 恵比毛勢須"];
              break;

            case 3:
              s["content"] = ["いろはにほへと　ちりぬるを　わかよたれそ　つねならむ　うゐのおくやま　けふこえて　あさきゆめみし　ゑひもせす"];
              break;

            case 4:
              s["content"] = ["イロハニホヘト　チリヌルヲ　ワカヨタレソ　ツネナラム　ウヰノオクヤマ　ケフコエテ　アサキユメミシ　ヱヒモセス"];
              break;
          }
          break;
      }

      this.EntryContainer.push(s);
      this.StartYTCprint();
    });
  }

  //==============================================  TESTING MODULE  ==============================================

}
