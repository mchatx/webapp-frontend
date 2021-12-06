import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
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
export class ScriptEditorComponent implements OnInit, AfterViewInit, OnDestroy {
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
  }

  ngOnDestroy(): void {
    if (this.TimerDelegate) {
      clearInterval(this.TimerDelegate);
    }
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
    }
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

    /*
    this.AddEntry({
      Stext: "--- Stream Starts ---",
      Stime: 0,
      Prfidx: 0,
      key: Date.now().toString(),
      End: 1000
    })
    */
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

  UploadToDB(): void {
    this.ModalMenu = 0;
  }

  NewScript(): void {
    this.ModalMenu = 0;
    this.EntryList = [];
    this.BarCount = 0;
    this.TimeCardIdx = [];
    this.XtraMargin = 0;
    this.TimerTime = 0;
    if (this.TimerDelegate) {
      clearInterval(this.TimerDelegate);
      this.TimerDelegate = undefined;
    }
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }

    this.RerenderTimeline(); 
    this.ReloadDisplayCards();
    this.ScrollCalculator();

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

    /*
    this.AddEntry({
      Stext: "--- Stream Starts ---",
      Stime: 0,
      Prfidx: 0,
      key: Date.now().toString(),
      End: 1000
    })
    */
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

        if (i < this.EntryList.length){
          dt.End = this.EntryList[i].Stime;  
        }
        
        this.EntryList.splice(i, 0, dt);
        this.ActiveEntry = i;
        this.ReloadDisplayCards();
        Inserted = true;
        return;
      }
    }

    if (!Inserted) {
      if (this.EntryList.length != 0){
        this.EntryList[this.EntryList.length - 1].End = dt.Stime;
      }
      this.EntryList.push(dt);
      this.ActiveEntry = this.EntryList.length - 1;
      this.ReloadDisplayCards();
      return;
    }
  }

  DeleteEntry(): void {
    this.TimeCardIdx = [];
    if (this.EntryList.length == 1){
      this.ActiveEntry = -1;
    } else if(this.ActiveEntry > 0){
      this.ActiveEntry--;
    }

    var dt: FullEntry = this.EntryList.splice(this.SelectedEntry, 1)[0];
    if (this.SelectedEntry > 0) {
      this.EntryList[this.SelectedEntry - 1].End = dt.End;
    } else if (this.EntryList.length > 0) {
      this.EntryList[this.SelectedEntry].Stime = dt.Stime;
    }
    this.ReloadDisplayCards();
  }
  //===================================  ENTRY HANDLER  ===================================



  //---------------------------  VIDEO LOADER HANDLER  ---------------------------
  public reframed: Boolean = false;
  isRestricted = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  public YT: any;
  public video: any;
  public player: any;

  TrackerDelegate: any;
  PauseTracker: boolean = false;

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
        'onReady': this.ReadyStateYT.bind(this),
        'onStateChange': this.onPlayerStateChangeYT.bind(this),
      }
    });
  }

  onPlayerStateChangeYT(event:any) {
    this.TogglePlayPause();
  };

  ReadyStateYT() {
    this.PauseTracker = false;
  }

  TogglePlayPause(){
    switch (this.player.getPlayerState()) {
      case 1:
        break;
    
      case 2:
        this.StopTimer(false);
        break;
      
      case 3:
        break;
    }
  }

  StartTracker(): void {
    this.PauseTracker = true;
    if (this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }

    this.TrackerDelegate = setInterval(() => {
      if (!this.PauseTracker) {
        this.TimerTime = this.player.getCurrentTime()*1000;  
      }      
      this.ScrollCalculator();  
    }, 20);

  }

  LoadVideo(): void {
    if (this.TempSetting.StreamLink.indexOf("https://www.youtube.com/watch?v=") == 0){
      var YTID:string = this.TempSetting.StreamLink.replace("https://www.youtube.com/watch?v=", "");
      if (YTID.indexOf("&") != -1){
        YTID = YTID.substring(0,YTID.indexOf("&"));
      }
      this.video = YTID;
  
      setTimeout(() => {
        this.LoadvideoYT();
        this.RerenderTimeline();
      }, 100);
      this.UnSync();
      this.StopTimer(false);
      this.VidLoad = true;
      this.StartTracker();
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.indexOf("https://youtu.be/") == 0) {
      var YTID:string = this.TempSetting.StreamLink.replace("https://youtu.be/", "");
      this.video = YTID;
  
      setTimeout(() => {
        this.LoadvideoYT();
        this.RerenderTimeline();
      }, 100);
      this.UnSync();
      this.StopTimer(false);
      this.VidLoad = true;
      this.StartTracker();
      this.ModalMenu = 0;
    }
  }

  UnSync():void {
    this.VidLoad = false;
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
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
  @ViewChild('TimeCanvas2') TimeCanvas2 !: ElementRef<HTMLCanvasElement>;
  @ViewChild('TimeCanvas3') TimeCanvas3 !: ElementRef<HTMLCanvasElement>;
  @ViewChild('TimelineDiv') TimeDiv !: ElementRef<HTMLDivElement>;
  ctx: CanvasRenderingContext2D | null = null;
  ResizeMode: boolean = false;
  TimelineActive: boolean = false;
  XPos: number = 0;
  TimeCardIdx: number[] = [];

  // TIMELINE VARIABLES
  TimelineDur: number = 3600;
  SecToPx: number = 140;
  SecPerBar: number = 20;
  BarHeight: number = 25;
  XtraMargin: number = 0;
  JumpScroll: boolean = true;
  BarCount: number = 0;

  SectoTimestring(Sec: number, msOutput: boolean = true, Full: boolean = false): string {
    var MS:string = Math.floor((Sec % 1)*100).toString();
    if (MS.length == 1){
      MS = "0" + MS;
    }

    Sec = Math.floor(Sec);
    var H: number = Math.floor(Sec/60/60);
    Sec -= H*60*60;
    var M: number = Math.floor(Sec/60);
    Sec -= M*60;

    var Stemp:string = H.toString() 
    if (Stemp.length == 1){
      Stemp = "0" + Stemp;
    }
    Stemp += ":" + ("0" + M.toString()).slice(-2) + ":" + ("0" + Sec.toString()).slice(-2) + "." + MS;

    if (Full) {
      if (msOutput) {
        return Stemp;
      } else {
        return Stemp.slice(0, Stemp.length - 3);
      }
    } else {
      for (var i = 0; i < 3; i++) {
        if (Stemp.slice(0, 2) != "00"){
          break;
        } else {
          Stemp = Stemp.slice(3);
        }
      }

      if (Stemp[0] == '0'){
        Stemp = Stemp.slice(1);
      }

      if (msOutput) {
        return Stemp;
      } else {
        return Stemp.slice(0, Stemp.length - 3);
      }
    }
  }

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
        if (a - this.EntryList[this.SelectedEntry].Stime < 50) {
          this.TimelineActive = false;
          return;
        }

        if (this.SelectedEntry < this.EntryList.length - 1){
          var b = this.EntryList[this.SelectedEntry + 1].Stime + (event.clientX - this.XPos)/this.SecToPx*1000;
          if (this.EntryList[this.SelectedEntry + 1].End - b < 50) {
            this.TimelineActive = false;
            return;
          }
          this.EntryList[this.SelectedEntry + 1].Stime = b;
        }

        this.EntryList[this.SelectedEntry].End = a;

      } else {
        if (this.SelectedEntry != 0) {
          var a = this.EntryList[this.SelectedEntry - 1].End + (event.clientX - this.XPos)/this.SecToPx*1000;
          if (a - this.EntryList[this.SelectedEntry - 1].Stime < 50) {
            this.TimelineActive = false;
            return;
          }

          if (this.SelectedEntry < this.EntryList.length - 1){
            var b = this.EntryList[this.SelectedEntry + 1].Stime + (event.clientX - this.XPos)/this.SecToPx*1000;
            if (this.EntryList[this.SelectedEntry + 1].End - b < 50){
              this.TimelineActive = false;
              return;
            }
            this.EntryList[this.SelectedEntry + 1].Stime = b;
          }

          this.EntryList[this.SelectedEntry - 1].End = a;
          this.EntryList[this.SelectedEntry].Stime += (event.clientX - this.XPos)/this.SecToPx*1000;
          this.EntryList[this.SelectedEntry].End += (event.clientX - this.XPos)/this.SecToPx*1000;

        } else {
          var a = this.EntryList[this.SelectedEntry].Stime + (event.clientX - this.XPos)/this.SecToPx*1000;
          if (a < 0) {
            this.TimelineActive = false;
            return;
          }

          if (this.EntryList[this.SelectedEntry].End - a < 50){
            this.TimelineActive = false;
            return;
          }
    
          this.EntryList[this.SelectedEntry].Stime = a;
          
          this.ReloadDisplayCards();
        }
      }
      this.XPos = event.clientX;
    }    
  }


  TimelineZoomout() {
    if (this.SecToPx > 20){
      const XMarginTemp:number = this.XtraMargin/this.SecToPx;
      this.SecToPx -= 20;
      this.XtraMargin = XMarginTemp*this.SecToPx;
      this.ScrollCalculator();
      this.InnerResize(100);
    }
  }

  TimelineZoomin() {
    if (this.SecToPx < 200) {
      const XMarginTemp:number = this.XtraMargin/this.SecToPx;
      this.SecToPx += 20;
      this.XtraMargin = XMarginTemp*this.SecToPx;
      this.ScrollCalculator();
      this.InnerResize(100);
    }
  }

  RerenderTimeline(){
    if (this.TimeCanvas1) {
      for(var i = 0; i < 3; i++) {
        switch (i) {
          case 0:
            this.ctx = this.TimeCanvas1.nativeElement.getContext("2d");    
            this.TimeCanvas1.nativeElement.width = this.SecToPx*this.SecPerBar;
            this.TimeCanvas1.nativeElement.height = this.BarHeight;
            break;

          case 1:
            this.ctx = this.TimeCanvas2.nativeElement.getContext("2d");    
            this.TimeCanvas2.nativeElement.width = this.SecToPx*this.SecPerBar;
            this.TimeCanvas2.nativeElement.height = this.BarHeight;
            break;

          case 2:
            this.ctx = this.TimeCanvas3.nativeElement.getContext("2d");    
            this.TimeCanvas3.nativeElement.width = this.SecToPx*this.SecPerBar;
            this.TimeCanvas3.nativeElement.height = this.BarHeight;
            break;    
        }
        
        if (this.ctx) {
          this.ctx.save();
          this.ctx.strokeStyle = 'white';
          this.ctx.fillStyle = 'white';
          this.ctx.font = '14px Ubuntu';
          this.ctx.lineWidth = 0.35;
      
          for (let x = 0; x/10 < this.SecPerBar; x += 1) {
            if (x % 10 == 0) {
              this.ctx.beginPath();
              this.ctx.moveTo(x*this.SecToPx/10, 0);
              this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight);
              this.ctx.stroke();
              
              this.ctx.fillText(this.SectoTimestring(x/10 + i*this.SecPerBar + this.BarCount*this.SecPerBar, false, false), x*this.SecToPx/10 + 5, this.BarHeight);
            } else if (x % 2 == 0) {
              this.ctx.beginPath();
              this.ctx.moveTo(x*this.SecToPx/10, 0);
              this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*2.0/3.0);
              this.ctx.stroke();
            } else {
              this.ctx.beginPath();
              this.ctx.moveTo(x*this.SecToPx/10, 0);
              this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*1.0/3.0);
              this.ctx.stroke();
            }
          }
      
          this.ctx.restore();
        }
      }
    }
  }

  ScrollCalculator(): void {
    const DeltaBar: number = this.TimerTime/1000/this.SecPerBar - this.BarCount;
    if ((DeltaBar > 3) || (DeltaBar < 0)) {
      const BarCountNew = Math.floor(this.TimerTime/1000/this.SecPerBar);
      if (BarCountNew > 0) {
        this.BarCount = BarCountNew - 1;
      } else {
        this.BarCount = 0;
      }
      this.RerenderTimeline(); 
      this.ReloadDisplayCards();
    } else if (DeltaBar > 2){
      this.BarCount++;
      this.RenderForward();
      this.ReloadDisplayCards();
    } else if ((DeltaBar < 1) && (this.BarCount > 0)) {
      this.BarCount--;
      this.RenderBackward();
      this.ReloadDisplayCards();
    }

    if (this.VidLoad) {
      if (this.ActiveEntry < 0){
        if (this.EntryList.length > 0){
          this.ActiveEntry = 0;
        }
      } else if (this.EntryList[this.ActiveEntry].Stime > this.TimerTime) {
        if (this.ActiveEntry > 0){
          this.ActiveEntry--;
        }        
      } else if (this.EntryList[this.ActiveEntry].End < this.TimerTime) {
        if (this.ActiveEntry < this.EntryList.length - 1){
          this.ActiveEntry++;
        }
      }
    }

    this.TimeDiv.nativeElement.scrollLeft = (this.TimerTime/1000 - this.BarCount*this.SecPerBar)*this.SecToPx;
  }

  RenderForward(): void {
    this.ctx = this.TimeCanvas1.nativeElement.getContext("2d");
    if (this.ctx) {
      this.TimeCanvas1.nativeElement.width = this.SecToPx*this.SecPerBar;
      this.TimeCanvas1.nativeElement.height = this.BarHeight;
      this.ctx.drawImage(this.TimeCanvas2.nativeElement, 0, 0);
    }

    this.ctx = this.TimeCanvas2.nativeElement.getContext("2d");
    if (this.ctx) {
      this.TimeCanvas2.nativeElement.width = this.SecToPx*this.SecPerBar;
      this.TimeCanvas2.nativeElement.height = this.BarHeight;
      this.ctx.drawImage(this.TimeCanvas3.nativeElement, 0, 0);
    }

    this.ctx = this.TimeCanvas3.nativeElement.getContext("2d");    
    this.TimeCanvas3.nativeElement.width = this.SecToPx*this.SecPerBar;
    this.TimeCanvas3.nativeElement.height = this.BarHeight;
    
    if (this.ctx) {
      this.ctx.save();
      this.ctx.strokeStyle = 'white';
      this.ctx.fillStyle = 'white';
      this.ctx.font = '14px Ubuntu';
      this.ctx.lineWidth = 0.35;
  
      for (let x = 0; x/10 < this.SecPerBar; x += 1) {
        if (x % 10 == 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight);
          this.ctx.stroke();
          
          this.ctx.fillText(this.SectoTimestring(x/10 + 2*this.SecPerBar + this.BarCount*this.SecPerBar, false, false), x*this.SecToPx/10 + 5, this.BarHeight);
        } else if (x % 2 == 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*2.0/3.0);
          this.ctx.stroke();
        } else {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*1.0/3.0);
          this.ctx.stroke();
        }
      }
  
      this.ctx.restore();
    }
  }

  RenderBackward(): void {
    this.ctx = this.TimeCanvas3.nativeElement.getContext("2d");
    if (this.ctx) {
      this.TimeCanvas3.nativeElement.width = this.SecToPx*this.SecPerBar;
      this.TimeCanvas3.nativeElement.height = this.BarHeight;
      this.ctx.drawImage(this.TimeCanvas2.nativeElement, 0, 0);
    }

    this.ctx = this.TimeCanvas2.nativeElement.getContext("2d");
    if (this.ctx) {
      this.TimeCanvas2.nativeElement.width = this.SecToPx*this.SecPerBar;
      this.TimeCanvas2.nativeElement.height = this.BarHeight;
      this.ctx.drawImage(this.TimeCanvas1.nativeElement, 0, 0);
    }

    this.ctx = this.TimeCanvas1.nativeElement.getContext("2d");    
    this.TimeCanvas1.nativeElement.width = this.SecToPx*this.SecPerBar;
    this.TimeCanvas1.nativeElement.height = this.BarHeight;
    
    if (this.ctx) {
      this.ctx.save();
      this.ctx.strokeStyle = 'white';
      this.ctx.fillStyle = 'white';
      this.ctx.font = '14px Ubuntu';
      this.ctx.lineWidth = 0.35;
  
      for (let x = 0; x/10 < this.SecPerBar; x += 1) {
        if (x % 10 == 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight);
          this.ctx.stroke();
          
          this.ctx.fillText(this.SectoTimestring(x/10 + this.BarCount*this.SecPerBar, false, false), x*this.SecToPx/10 + 5, this.BarHeight);
        } else if (x % 2 == 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*2.0/3.0);
          this.ctx.stroke();
        } else {
          this.ctx.beginPath();
          this.ctx.moveTo(x*this.SecToPx/10, 0);
          this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*1.0/3.0);
          this.ctx.stroke();
        }
      }
  
      this.ctx.restore();
    }
  }

  ReloadDisplayCards():void {
    this.RefreshActiveEntry();
    this.TimeCardIdx = [];
    this.XtraMargin = 0;
    for (var i = 0; i < this.EntryList.length; i++) {
      if (this.EntryList[i].End > (this.BarCount + 3.0)*this.SecPerBar*1000) {
        if (this.EntryList[i].Stime < (this.BarCount + 3.0)*this.SecPerBar*1000) {
          this.TimeCardIdx.push(i);
        }
        break;
      } else if (this.EntryList[i].End > this.BarCount*this.SecPerBar*1000){
        if (this.EntryList[i].Stime >= this.BarCount*this.SecPerBar*1000){
          this.TimeCardIdx.push(i);
          
          if ((i == 0) && (this.EntryList[i].Stime != 0)){
            this.XtraMargin = (this.EntryList[i].Stime/1000 - this.BarCount*this.SecPerBar)*this.SecToPx;
          }

          continue;
        } else {
          this.TimeCardIdx.push(i);
          continue;
        }
      } 
    }
  }

  CardWidthCalculator(idx: number): string{
    if ((idx != 0) && (idx == this.TimeCardIdx[0])) {
      return (((this.EntryList[idx].End/1000 - this.BarCount*this.SecPerBar)*this.SecToPx).toString() + 'px');
    } else if (this.EntryList[idx].End > (this.BarCount + 3.0)*this.SecPerBar*1000) {
      return ((((this.BarCount + 3.0)*this.SecPerBar - this.EntryList[idx].Stime/1000)*this.SecToPx).toString() + 'px');
    } else {
      return (((this.EntryList[idx].End - this.EntryList[idx].Stime)/1000*this.SecToPx).toString() + 'px');
    }
  }
  //========================== RULER HANDLER ==========================



  //-------------------------- TIMER CONTROL --------------------------
  ActiveEntry:number = -1;

  @HostListener('document:keydown.control.space', ['$event'])
  CtrlSpaceKeypress(event: KeyboardEvent):void {
    event.preventDefault();
    if (this.VidLoad){
      if (this.player){
        if (this.player){
          if (this.player.getPlayerState() != 1) {
            this.player.playVideo();
          } else if (this.player.getPlayerState() == 1) {
            this.player.pauseVideo();
          }
        }
      }
    } else {
      if (this.TimerDelegate) {
        this.StopTimer(true);
      } else {
        this.StartTimer(true);
      }
    }
    this.ScrollCalculator();
  }

  @HostListener('document:keydown.control.arrowright', ['$event'])
  CtrlRightKeypress(event: KeyboardEvent):void {
    this.TimerTime += 3000;
    this.SendSeek();
    this.ScrollCalculator();
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
    this.ScrollCalculator();
  }


  StartTimer(propagate:boolean):void {
    if (this.VidLoad) {
      if (propagate){
        this.player.playVideo();
      }
    } else {
      if (!this.TimerDelegate){
        this.TimerDelegate = setInterval(() => {
          this.TimerTime += 20;
          this.ScrollCalculator();  
        }, 20);
      }
    }
  }

  StopTimer(propagate: boolean):void {
    if (this.TimerDelegate){
      clearInterval(this.TimerDelegate);
      this.TimerDelegate = undefined;
    }
    if (propagate && this.VidLoad){
      this.player.pauseVideo();
    }
  }

  SendSeek(){
    if (this.VidLoad){
      this.player.seekTo(this.TimerTime/1000, true);
    }
  }

  RefreshActiveEntry() {
    if (this.EntryList.length == 0){
      this.ActiveEntry = -1;
      return;
    }

    for(var i:number = 0; i < this.EntryList.length; i++) {
      if (this.EntryList[i].Stime > this.TimerTime) {
        this.ActiveEntry = i - 1;
        return;
      } else if (i == this.EntryList.length - 1) {
        this.ActiveEntry = i;
      }
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