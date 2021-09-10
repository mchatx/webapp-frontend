import { Component, OnInit, Renderer2, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { WPproxyService } from '../services/wpproxy.service';
import { SHA256, enc } from 'crypto-js';
import { faHome, faPause, faPlay, faStop, faLock } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../environments/environment';

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
  selector: 'app-webapp',
  templateUrl: './webapp.component.html',
  styleUrls: ['./webapp.component.scss']
})
export class WebappComponent implements OnInit, AfterViewInit {
  @ViewChild('cardcontainer') cardcontainer !: ElementRef; 
  OpenOption:Boolean = false;

  Status:string | undefined = "";
  EntryList: FullEntry[] = [];
  
  OT:number = 1;
  Ani: string = "";
  ChatProxy:HTMLIFrameElement | undefined;

  DisplayElem:HTMLCanvasElement[] = [];

  FFsize:number = 16;
  FStyle:string = "Ubuntu";
  TAlign:CanvasTextAlign = "left";
  MaxDisplay = 15;
  BGColour:string = "#28282B";

  RoomNick: string = "";

  ArchiveMode: boolean = false;
  Currtime:number = 0;
  CurrIdx:number = -1;
  BoolPlay:boolean = false;
  TimeShift:number = 0;
  IntervalID:any;
  MaxRange:number = 100;
  ArchiveEntryList: FullEntry[] = [];
  ARLink: string = "";

  passretry:number = 0;
  passmodal:boolean = false;
  PassString:string = "";

  constructor(
    private Renderer: Renderer2,
    private TGEnc: TsugeGushiService,
    private WPServ: WPproxyService,
    private route: ActivatedRoute
  ) { }

  onResize(event:any) {
    this.EntryRepaintEverything();
  }

  ngOnInit(): void {
    const SavedSetting = localStorage.getItem("MChatWebAppSet");
    if (SavedSetting != null){
      var ParsedSetting;
      try {
        ParsedSetting = JSON.parse(SavedSetting);
        if (ParsedSetting.FSFsize){
          this.FFsize = ParsedSetting.FSFsize;
        }
        if (ParsedSetting.FSStyle){
          this.FStyle = ParsedSetting.FSStyle;
        }
        if (ParsedSetting.STalign){
          this.TAlign = ParsedSetting.STalign;
        }
        if (ParsedSetting.BGSColour){
          this.BGColour = ParsedSetting.BGSColour;
        }
      } catch (error) {
        localStorage.removeItem("MChatWebAppSet");
      }
    }
  }

  ngAfterViewInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.ParamParse(params);
    });
  }

  SaveSetting(): void {
    this.OpenOption = false;
    localStorage.setItem("MChatWebAppSet", JSON.stringify({
      FSFsize: this.FFsize,
      FSStyle: this.FStyle,
      STalign: this.TAlign,
      BGSColour: this.BGColour
    }));
  }

  SwitchColour(): void {
    if (this.BGColour == "#28282B"){
      this.BGColour = "#F9F9F3";
    } else {
      this.BGColour = "#28282B";
    }
    this.EntryRepaintEverything();
  }

  //-----------------------------------  PARAM PARSER  -----------------------------------
  ParamParse(ParamsList: ParamMap){
    if (ParamsList.has("ot")){
      var test = ParamsList.get("ot")?.toString();
      if (Number(test) != NaN){
        this.OT = Number(test);
      }
    }

    if (ParamsList.has("ani")){
      var test = ParamsList.get("ani")?.toString();
      if (test != null){
        this.Ani = test;
      }
    }

    if (ParamsList.has("room")){
      //------------------------------------------ ROOM ------------------------------------------
      var test = ParamsList.get("room")?.toString()
      if (test != null){
        this.RoomNick = test;
      }

      test = ParamsList.get("pass")?.toString()
      if (test != null){
        this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'Listen',
          Room: ParamsList.get("room")?.toString(),
          Pass: SHA256(test).toString(enc.Hex).toLowerCase()
        })));
      } else {
        this.WPServ.TestRoom(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'TestPass',
          Type: 'PassRoom',
          ID: this.RoomNick
        }))).subscribe(
          (response) => {
            if (response.body == "OK"){
              this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
                Act: 'Listen',
                Room: ParamsList.get("room")?.toString()
              })));
            } else {
              this.passretry++;
              this.passmodal = true;
            }
          }
        )
      }
    } else if (ParamsList.has("archive")){
      //------------------------------------------ ARCHIVE ------------------------------------------
      var test = ParamsList.get("archive")?.toString()
      if (test != null){
        this.ARLink = test;
      }

      test = ParamsList.get("pass")?.toString()
      if (test != null){
        this.WPServ.getArchive(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'GetArchive',
          ARLink: ParamsList.get("archive")?.toString(),
          Pass: test
        }))).subscribe(
          (response) => {
            this.ArchiveParse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"]));
          },
          (err) => {
            if ((err.error == "ERROR : ARCHIVE IS PASSWORD PROTECTED, PLEASE SUBMIT PASSWORD IN THE PAYLOAD") || (err.error == "ERROR : PASSWORD DOES NOT MATCH")){
              if (this.passretry < 4){
                this.passretry++;
                this.passmodal = true;
              } else {
                this.EntryPrint({ 
                  Stext: "UNABLE TO RETRIEVE DATA",
                  Stime: 0,
                  CC: undefined,
                  OC: undefined,
                  key: ""
                })
              }              
            }
          }
        )
      } else {
        this.WPServ.getArchive(this.TGEnc.TGEncoding(JSON.stringify({
          Act: 'GetArchive',
          ARLink: ParamsList.get("archive")?.toString()
        }))).subscribe(
          (response) => {
            this.ArchiveParse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"]));
          },
          (err) => {
            if ((err.error == "ERROR : ARCHIVE IS PASSWORD PROTECTED, PLEASE SUBMIT PASSWORD IN THE PAYLOAD") || (err.error == "ERROR : PASSWORD DOES NOT MATCH")){
              if (this.passretry < 4){
                this.passretry++;
                this.passmodal = true;
              } else {
                this.EntryPrint({ 
                  Stext: "UNABLE TO RETRIEVE DATA",
                  Stime: 0,
                  CC: undefined,
                  OC: undefined,
                  key: ""
                })
              }              
            }
          }
        )
      }
    } else {
      for (let i:number = 0; i < 10; i++){
        if (i % 2 != 0){
          this.EntryPrint({ 
            Stext: "TEST" + i.toString() + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx" + " asdfkjzx",
            Stime: 10000,
            CC: Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16),
            OC: Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16),
            key: ""
          })
        } else {
          this.EntryPrint({ 
            Stext: "TEST" + i.toString(),
            Stime: 10000,
            CC: Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16),
            OC: Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16) + Math.floor(Math.random()*256).toString(16),
            key: ""
          })
        }
      }
    }
  }

  ArchiveParse(response:string):void {
    this.ArchiveMode = true;
    var starttime = -1;
    this.ArchiveEntryList = JSON.parse(response).map((e: FullEntry) => {
      if (!e.key) e.key = "";
      e.Stime = e.Stime/1000;
      if (starttime == -1){
        starttime = e.Stime;
      } 
      e.Stime -= starttime;
      return e;
    });
    this.MaxRange = this.ArchiveEntryList[this.ArchiveEntryList.length - 1].Stime;
    this.EntryPrint({
      Stext: "ARCHIVE LOADED",
      Stime: 0,
      key: undefined,
      CC: undefined,
      OC: undefined
    })
  }

  TryFetch():void {
    this.passmodal = false;
    if (this.RoomNick != ""){
      this.WPServ.TestRoom(this.TGEnc.TGEncoding(JSON.stringify({
        Act: 'TestPass',
        Type: 'Room',
        ID: this.RoomNick,
        Pass: SHA256(this.PassString).toString(enc.Hex).toLowerCase()
      }))).subscribe(
        (response) => {
          if (response.body == "OK"){
            this.StartListening(this.TGEnc.TGEncoding(JSON.stringify({
              Act: 'Listen',
              Room: this.RoomNick,
              Pass: SHA256(this.PassString).toString(enc.Hex).toLowerCase()
            })));
          } else {
            if (this.passretry < 4){
              this.passretry++;
              this.passmodal = true;
              this.PassString = "";
            } else {
              this.EntryPrint({ 
                Stext: "UNABLE TO RETRIEVE DATA",
                Stime: 0,
                CC: undefined,
                OC: undefined,
                key: ""
              })
            }
          }
        }
      )
    } else {
      this.WPServ.getArchive(this.TGEnc.TGEncoding(JSON.stringify({
        Act: 'GetArchive',
        ARLink: this.ARLink,
        Pass: this.PassString
      }))).subscribe(
        (response) => {
          this.ArchiveParse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"]));
        },
        (err) => {
          if ((err.error == "ERROR : ARCHIVE IS PASSWORD PROTECTED, PLEASE SUBMIT PASSWORD IN THE PAYLOAD") || (err.error == "ERROR : PASSWORD DOES NOT MATCH")){
            if (this.passretry < 4){
              this.passretry++;
              this.passmodal = true;
              this.PassString = "";
            } else {
              this.EntryPrint({ 
                Stext: "UNABLE TO RETRIEVE DATA",
                Stime: 0,
                CC: undefined,
                OC: undefined,
                key: ""
              })
            }              
          }
        }
      )
    }
  }
  //===================================  PARAM PARSER  ===================================



  //-----------------------------------  LIVE LISTENER  -----------------------------------
  StartListening(Btoken: string): void {
    this.Status = Btoken;

    const RoomES = new EventSource(environment.DBConn + '/FetchRaw/?BToken=' + Btoken);

    this.Status = "1";

    RoomES.onmessage = e => {
      if (e.data == '{ "flag":"Connect", "content":"CONNECTED TO SECURE SERVER"}'){
      } else if (e.data != '{}'){
        var DecodedString = this.TGEnc.TGDecoding(e.data);
        if (DecodedString == '{ "flag":"Timeout", "content":"Translator side time out" }'){
          RoomES.close();
        } else {
          var dt = JSON.parse(DecodedString);

          if (dt["flag"] == "insert"){
            this.EntryPrint({
              Stext: dt["content"]["Stext"],
              key: dt["content"]["key"],
              Stime: 0,
              CC: dt["content"]["CC"],
              OC: dt["content"]["OC"]              
            });
          } else if (dt["flag"] == "update"){
            this.EntryRepaint({
              Stext: dt["content"]["Stext"],
              key: dt["content"]["key"],
              Stime: 0,
              CC: dt["content"]["CC"],
              OC: dt["content"]["OC"]              
            });
          }
        }
      }
    }

    RoomES.onerror = e => {
      RoomES.close();
      this.EntryPrint({
        Stime: 0,
        Stext: "CONNECTION ERROR",
        OC: undefined,
        CC: undefined,
        key: ""
      })
    }

    RoomES.onopen = e => {
      this.EntryPrint({
        Stime: 0,
        Stext: "CONNECTED",
        OC: undefined,
        CC: undefined,
        key: ""
      })
    }
    
  
    RoomES.addEventListener('open', function(e) {
    }, false);

    RoomES.addEventListener('message', function (e) {
    }, false);

    RoomES.addEventListener('error', function(e) {
    }, false);
  }
  //===================================  LIVE LISTENER  ===================================



  //-----------------------------------  ENTRY HANDLER  -----------------------------------
  EntryRepaint(dt:FullEntry): void{
    for(let i:number = 0; i < this.EntryList.length; i++){
      if (this.EntryList[i].key == dt.key){
        const Stext = dt.Stext;
        const CC = dt.CC;
        const OC = dt.OC;

        const fontctx =  this.FFsize.toString() + "px " + this.FStyle;
        var CCctx = "#";
        if (CC != undefined){
          CCctx += CC;
        } else {
          if (this.BGColour == "#28282B"){
            CCctx += "FFFFFF";
          } else {
            CCctx += "000000";
          }
        }
        var OCctx = "#";
        if (OC != undefined){
          OCctx += OC;
        } else {
          if (this.BGColour == "#28282B"){
            OCctx += "FFFFFF";
          } else {
            OCctx += "000000";
          }
        }

        var TextPos:number = 0;
        switch (this.TAlign) {
          case "center":
            TextPos = this.DisplayElem[i].width/2.0;
            break;
          case "right":
            TextPos = this.DisplayElem[i].width - 30;
            break;
          default:
            TextPos = 30;
            break;
        }
    
        let ctx = this.DisplayElem[i].getContext("2d");
        this.DisplayElem[i].width = this.DisplayElem[i].clientWidth;
    
        if ((Stext != undefined) && (ctx != null)){
          ctx.textAlign = this.TAlign;
          ctx.font = fontctx;
     
          const Textmetric  = ctx.measureText(Stext);
          const textheight = Math.abs(Textmetric.actualBoundingBoxAscent) + Math.abs(Textmetric.actualBoundingBoxDescent) + 20;
    
          var TextFragment = Stext.split(" ");
          var TextContainer = [];
     
          for (var StringContainer = "", j = 0; j < TextFragment.length;j++){
            if (StringContainer == ""){
              StringContainer = TextFragment[j];
            } else {
              StringContainer += " " + TextFragment[j];
            }
        
            if (ctx.measureText(StringContainer).width + 10 > this.DisplayElem[i].width){
              if (StringContainer.lastIndexOf(" ") == -1){
                TextContainer.push(StringContainer);
                StringContainer = "";
              } else {
                TextContainer.push(StringContainer.substr(0, StringContainer.lastIndexOf(" ")));
                StringContainer = StringContainer.substr(StringContainer.lastIndexOf(" ") + 1);
              }
            }
        
            if (j == TextFragment.length - 1){
              TextContainer.push(StringContainer);
              const TextYShift = textheight*(TextContainer.length/2.0 - 0.75);
        
              this.DisplayElem[i].style.height = (textheight*TextContainer.length + 5) + "px";
              this.DisplayElem[i].height = this.DisplayElem[i].clientHeight;
              ctx.textAlign = this.TAlign;
              ctx.font = fontctx;
              ctx.fillStyle = CCctx;
              ctx.strokeStyle = OCctx;
              
              for (let j = 0; j < TextContainer.length; j++) {
                ctx.fillText(TextContainer[j], TextPos, this.DisplayElem[i].height/2.0 - TextYShift + j*textheight);
                ctx.strokeText(TextContainer[j], TextPos, this.DisplayElem[i].height/2.0 - TextYShift + j*textheight);
              }
            }
          }
        }

        this.EntryList[i] = dt;
        break;
      }
    }
  }

  EntryPrint(dt:FullEntry): void{
    if (this.DisplayElem.length == this.MaxDisplay){
      this.DisplayElem.shift()?.remove();
      this.EntryList.shift();
    }

    const cvs:HTMLCanvasElement = this.Renderer.createElement('canvas');
    if (this.Ani != ""){
      cvs.className = "animate__animated animate__" + this.Ani;
    } else {
      cvs.className = "animate__animated animate__fadeInLeft";
    }

    this.Renderer.appendChild(this.cardcontainer.nativeElement, cvs);

    const Stext = dt.Stext;
    const CC = dt.CC;
    const OC = dt.OC;

    const fontctx =  this.FFsize.toString() + "px " + this.FStyle;
    var CCctx = "#";
    if (CC != undefined){
      CCctx += CC;
    } else {
      if (this.BGColour == "#28282B"){
        CCctx += "FFFFFF";
      } else {
        CCctx += "000000";
      }
    }
    var OCctx = "#";
    if (OC != undefined){
      OCctx += OC;
    } else {
      if (this.BGColour == "#28282B"){
        OCctx += "FFFFFF";
      } else {
        OCctx += "000000";
      }
    }

    var TextPos:number = 0;
    switch (this.TAlign) {
      case "center":
        TextPos = cvs.width/2.0;
        break;
      case "right":
        TextPos = cvs.width - 30;
        break;
      default:
        TextPos = 30;
        break;
    }

    cvs.style.marginTop = "5px";
    let ctx = cvs.getContext("2d");
    cvs.width = cvs.clientWidth;
    
    if ((Stext != undefined) && (ctx != null)){
      cvs.textContent = Stext;
      cvs.id = Stext;
 
      ctx.textAlign = this.TAlign;
      ctx.font = fontctx;

      const Textmetric  = ctx.measureText(Stext);
      const textheight = Math.abs(Textmetric.actualBoundingBoxAscent) + Math.abs(Textmetric.actualBoundingBoxDescent) + 20;

      var TextFragment = Stext.split(" ");
      var TextContainer = [];
 
      for (var StringContainer = "", i = 0; i < TextFragment.length;i++){
        if (StringContainer == ""){
          StringContainer = TextFragment[i];
        } else {
          StringContainer += " " + TextFragment[i];
        }
    
        if (ctx.measureText(StringContainer).width + 10 > cvs.width){
          if (StringContainer.lastIndexOf(" ") == -1){
            TextContainer.push(StringContainer);
            StringContainer = "";
          } else {
            TextContainer.push(StringContainer.substr(0, StringContainer.lastIndexOf(" ")));
            StringContainer = StringContainer.substr(StringContainer.lastIndexOf(" ") + 1);
          }
        }
    
        if (i == TextFragment.length - 1){
          TextContainer.push(StringContainer);
          const TextYShift = textheight*(TextContainer.length/2.0 - 0.75);
    
          cvs.style.height = (textheight*TextContainer.length + 5) + "px";
          cvs.height = cvs.clientHeight;
          ctx.textAlign = this.TAlign;
          ctx.font = fontctx;
          ctx.fillStyle = CCctx;
          ctx.strokeStyle = OCctx;
          
          for (let j = 0; j < TextContainer.length; j++) {
            ctx.fillText(TextContainer[j], TextPos , cvs.height/2.0 - TextYShift + j*textheight);
            ctx.strokeText(TextContainer[j], TextPos, cvs.height/2.0 - TextYShift + j*textheight);
          }
        }
      }
    }

    this.EntryList.push(dt);
    this.DisplayElem.push(cvs);
  }

  EntryRepaintEverything(){
    for(let i:number = 0; i < this.EntryList.length; i++){
      const Stext = this.EntryList[i].Stext;
      const CC = this.EntryList[i].CC;
      const OC = this.EntryList[i].OC;
  
      const fontctx =  this.FFsize.toString() + "px " + this.FStyle;
      var CCctx = "#";
      if (CC != undefined){
        CCctx += CC;
      } else {
        if (this.BGColour == "#28282B"){
          CCctx += "FFFFFF";
        } else {
          CCctx += "000000";
        }
      }

      var OCctx = "#";
      if (OC != undefined){
        OCctx += OC;
      } else {
        if (this.BGColour == "#28282B"){
          OCctx += "FFFFFF";
        } else {
          OCctx += "000000";
        }
      }
  
      var TextPos:number = 0;
      switch (this.TAlign) {
        case "center":
          TextPos = this.DisplayElem[i].width/2.0;
          break;
        case "right":
          TextPos = this.DisplayElem[i].width - 30;
          break;
        default:
          TextPos = 30;
          break;
      }

      let ctx = this.DisplayElem[i].getContext("2d");
      this.DisplayElem[i].width = this.DisplayElem[i].clientWidth;
  
      if ((Stext != undefined) && (ctx != null)){
        ctx.textAlign = this.TAlign;
        ctx.font = fontctx;
   
        const Textmetric  = ctx.measureText(Stext);
        const textheight = Math.abs(Textmetric.actualBoundingBoxAscent) + Math.abs(Textmetric.actualBoundingBoxDescent) + 20;
  
        var TextFragment = Stext.split(" ");
        var TextContainer = [];
   
        for (var StringContainer = "", j = 0; j < TextFragment.length;j++){
          if (StringContainer == ""){
            StringContainer = TextFragment[j];
          } else {
            StringContainer += " " + TextFragment[j];
          }
      
          if (ctx.measureText(StringContainer).width + 10 > this.DisplayElem[i].width){
            if (StringContainer.lastIndexOf(" ") == -1){
              TextContainer.push(StringContainer);
              StringContainer = "";
            } else {
              TextContainer.push(StringContainer.substr(0, StringContainer.lastIndexOf(" ")));
              StringContainer = StringContainer.substr(StringContainer.lastIndexOf(" ") + 1);
            }
          }
      
          if (j == TextFragment.length - 1){
            TextContainer.push(StringContainer);
            const TextYShift = textheight*(TextContainer.length/2.0 - 0.75);
      
            this.DisplayElem[i].style.height = (textheight*TextContainer.length + 5) + "px";
            this.DisplayElem[i].height = this.DisplayElem[i].clientHeight;
            ctx.textAlign = this.TAlign;
            ctx.font = fontctx;
            ctx.fillStyle = CCctx;
            ctx.strokeStyle = OCctx;

            for (let j = 0; j < TextContainer.length; j++) {
              ctx.fillText(TextContainer[j], TextPos, this.DisplayElem[i].height/2.0 - TextYShift + j*textheight);
              ctx.strokeText(TextContainer[j], TextPos, this.DisplayElem[i].height/2.0 - TextYShift + j*textheight);
            }
          }
        }
      }
    }
  }
  //===================================  ENTRY HANDLER  ===================================



  //------------------------------------ ARCHIVE MENU ------------------------------------
  PlayButtonClick(){
    this.BoolPlay = true;
    this.IntervalID = setInterval(() => {
      this.Currtime += 0.1;
      this.CheckNewEntry();
    },100);
  }

  PauseButtonClick(){
    this.BoolPlay = false;
    clearInterval(this.IntervalID);
  }

  StopButtonClick(){
    this.PauseButtonClick();
    this.SetCurTime(0);
  }

  ParseTime(): string{
    var DTime:number = Math.floor(this.Currtime);
    var Sres:number = 0;
    var Stime:string = "";
    Sres = Math.floor(DTime/3600);
    DTime -= Sres*3600;
    if (Sres < 10){
      Stime += "0";
    }
    Stime += Sres.toString() + ":";
    Sres = Math.floor(DTime/60);
    DTime -= Sres*60;
    if (Sres < 10){
      Stime += "0";
    }
    Stime += Sres.toString() + ":";
    if (DTime < 10){
      Stime += "0";
    }
    Stime += DTime.toString();
    return(Stime);
  }

  SlideRelease():void {
    var playing = this.BoolPlay;
    if(this.BoolPlay){
      this.PauseButtonClick();
    }

    while(this.DisplayElem.length != 0){
      this.DisplayElem.pop()?.remove();
      this.EntryList.pop();
    }

    for (this.CurrIdx = -1; this.CurrIdx < this.ArchiveEntryList.length - 1; this.CurrIdx++){
      if (this.ArchiveEntryList[this.CurrIdx + 1].Stime - this.TimeShift >= this.Currtime){
        for (var idx = this.CurrIdx - 2; idx <= this.CurrIdx; idx++){
          if (idx >= 0){
            this.EntryPrint(this.ArchiveEntryList[idx]);
          }
        }
        break;
      }
    }

    if(playing){
      this.PlayButtonClick();
    }    
  }

  SetCurTime(dtime:number):void{
    var playing = this.BoolPlay;
    if(this.BoolPlay){
      this.PauseButtonClick();
    }

    this.Currtime = dtime;
    while(this.DisplayElem.length != 0){
      this.DisplayElem.pop()?.remove();
      this.EntryList.pop();
    }

    for (this.CurrIdx = -1; this.CurrIdx < this.ArchiveEntryList.length - 1; this.CurrIdx++){
      if (this.ArchiveEntryList[this.CurrIdx + 1].Stime - this.TimeShift >= dtime){
        break;
      }
    }

    if(playing){
      this.PlayButtonClick();
    }    
  }
  //==================================== ARCHIVE MENU ====================================



  //-------------------------------  ARCHIVE ENTRY HANDLER  -------------------------------
  CheckNewEntry():void{
    if ((this.CurrIdx + 1 > this.ArchiveEntryList.length) || (this.ArchiveEntryList.length == 0)){
      return;
    }
    if (this.Currtime > this.ArchiveEntryList[this.CurrIdx + 1].Stime - this.TimeShift){
      this.CurrIdx++;
      this.ArchivePrintEntry(this.CurrIdx);
    }
  }

  ArchivePrintEntry(idx:number):void {
    if (idx > this.ArchiveEntryList.length){
      return;
    }

    this.EntryPrint(this.ArchiveEntryList[idx]);
  }
  //===============================  ARCHIVE ENTRY HANDLER  ===============================



  faLock = faLock;
  faHome = faHome;
  faStop = faStop;
  faPlay = faPlay;
  faPause = faPause;
}
