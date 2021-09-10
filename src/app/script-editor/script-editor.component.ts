import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { TranslatorService } from '../services/translator.service';
import {  AccountService } from '../services/account.service';
import { faHome, faPause, faPlay, faStop, faLock, faUser } from '@fortawesome/free-solid-svg-icons';

class FullEntry {
  Stext: string = "";
  Stime: number = 0;
  CC: string | undefined;
  OC: string | undefined;
  key: string = "";
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
export class ScriptEditorComponent implements OnInit {
  @ViewChild('cardcontainer') cardcontainer !: ElementRef; 
  @ViewChild('TimeLine') Timeline !: ElementRef; 
  @ViewChild('loadstate') loadbutton!: ElementRef;
  LoginMode: boolean = false;
  SearchPass: string = "";
  status:string = "";

  //  DISPLAY VARIABLES
  EntryList: FullEntry[] = [];
  OT:number = 1;
  ChatProxy:HTMLIFrameElement | undefined;

  FFsize:number = 21;
  FStyle:string = "Ubuntu";
  TxAlign:CanvasTextAlign = "left";
  MaxDisplay = 30;
  BGColour:string = "#28282B";

  RoomNick: string = "";
  Token: string = "";
  
  //  TL VARIABLES
  TLEntry:FullEntry = ({
    Stext: "",
    Stime: 0,
    CC: undefined,
    OC: undefined,
    key: ""
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
  Synced: boolean = false;

  // TIMELINE VARIABLES
  TimelineDur: number = 3600;
  SecToPx: number = 2;

  constructor(
    private TGEnc: TsugeGushiService,
    private TLService: TranslatorService,
    private router: Router,
    private AccService: AccountService
  ) { }

  ngOnInit(): void {
    let test: string | null = localStorage.getItem("MChatToken");
    if (test != undefined) {
      try {
        let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
        this.RoomNick = TokenData["Room"];
        if (TokenData["Role"] == "TL") {
          this.AccService.CheckToken(TokenData["Room"], TokenData["Token"]).subscribe({
            error: error => {
              localStorage.removeItem("MChatToken");
            },
            next: data => {
              this.LoginMode = true;
              this.Token = TokenData["Token"];

              this.ProfileList.push({
                Name: 'Default',
                Prefix: '',
                Suffix: '',
                OC: undefined,
                CC: undefined
              });
            }
          });
        } else {
          this.router.navigate(['']);
        }
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }
    this.RerenderTimeline();
  }

  LoginRoom() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
    }, 1000);
    this.AccService.GetToken(this.RoomNick, this.SearchPass).subscribe({
      error: error => {
        setTimeout(() => {
        }, 2000);
        this.status = "WRONG PASSWORD/ROOM NAME";
        this.SearchPass = "";
        localStorage.removeItem("MChatToken");
      },
      next: data => {
        if (data.body[0]["Role"] == "TL") {
          localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
            Room: this.RoomNick,
            Token: data.body[0]["Token"],
            Role: "TL"
          })));

          location.reload();
        } else {
          this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
          this.SearchPass = "";
        }
      }
    });
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

  OpenEditEntry(idx : number):void {
    let test = this.EntryList[idx].CC;
    if (test != undefined){
      this.EditCC = '#' + test;
      this.EditCCheck = true;
    } else {
      this.EditCC = '#FFFFFF';
      this.EditCCheck = false;
    }

    test = this.EntryList[idx].OC;
    if (test != undefined){
      this.EditOC = '#' + test;  
      this.EditOCheck = true;    
    } else {
      this.EditOC = '#FFFFFF';
      this.EditOCheck = false;
    }
   
    this.EditText = this.EntryList[idx].Stext;
    this.EditKey = this.EntryList[idx].key;
    this.SetModalMenu(3);
  }

  SendEdit():void {
    if (this.EditCCheck){
      this.TLEntry.CC = this.EditCC.substr(1);
    } else {
      this.TLEntry.CC = undefined;
    }

    if (this.EditOCheck){
      this.TLEntry.OC = this.EditOC.substr(1); 
    } else {
      this.TLEntry.OC = undefined;
    }

    this.TLEntry.Stime = Date.now();

    this.UpdateEntry({
      Stext: this.EditText,
      Stime: 0,
      CC: this.TLEntry.CC,
      OC: this.TLEntry.OC,
      key: this.EditKey
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
      });
    }
    this.Synced = true;
    this.ModalMenu = 0;
  }

  UnSync():void {
    this.Synced = false;
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



  //-------------------------- TIMER CONTROL --------------------------
  StartTimer(propagate:boolean):void {
    if (!this.TimerDelegate){
      if (this.Synced){
        this.TimerTime = Math.round(this.player.getCurrentTime() * 1000);
      }
      this.TimerDelegate = setInterval(() => {
        this.TimerTime += 100;
      }, 100);
      if (propagate && this.Synced){
        this.player.playVideo();
      }
    }
  }

  StopTimer(propagate: boolean):void {
    if (this.TimerDelegate){
      if (this.Synced){
        this.TimerTime = Math.round(this.player.getCurrentTime() * 1000);
      }
      clearInterval(this.TimerDelegate);
      this.TimerDelegate = undefined;
      if (propagate && this.Synced){
        this.player.pauseVideo()
      }
    }
  }

  SendSeek(){
    if (this.Synced){
      this.player.seekTo(this.TimerTime, true);
    }
  }
  //========================== TIMER CONTROL ==========================



  //-------------------------- TL INPUT CONTROL --------------------------
  SaveProfile():void {
    if (this.CCcheck){
      this.ProfileList[this.SelectedProfile].CC = this.CCcolour;
    } else {
      this.ProfileList[this.SelectedProfile].CC = undefined;
    }

    if (this.OCcheck){
      this.ProfileList[this.SelectedProfile].OC = this.OCcolour; 
    } else {
      this.ProfileList[this.SelectedProfile].OC = undefined;
    }

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
    this.ShiftUp();
  }

  @HostListener('document:keydown.arrowdown', ['$event'])
  DownKeypress(event: KeyboardEvent):void {
    this.ShiftDown();
  }

  ShiftUp():void {
    this.SaveProfile();
    if (this.SelectedProfile == 0){
      this.SelectedProfile = this.ProfileList.length - 1;
    } else {
      this.SelectedProfile--;
    }
    this.LoadProfile();
  }

  ShiftDown():void {
    this.SaveProfile();
    if (this.SelectedProfile == this.ProfileList.length - 1){
        this.SelectedProfile = 0;
    } else {
      this.SelectedProfile++;
    }
    this.LoadProfile();
  }

  DeleteProfile():void {
    if (this.SelectedProfile != 0){
      this.ProfileList.splice(this.SelectedProfile, 1);
      this.SelectedProfile--;
    }
    this.LoadProfile();
  }

  AddProfile():void {
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
      if (this.CCcheck){
        this.TLEntry.CC = this.CCcolour.substr(1);
      } else {
        this.TLEntry.CC = undefined;
      }
  
      if (this.OCcheck){
        this.TLEntry.OC = this.OCcolour.substr(1); 
      } else {
        this.TLEntry.OC = undefined;
      }
  
      this.TLEntry.Stime = this.TimerTime;
  
      this.AddEntry({
        Stext: this.Prefix + this.TLEntry.Stext + this.Suffix,
        Stime: this.TLEntry.Stime,
        CC: this.TLEntry.CC,
        OC: this.TLEntry.OC,
        key: Date.now().toString()
      });
  
      this.TLEntry.Stext = "";
      setTimeout(() => {
        this.SpamBlock = false;
      }, 1000);
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
    if (this.EntryList.length == this.MaxDisplay){
      this.EntryList.shift();
    }

    this.EntryList.push(dt);
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



  //-------------------------- TIMELINE HANDLER --------------------------
  RerenderTimeline(){

  }
  //========================== TIMELINE HANDLER ==========================



  faUser = faUser;
  faLock = faLock;
  faHome = faHome;
  faStop = faStop;
  faPlay = faPlay;
  faPause = faPause;
}