import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { WPproxyService } from '../services/wpproxy.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { Subscription, timer } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

class RoomData {
  Nick: string | undefined;
  EntryPass: boolean = false;
  Empty: boolean = false;
  StreamLink: string | undefined;
  Tags: string | undefined;
}

class FullEntry {
  Stext: string | undefined;
  Stime: number = 0;
  CC: string | undefined;
  OC: string | undefined;
  key: string | undefined;
}

@Component({
  selector: 'app-proxyappset',
  templateUrl: './proxyappset.component.html',
  styleUrls: ['./proxyappset.component.scss']
})
export class ProxyappsetComponent implements OnInit {
  @ViewChild("cardcontainer") cardcontainer !: ElementRef;
  @ViewChild("BGSwitchButton") BGSwitchButton !: ElementRef;
  @ViewChild("previewcontainer") previewcontainer !: ElementRef;
  @ViewChild('ChatContainer', { static: false }) ChatContainer !: ElementRef;

  CurrentPage: number = 0;
  Timer: Subscription | undefined;

  EntryList: any[] = [];
  DisplayElem: HTMLHeadElement[] = [];

  /*  
    FIRST PAGE SETTING
    ProxyMode 0 MChad Room
              1 Chat Filter
              2 LiveTL's Kanatran?
  */
  ProxyMode: number = 1;
  RoomNick: string = "";
  RoomPass: string = "";
  RoomList: RoomData[] = [];
  PasswordProtected: boolean = false;

  ChatURL: string = "";
  ChatMode: string = "Filter";
  AuthFilter: boolean = false;
  AuthorList: string[] = [];
  AuthorInput: string = "";
  KeywordFilter: boolean = false;
  KeywordList: string[] = [];
  KeywordInput: string = "";

  /*  
    SECOND PAGE SETTING
    Styling and what's not
  */
  AuthName: boolean = true;

  MaxDisplay: number = 1; //Maximum message card display
  OT: number = 1;          //Outline Thickness in pixel
  CardBGColour = {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  }
  BGcolour: string = "#000000";
  FFamily: string = "sans-serif";
  FFsize: number = 50;
  TxAlign: string = "center";
  WebFont: string = "";
  WebFontTemp: string = "";
  AniDir: string = "Up";
  AniType: string = "None";

  OverrideCStyle: boolean = false;
  OverrideCC: string = "#000000"
  OverrideOC: string = "#000000"

  /*  
    THIRD PAGE
    Link and CSS generator
  */
  ProxyLink: string = "";
  ProxyCss: string = "";

  constructor(
    private WPService: WPproxyService,
    private TGService: TsugeGushiService,
    private Renderer: Renderer2,
    private Sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.getRoom();
  }

  //------------------------------ FIRST PAGE HANDLER ------------------------------
  getRoom(): void {
    this.WPService.getRoom().subscribe(
      (response: RoomData[]) => {
        this.RoomList = response;
      }
    )
  }

  CheckPass() {
    const RoomCheck: RoomData[] = this.RoomList.filter(Room => Room.Nick == this.RoomNick)
    if (RoomCheck.length != 0) {
      this.PasswordProtected = RoomCheck[0].EntryPass;
      this.RoomPass = "";
    } else {
      this.PasswordProtected = false;
    }
  }

  DeleteAuthList(idx: number) {
    this.AuthorList.splice(idx, 1);
  }

  AddAuthor() {
    if (this.AuthorInput != "") {
      this.AuthorList.push(this.AuthorInput);
      this.AuthorInput = "";
    }
  }

  DeleteKeywordList(idx: number) {
    this.KeywordList.splice(idx, 1);
  }

  AddKeyword() {
    if (this.KeywordInput != "") {
      this.KeywordList.push(this.KeywordInput);
      this.KeywordInput = "";
    }
  }

  CheckedChange(idx: number, e: any) {
    if (idx == 0) {
      this.AuthFilter = e.target.checked;
    } else {
      this.KeywordFilter = e.target.checked;
    }
  }
  //============================== FIRST PAGE HANDLER ==============================

  //------------------------------ SECOND PAGE HANDLER ------------------------------
  ReRenderExample(): void {
    var ColourParse = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(this.BGcolour);
    if (ColourParse != null) {
      this.CardBGColour.r = parseInt(ColourParse[1], 16);
      this.CardBGColour.g = parseInt(ColourParse[2], 16);
      this.CardBGColour.b = parseInt(ColourParse[3], 16);
    }
    this.RepaintEntries();
  }

  FetchWebFont() {
    if (this.WebFont == "") {
      return this.Sanitizer.bypassSecurityTrustResourceUrl("");
    } else {
      return this.Sanitizer.bypassSecurityTrustResourceUrl("https://fonts.googleapis.com/css?family=" + this.WebFont[0].replace(" ", "+"));
    }
  }

  LoadWebFont() {
    this.WebFont = this.WebFontTemp;
    this.FFamily = this.WebFont;
    this.RepaintEntries();
  }

  FFSelectChange() {
    if ((this.FFamily == "sans-serif") || (this.FFamily == "cursive") || (this.FFamily == "monospace")) {
      this.WebFontTemp = "";
      this.RepaintEntries();
    } else {
      this.WebFont = this.FFamily;
      this.RepaintEntries();
    }
  }

  Backgroundchange(): void {
    if (this.previewcontainer.nativeElement.style["background-color"] == "black") {
      this.previewcontainer.nativeElement.style["background-color"] = "white";
      this.BGSwitchButton.nativeElement.innerHTML = "black";
    } else {
      this.previewcontainer.nativeElement.style["background-color"] = "black";
      this.BGSwitchButton.nativeElement.innerHTML = "white";
    }
  }

  AddEntry(): void {
    var s : string = "";
    switch (Date.now() % 5) {
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

    if (this.AuthName){
      s = "xxx-さん : " + s;
    }

    this.EntryPrint({
      Stime: 0,
      Stext: s,
      CC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
      OC: Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16) + Math.floor(Math.random() * 256).toString(16),
      key: ""
    });
  }

  RepaintEntries(): void {
    this.DisplayElem.forEach((elem) => {
      elem.style.webkitTextStrokeWidth = this.OT.toString() + "px";
      elem.style.fontFamily = this.FFamily;
      elem.style.fontSize = this.FFsize.toString() + "px";
      elem.style.textAlign = this.TxAlign;
      elem.style.backgroundColor = "rgba(" + this.CardBGColour.r.toString() + ", " + this.CardBGColour.g.toString() + ", " + this.CardBGColour.b.toString() + ", " + this.CardBGColour.a.toString() + ")";
    })
  }

  ResetNumberEntries(): void {
    while (this.DisplayElem.length > this.MaxDisplay) {
      this.DisplayElem.shift()?.remove();
      this.EntryList.shift();
    }
  }

  EntryPrint(dt: FullEntry): void {
    while (this.DisplayElem.length >= this.MaxDisplay) {
      this.DisplayElem.shift()?.remove();
      this.EntryList.shift();
    }

    const cvs: HTMLHeadElement = this.Renderer.createElement('h1');
    cvs.style.marginTop = "5px";
    cvs.style.paddingLeft = "20px"
    cvs.style.paddingRight = "20px"
    cvs.style.webkitTextStrokeWidth = this.OT.toString() + "px";
    cvs.style.fontFamily = this.FFamily;
    cvs.style.fontSize = this.FFsize.toString() + "px";
    cvs.style.textAlign = this.TxAlign;
    cvs.style.backgroundColor = "rgba(" + this.CardBGColour.r.toString() + ", " + this.CardBGColour.g.toString() + ", " + this.CardBGColour.b.toString() + ", " + this.CardBGColour.a.toString() + ")";
    cvs.id = "BoxShape";

    if (this.AniType != "None") {
      cvs.className += " animate__animated animate__" + this.AniType + this.AniDir;
    }

    const Stext = dt.Stext;
    var CC = dt.CC;
    var OC = dt.OC;
    
    if (this.OverrideCStyle){
      CC = this.OverrideCC.substr(1);
      OC = this.OverrideOC.substr(1);
    }

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
    if (CC != undefined) {
      OCctx += OC;
    } else {
      OCctx += "000000"
    }

    cvs.style.webkitTextFillColor = CCctx;
    cvs.style.webkitTextStrokeColor = OCctx;
    this.Renderer.appendChild(this.cardcontainer.nativeElement, cvs);

    this.EntryList.push(dt);
    this.DisplayElem.push(cvs);
  }

  CheckedChange2() {
    this.AuthName = !this.AuthName;
  }
  //============================== SECOND PAGE HANDLER ==============================

  //------------------------------ MISC HANDLER ------------------------------
  NextButtonClick(): void {
    if (this.CurrentPage == 1) {
      this.Timer?.unsubscribe();
      this.EntryList = [];
      this.DisplayElem = [];
    }
    this.CurrentPage += 1;

    if (this.CurrentPage == 1) {
      this.initTestLoop();

      if (!this.PasswordProtected) {
        this.RoomPass = "";
      }
      if ((this.FFamily != "sans-serif") && (this.FFamily != "cursive") && (this.FFamily != "monospace")) {
        this.WebFontTemp = this.FFamily;
      }

      if (this.ProxyMode == 1) {
        this.TxAlign = 'left';
        this.FFsize = 16;
        this.MaxDisplay = 3;
        this.CardBGColour = {
          r: 0,
          g: 0,
          b: 0,
          a: 0
        }
      } else {
        this.TxAlign = "center"
      }
    } else if (this.CurrentPage == 2) {
      var TempString = "";

      //-------------------- LINK GENERATOR --------------------
      this.ProxyLink = TempString;

      TempString = "http://localhost:4200/streamtool/app/";

      var Linktoken: any = {};
      switch (Number(this.ProxyMode)) {
        case 0:
          if (this.RoomNick != "") {
            Linktoken["room"] = this.RoomNick;
          }
          if (this.RoomPass != "") {
            Linktoken["pass"] = this.RoomPass;
          }
          break;

        case 1:
          var TempS: string = this.ChatURL;
          if (TempS == "TEST") {
            Linktoken["lc"] = "YT";
            Linktoken["vid"] = "TEST";
          } else if (TempS.indexOf("https://www.youtube.com/channel/") != -1){
            TempS = TempS.replace("https://www.youtube.com/channel/", "");
            if (TempS.indexOf("/") != -1){
              TempS = TempS.substring(0, TempS.indexOf("/"));
            }
            Linktoken["lc"] = "YT";
            Linktoken["vid"] = TempS;            
            Linktoken["tp"] = false;
          } else if (TempS.indexOf("https://www.youtube.com/live_chat") != -1) {
            TempS = TempS.replace("https://www.youtube.com/live_chat", "");
            if (TempS.indexOf("v=") != -1) {
              TempS = TempS.substring(TempS.indexOf("v=") + 2);
              if (TempS.indexOf("&") != -1) {
                TempS = TempS.substring(0, TempS.indexOf("&"));
              }
              Linktoken["lc"] = "YT";
              Linktoken["vid"] = TempS;
              Linktoken["tp"] = true;
            }
          } else if (TempS.indexOf("https://www.youtube.com/watch") != -1) {
            TempS = TempS.replace("https://www.youtube.com/watch", "");
            if (TempS.indexOf("v=") != -1) {
              TempS = TempS.substring(TempS.indexOf("v=") + 2);
              if (TempS.indexOf("&") != -1) {
                TempS = TempS.substring(0, TempS.indexOf("&"));
              }
              Linktoken["lc"] = "YT";
              Linktoken["vid"] = TempS;
              Linktoken["tp"] = true;
            }
          } else if (TempS.indexOf("https://www.twitch.tv/popout/") != -1) {
            TempS = TempS.replace("https://www.twitch.tv/popout/", "");
            if (TempS.indexOf("/chat") != -1) {
              TempS = TempS.substring(0, TempS.indexOf("/chat"));
              Linktoken["lc"] = "TW";
              Linktoken["vid"] = TempS;
            }
          }

          if (this.ChatMode == "Filter") {
            Linktoken["FilterMode"] = 1;
          }

          if ((this.AuthFilter) && (this.AuthorList.length != 0)) {
            Linktoken["author"] = this.AuthorList;
          }

          if ((this.KeywordFilter) && (this.KeywordList.length != 0)) {
            Linktoken["keywords"] = this.KeywordList;
          }

          if (!this.AuthName) {
            Linktoken["AuthName"] = 1;
          }

          break;
      }

      Linktoken["max"] = this.MaxDisplay;

      if (this.OT != 1) {
        Linktoken["ot"] = this.OT;
      }

      if (this.AniType != "None") {
        Linktoken["ani"] = this.AniType + this.AniDir;
      }

      Linktoken["FSF"] = this.FFsize;
      Linktoken["FSS"] = this.FFamily;
      Linktoken["TAL"] = this.TxAlign;

      if (this.OverrideCStyle){
        Linktoken["OCS"] = 1;
        Linktoken["CCC"] = this.OverrideCC.substr(1);
        Linktoken["COC"] = this.OverrideOC.substr(1);
      }

      TempString += encodeURIComponent(this.TGService.TGEncoding(encodeURI(JSON.stringify(Linktoken))))
      this.ProxyLink = TempString;

      //-------------------- CSS GENERATOR --------------------
      TempString = "";
      this.ProxyCss = TempString;

      TempString += "html {\n\tbackground-color: rgba(0, 0, 0, 0);\n\tmargin: 0px auto;\n\toverflow: hidden;\n}\n";
      if ((this.ProxyMode == 0) || (this.ChatMode == 'Filter')) {
        TempString += "#BoxShape {\n\tbackground-color: rgba(" + this.CardBGColour.r.toString() + ", " + this.CardBGColour.g.toString() + ", " + this.CardBGColour.b.toString() + ", " + this.CardBGColour.a.toString() + ");\n";
        TempString += "}\n\n";
      }
      TempString += "#cardcontainer::-webkit-scrollbar {\n\tdisplay: none;\n}";
      this.ProxyCss = TempString;
    }
  }

  PrevButtonClick(): void {
    if (this.CurrentPage == 1) {
      this.Timer?.unsubscribe();
      this.EntryList = [];
      this.DisplayElem = [];
    }
    this.CurrentPage -= 1;

    if (this.CurrentPage == 1) {
      this.initTestLoop();

      if ((this.FFamily != "sans-serif") && (this.FFamily != "cursive") && (this.FFamily != "monospace")) {
        this.WebFontTemp = this.FFamily;
      }
    }
  }

  CopyBtnClick(CopyLink: boolean) {
    if (CopyLink) {
      navigator.clipboard.writeText(this.ProxyLink).then().catch(e => console.error(e));
    } else {
      navigator.clipboard.writeText(this.ProxyCss).then().catch(e => console.error(e));
    }
  }

  initTestMChad() {
    this.Timer = timer(1000, 1000).subscribe((t) => {
      this.AddEntry();
    });  
  }

  initTestLoop() {
    this.initTestMChad();
  }

  faPlus = faPlus;
}
