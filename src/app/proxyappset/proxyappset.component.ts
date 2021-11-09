import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { WPproxyService } from '../services/wpproxy.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { Subscription, timer } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { faPlus, faUser, faCommentDots, faHome, faArrowRight, faArrowLeft, faFileExport, faFileImport, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';
import { faYoutube, faTwitch } from '@fortawesome/free-brands-svg-icons';

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
  AuthorList: string[] = [];
  AuthorInput: string = "";
  KeywordList: string[] = [];
  KeywordInput: string = "";

  BtnText: string[] = [
    "コピー", //Copy button URL
    "コピー"  //Copy button CSS
  ]

  /*  
    SECOND PAGE SETTING
    Styling and what's not
  */
  AuthName: boolean = true;

  TimeStamp: boolean = false;
  TimeStampColour: string = "#000000";

  MaxDisplay: number = 3; //Maximum message card display
  OT: number = 1;          //Outline Thickness in pixel
  CardBGColour = {
    r: 0,
    g: 0,
    b: 0,
    a: 0
  }
  BGcolour: string = "#000000";
  FFamily: string = "sans-serif";
  FFsize: number = 24;
  FFWeight: string = "bold";
  TxAlign: string = "center";
  WebFont: string = "";
  WebFontTemp: string = "";
  AniDir: string = "Up";
  AniType: string = "None";

  LetterSpacing: number = 0;
  LineSpacing: number = 5;

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
      this.BGSwitchButton.nativeElement.innerHTML = "ブラック";
    } else {
      this.previewcontainer.nativeElement.style["background-color"] = "black";
      this.BGSwitchButton.nativeElement.innerHTML = "ホワイト";
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
      elem.style.marginTop = this.LineSpacing.toString() + "px";
      if (this.LetterSpacing == 0){
        elem.style.letterSpacing = "normal";
      } else {
        elem.style.letterSpacing = this.LetterSpacing.toString() + "px";
      }
      elem.style.webkitTextStrokeWidth = this.OT.toString() + "px";
      elem.style.fontFamily = this.FFamily;
      elem.style.fontSize = this.FFsize.toString() + "px";
      elem.style.textAlign = this.TxAlign;
      elem.style.fontWeight = this.FFWeight;
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
    cvs.style.marginTop = this.LineSpacing.toString() + "px";
    if (this.LetterSpacing == 0){
      cvs.style.letterSpacing = "normal";
    } else {
      cvs.style.letterSpacing = this.LetterSpacing.toString() + "px";
    }
    cvs.style.paddingLeft = "20px"
    cvs.style.paddingRight = "20px"
    cvs.style.webkitTextStrokeWidth = this.OT.toString() + "px";
    cvs.style.fontFamily = this.FFamily;
    cvs.style.fontSize = this.FFsize.toString() + "px";
    cvs.style.textAlign = this.TxAlign;
    cvs.style.fontWeight = this.FFWeight;
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

    if (this.TimeStamp) {
      const spn: HTMLSpanElement = this.Renderer.createElement('spn');
      spn.style.webkitTextFillColor = this.TimeStampColour;
      spn.style.webkitTextStrokeColor = "#000000"
      spn.textContent = (new Date().toTimeString().split(" ")[0]) + " ";
      this.Renderer.appendChild(cvs, spn);
    }

    if (Stext != undefined) {
      cvs.innerHTML = cvs.innerHTML + Stext;
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
  //============================== SECOND PAGE HANDLER ==============================

  //------------------------------ SETTING FILE HANDLER ------------------------------
  filename: string = "...";
  TargetFile: File | null = null;

  rgbToHex(r:number, g:number, b:number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  SaveToFile() {
    var WriteStream:any = {};
    
    WriteStream["ProxyMode"] = this.ProxyMode;

    if (Number(this.ProxyMode) == 0) {
      if (this.RoomNick != "") {
        WriteStream["RoomNick"] = this.RoomNick;
      }
      if (this.RoomPass != "") {
        WriteStream["RoomPass"] = this.RoomPass;
      }
    } else {
      WriteStream["ChatURL"] = this.ChatURL;
      WriteStream["AuthorList"] = this.AuthorList;
      WriteStream["KeywordList"] = this.KeywordList;
    }

    WriteStream["AuthName"] = this.AuthName;
    WriteStream["TimeStamp"] = this.TimeStamp;
    WriteStream["TimeStampColour"] = this.TimeStampColour;
    WriteStream["MaxDisplay"] = this.MaxDisplay;
    WriteStream["OT"] = this.OT;
    WriteStream["AniType"] = this.AniType;
    WriteStream["AniDir"] = this.AniDir;
    WriteStream["FFsize"] = this.FFsize;
    WriteStream["FFamily"] = this.FFamily;
    WriteStream["FFWeight"] = this.FFWeight;
    WriteStream["TxAlign"] = this.TxAlign;
    WriteStream["OverrideCStyle"] = this.OverrideCStyle;
    WriteStream["LineSpacing"] = this.LineSpacing;
    WriteStream["LetterSpacing"] = this.LetterSpacing;
    if (this.OverrideCStyle) {
      WriteStream["OverrideCC"] = this.OverrideCC;
      WriteStream["OverrideOC"] = this.OverrideOC;
    }
    WriteStream["CardBGColour"] = this.CardBGColour;

    const blob = new Blob([JSON.stringify(WriteStream)], { type: 'text/plain' });
    saveAs(blob, "MChad字幕レイヤー設定.txt");
  }

  FileChange(e: Event) {
    let ef = (e.target as HTMLInputElement);
    if (ef.files != null) {
      this.filename = ef.files[0].name;
      this.TargetFile = ef.files[0];
    }
    this.ParseFile();
  }

  ParseFile(): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      if ((reader.result != null) && (this.TargetFile != null)) {
        var JSONSetting: any;
        try {
          JSONSetting = JSON.parse(reader.result.toString());  
        } catch (error) {
          return;
        }

        if (JSONSetting["ProxyMode"] != undefined) {
          this.ProxyMode = JSONSetting["ProxyMode"];
        }

        if (Number(this.ProxyMode) == 0) {
          if (JSONSetting["RoomNick"] != undefined) {
            this.RoomNick = JSONSetting["RoomNick"];
          }
          if (JSONSetting["RoomPass"] != undefined) {
            this.RoomPass = JSONSetting["RoomPass"];
          }
        } else {
          if (JSONSetting["ChatURL"] != undefined) {
            this.ChatURL = JSONSetting["ChatURL"];
          }
          if (JSONSetting["AuthorList"] != undefined) {
            this.AuthorList = JSONSetting["AuthorList"];
          }
          if (JSONSetting["KeywordList"] != undefined) {
            this.KeywordList = JSONSetting["KeywordList"];
          }
        }

        if (JSONSetting["TimeStamp"] != undefined) {
          this.TimeStamp = JSONSetting["TimeStamp"];
        }

        if (JSONSetting["AuthName"] != undefined) {
          this.AuthName = JSONSetting["AuthName"];
        }

        if (JSONSetting["MaxDisplay"] != undefined) {
          this.MaxDisplay = JSONSetting["MaxDisplay"];
        }

        if (JSONSetting["OT"] != undefined) {
          this.OT = JSONSetting["OT"];
        }

        if (JSONSetting["AniType"] != undefined) {
          this.AniType = JSONSetting["AniType"];
        }

        if (JSONSetting["AniDir"] != undefined) {
          this.AniDir = JSONSetting["AniDir"];
        }

        if (JSONSetting["FFsize"] != undefined) {
          this.FFsize = JSONSetting["FFsize"];
        }

        if (JSONSetting["FFamily"] != undefined) {
          this.FFamily = JSONSetting["FFamily"];
        }

        if (JSONSetting["FFWeight"] != undefined) {
          this.FFWeight = JSONSetting["FFWeight"];
        }

        if (JSONSetting["TxAlign"] != undefined) {
          this.TxAlign = JSONSetting["TxAlign"];
        }

        if (JSONSetting["OverrideCStyle"] != undefined) {
          this.OverrideCStyle = JSONSetting["OverrideCStyle"];
        }

        if (JSONSetting["TimeStampColour"] != undefined) {
          this.TimeStampColour = JSONSetting["TimeStampColour"];
        }

        if (JSONSetting["LineSpacing"] != undefined) {
          this.LineSpacing = JSONSetting["LineSpacing"];
        }

        if (JSONSetting["LetterSpacing"] != undefined) {
          this.LetterSpacing = JSONSetting["LetterSpacing"];
        }
        
        if (this.OverrideCStyle) {
          if (JSONSetting["OverrideCC"] != undefined) {
            this.OverrideCC = JSONSetting["OverrideCC"];
          }
          if (JSONSetting["OverrideOC"] != undefined) {
            this.OverrideOC = JSONSetting["OverrideOC"];
          }
        }

        if (JSONSetting["CardBGColour"] != undefined) {
          this.CardBGColour = JSONSetting["CardBGColour"];
          this.BGcolour = this.rgbToHex(this.CardBGColour.r, this.CardBGColour.g, this.CardBGColour.b);
        }
      }
    }

    if (this.TargetFile != null) {
      reader.readAsText(this.TargetFile);
    }
  }
  //============================== SETTING FILE HANDLER ==============================

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
    } else if (this.CurrentPage == 2) {
      var TempString = "";

      //-------------------- LINK GENERATOR --------------------
      this.ProxyLink = TempString;

      TempString = "https://app.mchatx.org/streamtool/app/";
      //TempString = "http://localhost:4200/streamtool/app/";

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
          } else if (TempS.indexOf("https://www.twitch.tv/") != -1) {
            TempS = TempS.replace("https://www.twitch.tv/", "");
            if (TempS.indexOf("?") != -1) {
              TempS = TempS.substring(0, TempS.indexOf("?"));
            }
            Linktoken["lc"] = "TW";
            Linktoken["vid"] = TempS;
          } else if (TempS.match(/http(.*)twitcasting.tv\//g)?.length != 0) {
            TempS = TempS.replace(/http(.*)twitcasting.tv\//g, "");
            if (TempS.indexOf("?") != -1){
              TempS = TempS.slice(0, TempS.indexOf("?"));
            }
            if (TempS.indexOf("/") != -1){
              TempS = TempS.slice(0, TempS.indexOf("/"));
            }
            Linktoken["lc"] = "TC";
            Linktoken["vid"] = TempS;
          }

          if (this.ChatMode == "Filter") {
            Linktoken["FilterMode"] = 1;
          }

          if (this.AuthorList.length != 0) {
            Linktoken["author"] = this.AuthorList;
          }

          if (this.KeywordList.length != 0) {
            Linktoken["keywords"] = this.KeywordList;
          }

          break;
      }

      if (!this.AuthName) {
        Linktoken["AuthName"] = 1;
      }

      if (this.TimeStamp) {
        Linktoken["TS"] = 1;
        Linktoken["TSC"] = this.TimeStampColour.substr(1);
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
      Linktoken["FSW"] = this.FFWeight;
      Linktoken["TAL"] = this.TxAlign;
      Linktoken["LNS"] = this.LineSpacing;
      Linktoken["LTS"] = this.LetterSpacing;

      if (this.OverrideCStyle){
        Linktoken["OCS"] = 1;
        Linktoken["CCC"] = this.OverrideCC.substr(1);
        Linktoken["COC"] = this.OverrideOC.substr(1);
      }

      Linktoken["CBC"] = this.CardBGColour;

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
      this.BtnText[0] = "コピーしたよん"
      setTimeout(() => {
        this.BtnText[0] = "コピー";
      }, 3000);
    } else {
      navigator.clipboard.writeText(this.ProxyCss).then().catch(e => console.error(e));
      this.BtnText[1] = "コピーしたよん"
      setTimeout(() => {
        this.BtnText[1] = "コピー";
      }, 3000);
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
  faUser = faUser;
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faHome = faHome;
  faComment = faCommentDots;
  faFileImport = faFileImport;
  faFileExport = faFileExport;
  faYoutube = faYoutube;
  faTwitch = faTwitch;
  faPlusCircle = faPlusCircle;
}
