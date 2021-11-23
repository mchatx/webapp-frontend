import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { TranslatorService } from '../services/translator.service';
import { faHome, faPause, faPlay, faStop, faLock, faUser, faSearchPlus, faSearchMinus, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { AccountService } from '../services/account.service';

class FullEntry {
  Stext: string = "";
  Stime: number = 0;
  Prfidx: number = 0;
  key: string = "";
  End: number = 0;
}

class Profile {
  Name: string = '';
  Prefix: string = '';
  Suffix: string = '';
  CC: string | undefined;
  OC: string | undefined;
}

class ArchiveSetting {
  StreamLink:string = "";
  Tags:string = "";
  Notes:string = "";
  PassCheck:boolean = false;
  PassString:string = "";
  ArchiveTitle:string = "";
  ThirdPartySharing:boolean = true;
  Hidden:boolean = false;
}

class ArchiveLink {
  Nick: string = "";
  Link: string = "";
}

@Component({
  selector: 'app-script-editor',
  templateUrl: './script-editor.component.html',
  styleUrls: ['./script-editor.component.scss']
})
export class ScriptEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('cardcontainer') cardcontainer !: ElementRef; 
  @ViewChild('loadstate') loadbutton !: ElementRef;
  @ViewChild('TableHeightRef') TableHeightRef !: ElementRef;
  @ViewChild('HeroHead') HeroHead !: ElementRef;
  @ViewChild('HeroFoot') HeroFoot !: ElementRef;
  @ViewChild('TableContainer') TableContainer !: ElementRef;
  LoginMode: boolean = false;
  OpenOption: boolean = false;
  SearchPass: string = "";
  status:string = "";

  //  DISPLAY VARIABLES
  EntryList: FullEntry[] = [];
  FFsize:number = 21;
  BGColour:string = "#28282B";
  SelectedEntry: number = 0;

  TableHeight: number = 100;
  DocumentHeight: number = window.innerHeight;

  RoomNick: string = "";
  Token: string = "";
  
  //  TL VARIABLES
  TLEntry:FullEntry = ({
    Stext: "",
    Stime: 0,
    Prfidx: 0,
    key: "",
    End: 0
  });

  Prefix: string = "";
  Suffix: string = "";
  OCcheck: boolean = false;
  CCcheck: boolean = false;
  OCcolour: string = "#000000";
  CCcolour: string = "#FFFFFF";

  ProfileTab:boolean = false;
  Profiletabtimeout:any;
  SelectedProfile: number = 0;
  ProfileList:Profile[] = [];

  //  TIMER VARIABLES
  TimerTime: number = 0;
  TimerDelegate: any | undefined = undefined;
  VidLoad: boolean = false;

  constructor(
    private TGEnc: TsugeGushiService,
    private TLService: TranslatorService,
    private router: Router,
    private AccService: AccountService
  ) { }

  InnerResize(wait: number | undefined = undefined):void {
    if (this.TableHeightRef) {
      if (wait) {
        setTimeout(() => {
          this.TableHeight = window.innerHeight - this.HeroFoot.nativeElement.offsetHeight - this.HeroHead.nativeElement.offsetHeight - 17; 
        }, wait);
      } else {
        this.TableHeight = window.innerHeight - this.HeroFoot.nativeElement.offsetHeight - this.HeroHead.nativeElement.offsetHeight - 17;
      }
    }
    this.RerenderTimeline();
  }

  ngAfterViewInit(): void {
    this.InnerResize(100);
    setTimeout(() => {
      this.RerenderTimeline();
    }, 100);
  }

  ngOnInit(): void {
    let test: string | null = localStorage.getItem("MChatToken");

    if (test != undefined) {
      try {
        let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
        if (TokenData["Role"] == "TL") {
          this.AccService.CheckToken(TokenData["Room"], TokenData["Token"]).subscribe({
            error: error => {
              localStorage.removeItem("MChatToken");
            },
            next: data => {
              this.LoginMode = true;
              this.RoomNick = TokenData["Room"];
              this.Token = TokenData["Token"];
              this.RoomNick = TokenData["Room"];
            }
          });
        } else {
          this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
        }
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }

    this.ProfileList.push({
      Name: 'Default',
      Prefix: '',
      Suffix: '',
      OC: undefined,
      CC: undefined
    });

    this.AddEntry({
      Stext: "--- Stream Starts ---",
      Stime: 0,
      Prfidx: 0,
      key: Date.now().toString(),
      End: 1000
    })
  }

  LoginRoom() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
      this.AccService.GetToken(this.RoomNick, this.SearchPass).subscribe({
        error: error => {
          setTimeout(() => {
          }, 2000);
          this.status = "WRONG PASSWORD/ROOM NAME";
          this.RoomNick = "";
          this.SearchPass = "";
        },
        next: data => {
          this.status = "LOGIN SUCCESS"
          if (data.body[0]["Role"] == "TL") {
            localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
              Room: this.RoomNick,
              Token: data.body[0]["Token"],
              Role: "TL"
            })));

            location.reload();
          } else {
            this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
            this.RoomNick = "";
            this.SearchPass = "";
          }
        }
      });
    }, 1000); //delay for button loading
  }



  //-------------------------- AUX CONTROL --------------------------
  ProfileName:string = "";
  EditCC:string = "";
  EditCCheck:boolean = false;
  EditOC:string = "";
  EditOCheck:boolean = false;
  EditText:string = "";
  EditKey:string = "";
  
  DBScriptList:ArchiveLink [] = [];
  DBScriptSelectedIndex: number = 0;

  TargetFile: File | null = null;
  filename: string = "No file uploaded";

  ModalMenu:number = 0;
  /*
    1 => Add New Profile
    2 => Script Setting
    3 => Edit Entry
    4 => Sync Timer to Video
    5 => Upload Script To DB
    6 => New Script
    7 => Import Script From Local File
    8 => Export Script To Local File
    9 => Download Script From DB
  */

  TempSetting: ArchiveSetting = {
    StreamLink: "",
    Tags: "",
    Notes: "",
    PassCheck: false,
    PassString: "",
    ArchiveTitle: "",
    ThirdPartySharing: true,
    Hidden: false
  };

  SavedSetting: ArchiveSetting = {
    StreamLink: "",
    Tags: "",
    Notes: "",
    PassCheck: false,
    PassString: "",
    ArchiveTitle: "",
    ThirdPartySharing: true,
    Hidden: false
  };

  SetModalMenu(idx: number):void {
    if (idx == 10) {
      if (this.SelectedProfile == 0) {
        return;
      }
    }

    this.ModalMenu = idx;
    switch (this.ModalMenu) {
      case 1:
        this.ProfileName = "";        
        break;
      
      case 9:
        this.DBScriptSelectedIndex = 0;
        this.FetchDBScriptList();
        break;
    }
  }

  SaveArchiveSetting():void {
    this.ModalMenu = 0;
    this.SavedSetting = this.TempSetting;
  }

  SendEdit():void {
    this.TLEntry.Stime = Date.now();

    this.UpdateEntry({
      Stext: this.EditText,
      Stime: 0,
      Prfidx: 0,
      key: this.EditKey,
      End: 0
    });

    this.ModalMenu = 0;
  }

  LoadVideo(): void {
    if (this.TempSetting.StreamLink.indexOf("https://www.youtube.com/watch?v=") != -1){
      var YTID:string = this.TempSetting.StreamLink.replace("https://www.youtube.com/watch?v=", "");
      if (YTID.indexOf("&") != -1){
        YTID = YTID.substring(0,YTID.indexOf("&"));
      }
      this.video = YTID;
      this.DelegatePlay = setInterval(() => {
        if (this.playstart){
          this.playstart = false;
          this.StartTimer(false);
        }
      }, 100);
  
      setTimeout(() => {
        this.LoadvideoYT();
        this.RerenderTimeline();
      });
    }
    this.VidLoad = true;
    this.ModalMenu = 0;
  }

  UnSync():void {
    this.VidLoad = false;
    clearInterval(this.DelegatePlay);
  }

  UploadToDB(): void {
    this.ModalMenu = 0;
  }

  NewScript(): void {
    this.ModalMenu = 0;
    this.EntryList = [];
    this.SavedSetting = {
      StreamLink: "",
      Tags: "",
      Notes: "",
      PassCheck: false,
      PassString: "",
      ArchiveTitle: "",
      ThirdPartySharing: true,
      Hidden: false
    };

    this.ProfileList.push({
      Name: 'Default',
      Prefix: '',
      Suffix: '',
      OC: undefined,
      CC: undefined
    });

    this.AddEntry({
      Stext: "--- Stream Starts ---",
      Stime: 0,
      Prfidx: 0,
      key: Date.now().toString(),
      End: 1000
    })
  }

  ImportFile() {
    this.NewScript();
    //PARSED ENTRY TO LOCAL ENTRY
  }

  FileChange(e: Event) {
    let ef = (e.target as HTMLInputElement);
    if (ef.files != null) {
      this.filename = ef.files[0].name;
      this.TargetFile = ef.files[0];
    }

    //this.ParseFile();
  }

  SaveLocal(){

  }

  DownloadScript(){
    this.NewScript();

  }

  FetchDBScriptList(){
    this.DBScriptList = [];
    this.TLService.GetAllArchive(this.RoomNick, this.Token).subscribe(
      (response) => {
        var dt = JSON.parse(response.body);
        for (let i = 0; i < dt.length; i++) {
          this.DBScriptList.push({
            Link: dt[i].Link,
            Nick: dt[i].Nick,
          });
        }
      });

  }
  //========================== AUX CONTROL ==========================



  //-------------------------- TL INPUT CONTROL --------------------------
  SaveActiveProfile(mode: number): void {
    switch (mode) {
      case 0:
        if (this.CCcheck) {
          this.ProfileList[this.SelectedProfile].CC = this.CCcolour;
        } else {
          this.ProfileList[this.SelectedProfile].CC = undefined;
        }
        break;

      case 1:
        if (this.OCcheck) {
          this.ProfileList[this.SelectedProfile].OC = this.OCcolour;
        } else {
          this.ProfileList[this.SelectedProfile].OC = undefined;
        }
        break;
    }
  }

  SaveProfile():void {
    this.ProfileList[this.SelectedProfile].Suffix = this.Suffix;
    this.ProfileList[this.SelectedProfile].Prefix = this.Prefix;
  }

  LoadProfile():void {
    if (this.ProfileList[this.SelectedProfile].CC != undefined){
      this.CCcheck = true;
      var test = this.ProfileList[this.SelectedProfile].CC;
      if (test){
        this.CCcolour = test;
      }      
    } else {
      this.CCcheck = false;
      this.CCcolour = '#FFFFFF';
    }

    if (this.ProfileList[this.SelectedProfile].OC != undefined){
      this.OCcheck = true;
      var test = this.ProfileList[this.SelectedProfile].OC;
      if (test){
        this.OCcolour = test;
      }      
    } else {
      this.OCcheck = false;
      this.OCcolour = '#FFFFFF';
    }

    this.Suffix = this.ProfileList[this.SelectedProfile].Suffix;
    this.Prefix = this.ProfileList[this.SelectedProfile].Prefix;

    if (!this.ProfileTab){
      this.ProfileTab = true;
      this.Profiletabtimeout = setTimeout(() => {
        this.ProfileTab = false;
      }, 3000);
    } else {
      clearTimeout(this.Profiletabtimeout);
      this.Profiletabtimeout = setTimeout(() => {
        this.ProfileTab = false;
      }, 3000);
    }
  }

  SearchProfile(): number {
    return this.EntryList.filter(e => e.Prfidx == this.SelectedProfile).length;
  }

  @HostListener('document:keydown.tab', ['$event'])
  ShiftProfile(event: KeyboardEvent):void {
    event.preventDefault();
    this.SaveProfile();
    if (this.SelectedProfile == this.ProfileList.length - 1){
      if (this.ProfileList.length == 1){
        this.SelectedProfile = 0;
      } else {
        this.SelectedProfile = 1;
      }
    } else {
      this.SelectedProfile++;
    }
    this.LoadProfile();
  }

  @HostListener('document:keydown.shift.tab', ['$event'])
  JumpToDefault(event: KeyboardEvent):void {
    this.SaveProfile();
    this.SelectedProfile = 0;
    this.LoadProfile();
    event.preventDefault();
  }

  @HostListener('document:keydown.arrowup', ['$event'])
  UpKeypress(event: KeyboardEvent):void {
    this.SaveProfile();
    if (this.SelectedProfile == 0){
      this.SelectedProfile = this.ProfileList.length - 1;
    } else {
      this.SelectedProfile--;
    }
    this.LoadProfile();
  }

  @HostListener('document:keydown.arrowdown', ['$event'])
  DownKeypress(event: KeyboardEvent):void {
    this.SaveProfile();
    if (this.SelectedProfile == this.ProfileList.length - 1){
        this.SelectedProfile = 0;
    } else {
      this.SelectedProfile++;
    }
    this.LoadProfile();
  }

  @HostListener('document:keydown.control.1', ['$event'])
  CtrlAlpha1Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(0);
  }

  @HostListener('document:keydown.control.2', ['$event'])
  CtrlAlpha2Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(1);
  }

  @HostListener('document:keydown.control.3', ['$event'])
  CtrlAlpha3Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(2);
  }

  @HostListener('document:keydown.control.4', ['$event'])
  CtrlAlpha4Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(3);
  }

  @HostListener('document:keydown.control.5', ['$event'])
  CtrlAlpha5Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(4);
  }

  @HostListener('document:keydown.control.6', ['$event'])
  CtrlAlpha6Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(5);
  }

  @HostListener('document:keydown.control.7', ['$event'])
  CtrlAlpha7Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(6);
  }

  @HostListener('document:keydown.control.8', ['$event'])
  CtrlAlpha8Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(7);
  }

  @HostListener('document:keydown.control.9', ['$event'])
  CtrlAlpha9Keypress(event: KeyboardEvent):void {
    event.preventDefault();
    this.JumpToProfile(8);
  }

  @HostListener('document:keydown.control.space', ['$event'])
  CtrlSpaceKeypress(event: KeyboardEvent):void {
    if (this.TimerDelegate) {
      this.StopTimer(true);
    } else {
      this.StartTimer(true);
    }
  }

  @HostListener('document:keydown.control.arrowright', ['$event'])
  CtrlRightKeypress(event: KeyboardEvent):void {
    this.TimerTime += 3000;
    this.SendSeek();
  }

  @HostListener('document:keydown.control.arrowleft', ['$event'])
  CtrlLeftKeypress(event: KeyboardEvent):void {
    if (this.TimerTime > 5000) {
      this.TimerTime -= 3000;
      this.SendSeek();
    } else {
      this.TimerTime = 0;
      this.SendSeek();
    }
  }

  JumpToProfile(target:number) {
    if (target < this.ProfileList.length){
      this.SaveProfile();
      this.SelectedProfile = target;
      this.LoadProfile();
    }
  }

  ShiftUp():void {
    if(this.SelectedProfile > 1){
      this.SelectedProfile -= 1;
      var TempProfile: Profile = this.ProfileList[this.SelectedProfile];
      this.ProfileList[this.SelectedProfile] = this.ProfileList[this.SelectedProfile + 1];
      this.ProfileList[this.SelectedProfile + 1] = TempProfile;

      if (!this.ProfileTab){
        this.ProfileTab = true;
        this.Profiletabtimeout = setTimeout(() => {
          this.ProfileTab = false;
        }, 3000);
      } else {
        clearTimeout(this.Profiletabtimeout);
        this.Profiletabtimeout = setTimeout(() => {
          this.ProfileTab = false;
        }, 3000);
      }
    }
  }

  ShiftDown():void {
    if((this.SelectedProfile < this.ProfileList.length  - 1) && (this.SelectedProfile != 0)){
      this.SelectedProfile += 1;
      var TempProfile: Profile = this.ProfileList[this.SelectedProfile];
      this.ProfileList[this.SelectedProfile] = this.ProfileList[this.SelectedProfile - 1];
      this.ProfileList[this.SelectedProfile - 1] = TempProfile;

      if (!this.ProfileTab){
        this.ProfileTab = true;
        this.Profiletabtimeout = setTimeout(() => {
          this.ProfileTab = false;
        }, 3000);
      } else {
        clearTimeout(this.Profiletabtimeout);
        this.Profiletabtimeout = setTimeout(() => {
          this.ProfileTab = false;
        }, 3000);
      }
    }
  }

  DeleteProfile():void {
    if (this.SelectedProfile != 0){
      this.EntryList.filter(e => e.Prfidx == this.SelectedProfile).map(e => {
        e.Prfidx = 0;
        return e;
      });
      this.ProfileList.splice(this.SelectedProfile, 1);
      this.SelectedProfile--;
    }
    this.LoadProfile();
  }

  AddProfile():void {
    this.SaveProfile();
    this.SelectedProfile = this.ProfileList.length;
    if (this.ProfileName != ''){
      this.ProfileList.push({
        Name: this.ProfileName,
        Prefix: '',
        Suffix: '',
        OC: undefined,
        CC: undefined
      });
    } else {
      this.ProfileList.push({
        Name: 'Profile' + (this.ProfileList.length + 1).toString(),
        Prefix: '',
        Suffix: '',
        OC: undefined,
        CC: undefined
      });
    }
    this.LoadProfile();
    this.ModalMenu = 0;
  }

  SpamBlock:boolean = false;
  SendEntry(): void{
    if (!this.SpamBlock){
      this.SpamBlock = true;
      this.TLEntry.Stime = this.TimerTime;
  
      this.AddEntry({
        Stext: this.Prefix + this.TLEntry.Stext + this.Suffix,
        Stime: this.TLEntry.Stime,
        Prfidx: this.SelectedProfile,
        key: Date.now().toString(),
        End: this.TLEntry.Stime + 1000
      });
  
      this.TLEntry.Stext = "";
      setTimeout(() => {
        this.InnerResize();
        this.TableContainer.nativeElement.scrollTop = this.TableContainer.nativeElement.scrollHeight;
        this.SpamBlock = false;
      }, 100);
    }
  }
  //========================== TL INPUT CONTROL ==========================  



  //-----------------------------------  ENTRY HANDLER  -----------------------------------
  UpdateEntry(dt:FullEntry): void{
    for(let i:number = 0; i < this.EntryList.length; i++){
      if (this.EntryList[i].key == dt.key){
        dt.Stime = this.EntryList[i].Stime;

        this.EntryList[i] = dt;
        break;
      }
    }
  }

  AddEntry(dt:FullEntry): void{
    let Inserted:boolean = false;
    for (var i = 0; i < this.EntryList.length; i++) {
      if (this.EntryList[i].Stime > dt.Stime) {
        if (i > 0) {
          this.EntryList[i - 1].End = dt.Stime;  
        }

        if (i < this.EntryList.length - 2) {
          this.EntryList[i].Stime = dt.End;  
        }
        
        this.EntryList.splice(i, 0, dt);
        Inserted = true;
        break;
      }
    }

    if (!Inserted) {
      if (this.EntryList.length != 0){
        this.EntryList[this.EntryList.length - 1].End = dt.Stime;
      }
      this.EntryList.push(dt);
    }
  }

  DeleteEntry(): void {
    this.EntryList.splice(this.SelectedEntry, 1);
  }
  //===================================  ENTRY HANDLER  ===================================



  //---------------------------  VIDEO LOADER HANDLER  ---------------------------
  public reframed: Boolean = false;
  isRestricted = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  public YT: any;
  public video: any;
  public player: any;

  DelegatePlay:any;
  playstart:boolean = false;

  LoadvideoYT() {
    if (window['YT']) {
      this.startVideoYT();
      return;
    }

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag.parentNode){
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }    

    window['onYouTubeIframeAPIReady'] = () => this.startVideoYT();
  }

  startVideoYT() {
    this.reframed = false;
    this.player = new window['YT'].Player('player', {
      videoId: this.video,
      playerVars: {
        playsinline: 1
      },
      events: {
        'onStateChange': this.onPlayerStateChangeYT.bind(this),
      }
    });
  }

  onPlayerStateChangeYT(event:any) {
    this.TogglePlayPause();
  };

  TogglePlayPause(){
    this.TimerTime = Math.round(this.player.getCurrentTime() * 1000);
    switch (this.player.getPlayerState()) {
      case 1:
        this.playstart = true;
        break;
    
      case 2:
        this.StopTimer(false);
        break;
    }
  }
  //===========================  VIDEO LOADER HANDLER  ===========================



  //-----------------------------------  EXPORT HANDLER  -----------------------------------
  ExportToFile(mode:number):void {
    this.ModalMenu = 0;
  }
  //===================================  EXPORT HANDLER  ===================================



  //-------------------------- RULER HANDLER --------------------------
  @ViewChild('TimeCanvas1') TimeCanvas1 !: ElementRef<HTMLCanvasElement>;
  @ViewChild('TimelineDiv') TimeDiv !: ElementRef<HTMLDivElement>;
  ctx: CanvasRenderingContext2D | null = null;
  ResizeMode: boolean = false;
  TimelineActive: boolean = false;
  XPos: number = 0;

  // TIMELINE VARIABLES
  TimelineDur: number = 3600;
  SecToPx: number = 200;

  RulerMouseLeave(event: any) {
    this.TimelineActive = false;
  }

  RulerMouseDown(event: any, idx: number, ResizeSwitch: boolean) {
    if (!this.TimelineActive) {
      this.SelectedEntry = idx;
      this.TimelineActive = true;
      this.XPos = event.clientX;
      this.ResizeMode = ResizeSwitch;
    }
  }

  RulerMouseUp(event: any) {
    this.TimelineActive = false;
  }

  RulerMouseMove(event: any) {
    if (this.TimelineActive) {
      if (this.ResizeMode) {
        var a = this.EntryList[this.SelectedEntry].End + (event.clientX - this.XPos)/this.SecToPx*1000;
        if (a - this.EntryList[this.SelectedEntry].Stime < 300) {
          this.TimelineActive = false;
          return;
        }

        if (this.SelectedEntry < this.EntryList.length - 1){
          var b = this.EntryList[this.SelectedEntry + 1].Stime + (event.clientX - this.XPos)/this.SecToPx*1000;
          if (this.EntryList[this.SelectedEntry + 1].End - b < 300) {
            this.TimelineActive = false;
            return;
          }
          this.EntryList[this.SelectedEntry + 1].Stime = b;
        }

        this.EntryList[this.SelectedEntry].End = a;

      } else {
        if (this.SelectedEntry != 0) {
          var a = this.EntryList[this.SelectedEntry - 1].End + (event.clientX - this.XPos)/this.SecToPx*1000;
          if (a - this.EntryList[this.SelectedEntry - 1].Stime < 300) {
            this.TimelineActive = false;
            return;
          }

          if (this.SelectedEntry < this.EntryList.length - 1){
            var b = this.EntryList[this.SelectedEntry + 1].Stime + (event.clientX - this.XPos)/this.SecToPx*1000;
            if (this.EntryList[this.SelectedEntry + 1].End - b < 300){
              this.TimelineActive = false;
              return;
            }
            this.EntryList[this.SelectedEntry + 1].Stime = b;
          }

          this.EntryList[this.SelectedEntry - 1].End = a;
          this.EntryList[this.SelectedEntry].Stime += (event.clientX - this.XPos)/this.SecToPx*1000;
          this.EntryList[this.SelectedEntry].End += (event.clientX - this.XPos)/this.SecToPx*1000;

          
        }
      }
      this.XPos = event.clientX;
    }    
  }


  TimelineZoomout() {
    if (this.SecToPx > 20){
      this.SecToPx -= 20;
      this.InnerResize(10);
      this.RerenderTimeline();
    }
  }

  TimelineZoomin() {
    this.SecToPx += 20;
    this.InnerResize(10);
    this.RerenderTimeline();
  }

  RerenderTimeline(){
    if (this.TimeCanvas1) {
      this.ctx = this.TimeCanvas1.nativeElement.getContext("2d");

      if (this.ctx) {
        const width = this.TimeCanvas1.nativeElement.offsetWidth;
        const height = this.TimeCanvas1.nativeElement.offsetHeight;
        this.TimeCanvas1.nativeElement.width = width;
        this.TimeCanvas1.nativeElement.height = height;
   
        this.ctx.save();
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Ubuntu';
        this.ctx.lineWidth = 0.35;
    
        for (let x = 0; x*this.SecToPx/10 < width; x += 1) {
          if (x % 10 == 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x*this.SecToPx/10, 0);
            this.ctx.lineTo(x*this.SecToPx/10, height);
            this.ctx.stroke();
            this.ctx.fillText((x/10).toString(), x*this.SecToPx/10 + 5, height);
          } else if (x % 2 == 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x*this.SecToPx/10, 0);
            this.ctx.lineTo(x*this.SecToPx/10, height*2.0/3.0);
            this.ctx.stroke();
          } else {
            this.ctx.beginPath();
            this.ctx.moveTo(x*this.SecToPx/10, 0);
            this.ctx.lineTo(x*this.SecToPx/10, height*1.0/3.0);
            this.ctx.stroke();
          }
        }
    
        this.ctx.restore();
      }
    }
  }
  //========================== RULER HANDLER ==========================



  //-------------------------- TIMER CONTROL --------------------------
  StartTimer(propagate:boolean):void {
    if (!this.TimerDelegate){
      if (this.VidLoad){
        this.TimerTime = Math.round(this.player.getCurrentTime() * 1000);
      }
      this.TimerDelegate = setInterval(() => {
        this.TimerTime += 100;
        if (this.TimeDiv) {
          this.TimeDiv.nativeElement.scrollLeft = this.TimerTime/1000*this.SecToPx;
        }
      }, 100);
      if (propagate && this.VidLoad){
        this.player.playVideo();
      }
    }
  }

  StopTimer(propagate: boolean):void {
    if (this.TimerDelegate){
      if (this.VidLoad){
        this.TimerTime = Math.round(this.player.getCurrentTime() * 1000);
      }
      clearInterval(this.TimerDelegate);
      this.TimerDelegate = undefined;
      if (propagate && this.VidLoad){
        this.player.pauseVideo()
      }
    }
  }

  SendSeek(){
    if (this.VidLoad){
      this.player.seekTo(this.TimerTime/1000, true);
    }
  }
  //========================== TIMER CONTROL ==========================



  faTimesCircle = faTimesCircle;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faUser = faUser;
  faLock = faLock;
  faHome = faHome;
  faStop = faStop;
  faPlay = faPlay;
  faPause = faPause;
}