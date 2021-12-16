import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { TranslatorService } from '../services/translator.service';
import { faHome, faPause, faPlay, faStop, faLock, faUser, faSearchPlus, faSearchMinus, faTimesCircle, faDownload, 
         faArrowLeft, faArrowRight, faEyeSlash, faShareAlt, faLink, faTags, faFileUpload, faWindowClose, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { AccountService } from '../services/account.service';
import { ArchiveService } from '../services/archive.service';
import Entries from '../models/Entries';

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
  Link:string = "";
  PassCheck:boolean = false;
  PassString:string = "";
  ArchiveTitle:string = "";
  ThirdPartySharing:boolean = true;
  Hidden:boolean = false;
  Downloadable:boolean = false;
  AuxLink:string[] = [];
}

class ArchiveLink {
  Nick: string = "";
  Link: string = "";
  StreamLink: string = "";
  Tags: string = "";
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
  @ViewChild('EntryTable') EntryTable !: ElementRef<HTMLTableElement>;
  LoginMode: boolean = false;

  /*
    1.Reload page
    2.Download
    3.Upload
  */
  LoginRedirect: number = 0;

  OpenOption: boolean = false;
  SearchPass: string = "";
  status:string = "";

  //  DISPLAY VARIABLES
  EntryList: FullEntry[] = [];
  FFsize:number = 15;
  BGColour:string = "#28282B";
  SelectedEntry: number = -1;

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

  AuxLinkInpt:string = "";

  //  TIMER VARIABLES
  TimerTime: number = 0;
  TimerDelegate: any | undefined = undefined;
  VidLoad: boolean = false;

  ModalNotif:boolean = false;
  NotifText:string = "";

  constructor(
    private TGEnc: TsugeGushiService,
    private TLService: TranslatorService,
    private AccService: AccountService,
    private AService: ArchiveService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  WinWidth: number = window.innerWidth;
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.WinWidth = window.innerWidth;
  }


  InnerResize(wait: number | undefined = undefined):void {
    if (this.TableHeightRef) {
      if (wait) {
        setTimeout(() => {
          this.TableHeight = window.innerHeight - this.HeroFoot.nativeElement.offsetHeight - this.HeroHead.nativeElement.offsetHeight - 27; 
        }, wait);
      } else {
        this.TableHeight = window.innerHeight - this.HeroFoot.nativeElement.offsetHeight - this.HeroHead.nativeElement.offsetHeight - 27;
      }
    }
    this.RerenderTimeline();
  }

  ngAfterViewInit(): void {
    this.InnerResize(300);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      let test: string | null = localStorage.getItem("MChatToken");

      if (test != undefined) {
        try {
          let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
          if (TokenData["Role"] == "TL") {
            this.AccService.CheckToken(TokenData["Room"], TokenData["Token"]).subscribe({
              error: error => {
                localStorage.removeItem("MChatToken");
                if (params.archive){
                  this.LoginRedirect = 1;
                  this.ModalMenu = 11;
                }
              },
              next: data => {
                this.LoginMode = true;
                this.Token = TokenData["Token"];
                this.RoomNick = TokenData["Room"];
                this.InitAutoSave();

                if (params.archive) {
                  this.LoadParseArchive(params.archive);
                }
              }
            });
          } else {
            this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
          }
        } catch (error) {
          localStorage.removeItem("MChatToken");
        }
      } else if (params.archive) {
        this.LoginRedirect = 1;
        this.ModalMenu = 11;
        this.SearchPass = "";
      }
  
      this.ProfileList.push({
        Name: 'Default',
        Prefix: '',
        Suffix: '',
        OC: undefined,
        CC: undefined
      });
    });
  }

  AddAuxLink(): void {
    if (this.AuxLinkInpt.trim() != "") {
      this.TempSetting.AuxLink.push(this.AuxLinkInpt);
      this.AuxLinkInpt = "";
    }
  }

  LoadParseArchive(ArchiveLink: string) {
    this.AService.GetOneArchiveInfo(this.RoomNick, this.Token, ArchiveLink).subscribe({
      next: data => {
        if (data.body == "") {
          this.ModalNotif = true;
          this.NotifText = "FAILED LOADING ARCHIVE " + ArchiveLink;
          this.router.navigate(['/ScriptEditor', { }]);
        } else {
          const dt = JSON.parse(data.body);
          if (!dt["AuxLink"]){
            dt["AuxLink"] = [];
          }

          this.SavedSetting = {
            Link: dt["Link"],
            StreamLink: dt["StreamLink"],
            Tags: dt["Tags"],
            Notes: dt["Note"],
            PassCheck: dt["Pass"],
            PassString: "",
            ArchiveTitle: dt["Nick"],
            ThirdPartySharing: dt["ExtShare"],
            Hidden: dt["Hidden"],
            Downloadable: dt["Downloadable"],
            AuxLink: dt["AuxLink"]
          };
          this.TempSetting = this.SavedSetting;
          this.LoadVideo();
  
          this.AService.GetOneArchive(this.RoomNick, this.Token, ArchiveLink).subscribe(
            (response: any) => {
              if (response.status != 200) {
                this.ModalNotif = true;
                this.NotifText = "FAILED LOADING ARCHIVE " + ArchiveLink;
                this.router.navigate(['/ScriptEditor', { }]);
              } else {
                this.Entriesdt = JSON.parse(response.body);
                this.EntriesParser();
              }
          });
        }
      },
      error: err => {
        this.ModalNotif = true;
        this.NotifText = "FAILED LOADING ARCHIVE " + ArchiveLink;
        this.router.navigate(['/ScriptEditor', { }]);
      }
    });
  }

  EntriesParser(): void {
    this.EntryList = [];
    this.ProfileList = [];
    this.ProfileList.push({
      Name: 'Default',
      Prefix: '',
      Suffix: '',
      OC: undefined,
      CC: undefined
    });

    var CutOff:number = 0;

    if (this.Entriesdt.length > 0){
      if (this.Entriesdt[0].Stime > 1000*60*20){
        CutOff = this.Entriesdt[0].Stime;
      }
    }

    for (let i = 0; i < this.Entriesdt.length; i++) {
      let PIdx = -1;

      if (!this.Entriesdt[i].CC || !this.Entriesdt[i].OC) {
        PIdx = 0;
      } else {
        for (let j = 0; j < this.ProfileList.length; j++){
          if ((this.ProfileList[j].CC == '#' + this.Entriesdt[i].CC?.toString()) && (this.ProfileList[j].OC == '#' + this.Entriesdt[i].OC?.toString())){
            PIdx = j; 
            break;
          }
        }

        if (PIdx == -1){
          PIdx = this.ProfileList.length;
          this.ProfileList.push({
            Name: 'Profile' + PIdx.toString(),
            Prefix: '',
            Suffix: '',
            OC: '#' + this.Entriesdt[i].OC,
            CC: '#' + this.Entriesdt[i].CC
          })
        }
      }

      if (i != this.Entriesdt.length - 1){
        var a = this.Entriesdt[i].Stext;
        if (a != undefined){
          this.EntryList.push({
            Stext: a,
            Stime: this.Entriesdt[i].Stime - CutOff,
            Prfidx: PIdx,
            key: "",
            End: this.Entriesdt[i + 1].Stime - CutOff
          });
        }
      } else {
        var a = this.Entriesdt[i].Stext;
        if (a != undefined){
          this.EntryList.push({
            Stext: a,
            Stime: this.Entriesdt[i].Stime - CutOff,
            Prfidx: PIdx,
            key: "",
            End: this.Entriesdt[i].Stime + 5000 - CutOff
          });  
        }

        this.Entriesdt = [];
        this.ProfileTempContainer = [];
        this.ReloadDisplayCards();
      }
    }
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

            this.Token = data.body[0]["Token"];
            this.LoginMode = true;

            switch (this.LoginRedirect) {
              case 1:
                location.reload();
                break;
            
              case 2:
                this.SetModalMenu(9);
                break;

              case 3:
                this.SetModalMenu(5);
                break;
              
              case 4:
                this.ModalMenu = 0;
                break;
            }

            this.InitAutoSave();
            this.LoginRedirect = 0;            
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
  DBScriptPage: number = 1;
  DBScriptLength: number = 0;

  TargetFile: File | null = null;
  filename: string = "No file uploaded";

  ModalMenu:number = 0;
  Processing: boolean = false;
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
    Hidden: false,
    Link: "",
    Downloadable: false,
    AuxLink: []
  };

  SavedSetting: ArchiveSetting = {
    StreamLink: "",
    Tags: "",
    Notes: "",
    PassCheck: false,
    PassString: "",
    ArchiveTitle: "",
    ThirdPartySharing: true,
    Hidden: false,
    Link: "",
    Downloadable: false,
    AuxLink: []
  };

  SetModalMenu(idx: number):void {
    if (idx == 10) {
      if (this.SelectedProfile == 0) {
        return;
      }
    }

    switch (idx) {
      case 1:
        this.ProfileName = "";        
        this.ModalMenu = idx;
        break;

      case 4:
        this.UnSync();
        this.TargetVideoFile = null;
        this.LoadLocalVideo = false;
        this.ModalMenu = idx;
        break;
      
      case 5:
        if (this.LoginMode){
          if (this.SavedSetting.Link != "") {
            this.AService.GetOneArchiveInfo(this.RoomNick, this.Token, this.SavedSetting.Link).subscribe({
              next: data => {
                if (data.body == "") {
                  this.status = "Can't find preexisting archive.";
                  this.UploadNew = true;
                  this.LockUploadNew = true;
                  this.ModalMenu = idx;
                  this.TempSetting = this.SavedSetting;
                  this.TempSetting.ArchiveTitle = "";
                } else {
                  const dt = JSON.parse(data.body);

                  if (!dt["AuxLink"]) {
                    dt["AuxLink"] = [];
                  }

                  this.SavedSetting = {
                    Link: dt["Link"],
                    StreamLink: dt["StreamLink"],
                    Tags: dt["Tags"],
                    Notes: dt["Note"],
                    PassCheck: dt["Pass"],
                    PassString: "",
                    ArchiveTitle: dt["Nick"],
                    ThirdPartySharing: dt["ExtShare"],
                    Hidden: dt["Hidden"],
                    Downloadable: dt["Downloadable"],
                    AuxLink: dt["AuxLink"]
                  };
                  this.TempSetting = this.SavedSetting;
                  this.ModalMenu = idx;
                  this.UploadNew = false;
                  this.status = "";
                  this.LockUploadNew = false;
                }
              },
              error: err => {
                this.SearchPass = "";
                this.status = "access to server denied";
                this.ModalMenu = 11;
                this.LoginRedirect = 3;
              }
            });
          } else {
            this.status = "Can't find preexisting archive.";
            this.UploadNew = true;
            this.LockUploadNew = true;
            this.ModalMenu = idx;
            this.TempSetting = this.SavedSetting;
            this.TempSetting.ArchiveTitle = "";
          }
        } else {
          this.status = "";
          this.SearchPass = "";
          this.ModalMenu = 11;
          this.LoginRedirect = 3;
        }
        break;

      case 9:
        if (this.LoginMode){
          this.ModalMenu = idx;
          this.DBScriptPage = 1;
          this.DBScriptSelectedIndex = 0;
          this.FetchDBScriptList();
        } else {
          this.SearchPass = "";
          this.ModalMenu = 11;
          this.LoginRedirect = 2;
        }
        break;
      
      case 12:
        this.TimeShift = 0;
        this.ShiftFirst = true;
        this.ModalMenu = idx;
        break;

      default:
        this.ModalMenu = idx;
        break;
    }
  }

  Logout(RedirectMode: number): void {
    this.AutoSave(true);
    if (this.AutoSaveTimer) {
      clearInterval(this.AutoSaveTimer);
    }

    this.AutoSaveMode = false;
    this.LoginMode = false;
    this.Token = "";
    this.RoomNick = "";
    this.status = "";
    localStorage.removeItem("MChatToken");
    this.SearchPass = "";
    this.ModalMenu = 11;
    this.LoginRedirect = RedirectMode;
  }

  SaveArchiveSetting():void {
    if (this.LoginMode && (this.RoomNick != "") && (this.Token != "") && (this.SavedSetting.Link != "")) {
      if (!this.Processing) {
        this.status = "Updating...";
        this.Processing = true;
        if (this.RoomNick != undefined) {
          this.AService.EditArchive(this.RoomNick, this.Token, this.TempSetting.Link, this.TempSetting.ArchiveTitle, this.TempSetting.Hidden, 
            this.TempSetting.ThirdPartySharing, this.TempSetting.Tags, this.TempSetting.PassCheck, this.TempSetting.PassString, 
            this.TempSetting.StreamLink, this.TempSetting.Notes, this.TempSetting.Downloadable, this.TempSetting.AuxLink).subscribe({
            error: error => {
              this.status = error["error"];
              this.Processing = false;
  
              if (error["error"] == "ERROR : INVALID TOKEN") {
                localStorage.removeItem("MChatToken");
                location.reload();
              }
            },
            next: data => {
              this.status = "Updated!! Updating local setting...";
              this.SavedSetting = this.TempSetting;
              setTimeout(() => {
                this.status = "";
                this.Processing = false;
                this.ModalMenu = 0;
              }, 2000);
            }
          });
        } else {
          this.SavedSetting = this.TempSetting;
          localStorage.setItem("MChatSessionSetting", JSON.stringify(this.TempSetting));
          this.status = "";
          this.ModalMenu = 0;
        }
      }
    } else {
      this.SavedSetting = this.TempSetting;
    }
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

  NewScript(): void {
    this.ModalMenu = 0;
    this.EntryList = [];
    this.BarCount = 0;
    this.TimeCardIdx = [];
    this.XtraMargin = 0;
    this.TimerTime = 0;
    this.SelectedEntry = -1;
    if (this.TimerDelegate) {
      clearInterval(this.TimerDelegate);
      this.TimerDelegate = undefined;
    }
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }
    if (this.AutoSaveTimer) {
      clearInterval(this.AutoSaveTimer);
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
      Hidden: false,
      Link: "",
      Downloadable: false,
      AuxLink: []
    };

    this.TempSetting = this.SavedSetting;

    this.ProfileList = [{
      Name: 'Default',
      Prefix: '',
      Suffix: '',
      OC: undefined,
      CC: undefined
    }];  

    localStorage.removeItem("MChatSessionSetting");
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

  DownloadScript() {
    this.LoadParseArchive(this.DBScriptList[this.DBScriptSelectedIndex].Link);
    this.ModalMenu = 0;
  }

  FetchDBScriptList(){
    this.DBScriptSelectedIndex = -1;
    this.DBScriptList = [];
    this.AService.GetAllArchive(this.RoomNick, this.Token, this.DBScriptPage).subscribe(
      (response) => {
        var dt = JSON.parse(response.body);
        this.DBScriptLength = dt.Total;

        dt.Data.map((e: any) => {
          this.DBScriptList.push({
            Link: e.Link,
            Nick: e.Nick,
            Tags: e.Tags,
            StreamLink: e.StreamLink
          });
        });
      });
  }

  PrevPage(): void {
    if (this.DBScriptPage > 1){
      this.DBScriptPage--;
      this.FetchDBScriptList();
    }
  }

  NextPage(): void {
    this.DBScriptPage++;
    this.FetchDBScriptList();
  }

  //========================== AUX CONTROL ==========================



  //---------------------- TIME SHIFT MODULE ----------------------
  TimeShift:number = 0;
  ShiftFirst: boolean = false;

  SetAsStart() {
    const idx: number = this.SelectedEntry;
    const timestart: number = this.EntryList[idx].Stime;
    this.SelectedEntry = -1;
    this.TimeCardIdx = [];
    this.EntryList = this.EntryList.slice(idx);
    
    for (let i = 0; i < this.EntryList.length; i++) {
      this.EntryList[i].Stime -= timestart;
      this.EntryList[i].End -= timestart;
      if (i == this.EntryList.length - 1){
        this.ReloadDisplayCards();
      }
    }
    

    this.ModalMenu = 0;
  }

  TimeShiftAll(){
    this.ModalMenu = 0;
    if (this.ShiftFirst) {
      if (this.EntryList.length > 0) {
        if (this.EntryList[0].Stime + this.TimeShift >= 0) {
          for (let i = 0; i < this.EntryList.length; i++) {
            this.EntryList[i].Stime += this.TimeShift;
            this.EntryList[i].End += this.TimeShift;
            if (i == this.EntryList.length - 1) {
              this.ReloadDisplayCards();
            }
          }
        }
      }
    } else {
      if (this.EntryList.length > 1) {
        if (this.EntryList[1].Stime + this.TimeShift >= 0) {
          for (let i = 1; i < this.EntryList.length; i++) {
            this.EntryList[i].Stime += this.TimeShift;
            this.EntryList[i].End += this.TimeShift;
            if (i == this.EntryList.length - 1) {
              this.ReloadDisplayCards();
            }
          }
        }
      }
    }
  }
  //====================== TIME SHIFT MODULE ======================


  //------------------------------------- UPLOAD MODULE AUX -------------------------------------
  UploadNew: boolean = false;
  LockUploadNew: boolean = false;

  UploadData():void {
    if (this.UploadNew) {
      if (!this.Processing) {
        this.Processing = true;
        this.status = "Uploading..."
        let d = new Date();
        this.TempSetting.Link = this.RoomNick + "_" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
  
        if (this.TempSetting.ArchiveTitle == "") {
          this.TempSetting.ArchiveTitle = this.TempSetting.Link;
        }
  
        this.AService.AddArchive(this.RoomNick, this.Token, this.TempSetting.ArchiveTitle, this.TempSetting.Link, this.TempSetting.Hidden, 
          this.TempSetting.ThirdPartySharing, this.TempSetting.Tags, this.TempSetting.PassCheck, this.TempSetting.PassString, this.TempSetting.StreamLink, 
          JSON.stringify(this.EntryList.map(e => {
            return ({
              Stext: e.Stext,
              Stime: e.Stime,
              CC: this.ProfileList[e.Prfidx].CC?.slice(1),
              OC: this.ProfileList[e.Prfidx].OC?.slice(1)
            })
          })), this.TempSetting.Notes, this.TempSetting.Downloadable, this.TempSetting.AuxLink).subscribe({
          error: error => {
            this.status = error["error"];
            this.Processing = false;
          },
          next: data => {
            this.status = "Uploaded!!...";
            this.SavedSetting = this.TempSetting;
  
            setTimeout(() => {
              this.status = "";
              this.Processing = false;
              this.ModalMenu = 0;
            }, 2000);
          }
        });
      }
    } else {
      if (!this.Processing) {
        this.Processing = true;
        this.status = "Uploading..."
  
        this.AService.UpdateArchive(this.RoomNick, this.Token, this.SavedSetting.Link, 
          JSON.stringify(this.EntryList.map(e => {
            return ({
              Stext: e.Stext,
              Stime: e.Stime,
              CC: this.ProfileList[e.Prfidx].CC?.slice(1),
              OC: this.ProfileList[e.Prfidx].OC?.slice(1)
            })
          }))).subscribe({
          error: error => {
            this.status = error["error"];
            this.Processing = false;
          },
  
          next: data => {
            this.status = "Uploaded!!...";
  
            setTimeout(() => {
              this.status = "";
              this.Processing = false;
              this.ModalMenu = 0;
            }, 2000);
          }
        });
      }
    }
  }
  //------------------------------------- UPLOAD MODULE AUX -------------------------------------



  //------------------------------------- UPLOAD MODULES -------------------------------------
  FileParsed: boolean = false;
  Entriesdt: Entries[] = [];
  ProfileTempContainer: Profile[] = [];

  ImportFile(): void {
    this.ModalMenu = 0;
    this.NewScript();
    this.ProfileTempContainer.unshift({
      Name: 'Default',
      Prefix: '',
      Suffix: '',
      OC: undefined,
      CC: undefined
    });
    this.ProfileList = this.ProfileTempContainer;
    this.EntriesParser();
  }

  OpenUploadModal(): void {
    this.ModalMenu = 7;
    this.status = "";
    this.Entriesdt = [];
    this.ProfileTempContainer = [];
    this.filename = "No file uploaded";
    this.TargetFile = null;
    this.FileParsed = false;
  }

  StringifyTime(TimeStamp: number, mode: boolean): string {
    let Timestring: string = "";
    let Stime: number = 0;
    let SString: string = "";

    Stime = Math.floor(TimeStamp / 3600000);
    SString = Stime.toString();
    if (SString.length < 2) {
      SString = "0" + SString;
    }
    Timestring += SString + ":";
    TimeStamp -= Stime * 3600000;

    Stime = Math.floor(TimeStamp / 60000);
    SString = Stime.toString();
    if (SString.length < 2) {
      SString = "0" + SString;
    }
    Timestring += SString + ":";
    TimeStamp -= Stime * 60000;

    Stime = Math.floor(TimeStamp / 1000);
    SString = Stime.toString();
    if (SString.length < 2) {
      SString = "0" + SString;
    }
    Timestring += SString;
    TimeStamp -= Stime * 1000;

    if (mode) {
      Timestring += ",";
    } else {
      Timestring += ".";
    }
    Timestring += TimeStamp.toString();

    return (Timestring);
  }

  CheckTimeString(teststring: string): boolean {
    let Timesplit: string[] = teststring.split(":");
    if (Timesplit.length != 3) {
      return (false);
    }

    if (Number.parseInt(Timesplit[0]) == NaN) {
      return (false);
    }

    if ((Number.parseInt(Timesplit[1]) == NaN) || (Number.parseInt(Timesplit[1]) > 60)) {
      return (false);
    }

    Timesplit = Timesplit[2].split(",");

    if (Timesplit.length != 2) {
      return (false);
    }

    if ((Number.parseInt(Timesplit[0]) == NaN) || (Number.parseInt(Timesplit[0]) > 60)) {
      return (false);
    }

    if ((Number.parseInt(Timesplit[1]) == NaN) || (Number.parseInt(Timesplit[1]) > 1000)) {
      return (false);
    }

    return (true);
  }

  SRTTimeCheck(timestring: string): boolean {
    if (timestring.split("-->").length != 2) {
      return (false);
    } else if ((this.CheckTimeString(timestring.split("-->")[0].trim())) && (this.CheckTimeString(timestring.split("-->")[1].trim()))) {
      return (true);
    } else {
      return (false);
    }
  }

  ParseTimeString(TargetString: string): number {
    let res: number = 0;
    let Timesplit: string[] = TargetString.split(":");

    res += Number.parseInt(Timesplit[0]) * 3600000 + Number.parseInt(Timesplit[1]) * 60000;
    Timesplit = Timesplit[2].split(",");
    res += Number.parseInt(Timesplit[0]) * 1000 + Number.parseInt(Timesplit[1]);

    return (res);
  }

  FileChange(e: Event) {
    let ef = (e.target as HTMLInputElement);
    if (ef.files != null) {
      this.filename = ef.files[0].name;
      this.TargetFile = ef.files[0];
    }
    this.ParseFile();
  }

  ParseFile() {
    this.FileParsed = false;
    this.status = "PARSING FILE";
    this.Entriesdt = [];
    this.ProfileTempContainer = [];
    const reader = new FileReader();
    reader.onload = (e) => {
      if ((reader.result != null) && (this.TargetFile != null)) {
        let mode: number = -1;
        if (this.TargetFile.name.search(/.ass/gi) != -1) {
          mode = 0;
        } else if (this.TargetFile.name.search(/.ttml/gi) != -1) {
          mode = 1;
        } else if (this.TargetFile.name.search(/.srt/gi) != -1) {
          mode = 2;
        }

        if (mode == -1) {
          this.status = "UNABLE TO PARSE (UNRECOGNIZED FILE EXTENSION)";
        } else {
          switch (mode) {
            case 0:
              this.ParseAss(reader.result.toString());
              break;
            case 1:
              this.ParseTTML(reader.result.toString());
              break;
            case 2:
              this.ParseSRT(reader.result.toString());
              break;
          }

        }

      }
    }

    if (this.TargetFile != null) {
      reader.readAsText(this.TargetFile);
    }
  }

  ParseAss(Feed: string): void {
    let res: string[] = Feed.split("\n");
    let fail: Boolean = true;

    for (let index: number = 0; index < res.length; index++) {
      if (res[index].search(/\[V4\+ Styles\]/gi) != -1) {
        if (res[++index].search(/Format:/gi) != -1) {
          let Linesplit = res[index].split(":")[1].split(",");
          let LocationIndex: number[] = [];
          let DataLength = Linesplit.length;

          for (let index2: number = 0; index2 < Linesplit.length; index2++) {
            if (Linesplit[index2].trim() == "Name") {
              LocationIndex.push(index2);
            } else if (Linesplit[index2].trim() == "PrimaryColour") {
              LocationIndex.push(index2);
            } else if (Linesplit[index2].trim() == "OutlineColour") {
              LocationIndex.push(index2);
            }
          }

          if (LocationIndex.length == 3) {
            fail = false;
            for (index++; index < res.length; index++) {
              if (res[index].search(/Style/gi) != -1) {
                Linesplit = res[index].split(":")[1].split(",");
                if (Linesplit.length == DataLength) {
                  if ((Linesplit[LocationIndex[1]].length == 10) && (Linesplit[LocationIndex[2]].length == 10)) {
                    this.ProfileTempContainer.push({
                      Name: Linesplit[LocationIndex[0]].trim(),
                      Prefix: "",
                      Suffix: "",
                      CC: Linesplit[LocationIndex[1]].trim().substr(8, 2) + Linesplit[LocationIndex[1]].trim().substr(6, 2) + Linesplit[LocationIndex[1]].trim().substr(4, 2),
                      OC: Linesplit[LocationIndex[2]].trim().substr(8, 2) + Linesplit[LocationIndex[2]].trim().substr(6, 2) + Linesplit[LocationIndex[2]].trim().substr(4, 2)
                    });
                  } else {
                    fail = true;
                    index = res.length;
                    //this.status = "ERROR5";
                  }
                } else {
                  fail = true;
                  index = res.length;
                  //this.status = "ERROR4";
                }
              } else {
                index = res.length;
              }
            }
          } else {
            //this.status = "ERROR2";
            index = res.length;
          }
        } else {
          //this.status = "ERROR1";
          index = res.length;
        }
      }
    }

    if (fail) {
      this.status = "UNABLE TO PARSE THE FILE (FILE CORRUPTED?)";
      return (undefined);
    } else {
      fail = true;
    }

    for (let index: number = 0; index < res.length; index++) {
      if (res[index].search(/\[Events\]/gi) != -1) {
        if (res[++index].search(/Format:/gi) != -1) {
          let Linesplit = res[index].split(":")[1].split(",");
          let LocationIndex: number[] = [];
          let DataLength = Linesplit.length;

          for (let index2: number = 0; index2 < Linesplit.length; index2++) {
            if (Linesplit[index2].trim() == "Start") {
              LocationIndex.push(index2);
            } else if (Linesplit[index2].trim() == "Style") {
              LocationIndex.push(index2);
            } else if (Linesplit[index2].trim() == "Text") {
              LocationIndex.push(index2);
            }
          }

          if (LocationIndex.length == 3) {
            fail = false;
            for (index++; index < res.length; index++) {
              if (res[index].search(/Dialogue/gi) != -1) {
                Linesplit = res[index].split("Dialogue:")[1].split(",");
                if (Linesplit.length >= DataLength) {
                  for (let index2 = 0; index2 < this.ProfileTempContainer.length; index2++) {
                    if (Linesplit[LocationIndex[1]].trim() == this.ProfileTempContainer[index2].Name) {
                      let Textsend: string = Linesplit[LocationIndex[2]];
                      for (let z = LocationIndex[2] + 1; z < Linesplit.length; z++) {
                        Textsend += "," + Linesplit[z];
                      }

                      let TimeSplit: string[] = Linesplit[LocationIndex[0]].trim().split(":");
                      let msshift: string = TimeSplit[2].split(".")[1];
                      if (msshift.length == 2) {
                        msshift += "0";
                      } else if (msshift.length == 1){
                        msshift += "00";
                      }

                      this.Entriesdt.push({
                        Stext: Textsend,
                        Stime: Number.parseInt(TimeSplit[0]) * 60*60*1000 + Number.parseInt(TimeSplit[1]) * 60*1000 + Number.parseInt(TimeSplit[2].split(".")[0]) * 1000 + Number.parseInt(msshift),
                        CC: this.ProfileTempContainer[index2].CC,
                        OC: this.ProfileTempContainer[index2].OC
                      });
                      break;
                    }
                  }
                } else {
                  index = res.length;
                  //this.status = "ERROR4";
                }
              } else {
                index = res.length;
              }
            }
          } else {
            index = res.length;
            //this.status = "ERROR2";
          }
        } else {
          index = res.length;
          //this.status = "ERROR1";
        }
      }
    }

    if (fail) {
      this.status = "UNABLE TO PARSE THE FILE (FILE CORRUPTED?)";
    } else {
      this.status = "ASS file, " + this.ProfileTempContainer.length.toString() + " colour profiles, " + this.Entriesdt.length.toString() + " Entries.";

      this.FileParsed = true;
      /*
      this.status = "";
      for(let index:number = 0; index < this.this.Entriesdt.length; index++){
        this.status += this.this.Entriesdt[index].Stext + " " + this.this.Entriesdt[index].Time + " " + this.this.Entriesdt[index].CC + " " + this.this.Entriesdt[index].OC + " | ";
      }
      */
    }
  }

  ParseSRT(Feed: string): void {
    let res: string[] = Feed.split("\n");
    var write: boolean = false;

    for (let index: number = 0; index < res.length; index++) {
      if (this.SRTTimeCheck(res[index])) {
        let Timestamp: number = this.ParseTimeString(res[index].split("-->")[0].trim());
        let SText: string = "";
        write = true;

        for (index++; index < res.length; index++) {
          if (this.SRTTimeCheck(res[index])) {
            index--;
            write = false;
            this.Entriesdt.push({
              Stext: SText,
              Stime: Timestamp,
              CC: undefined,
              OC: undefined
            });
            break;
          } else if (res[index] == "") {
            write = false;
            this.Entriesdt.push({
              Stext: SText,
              Stime: Timestamp,
              CC: undefined,
              OC: undefined
            });
            break;
          } else if (index == res.length - 1) {
            if (res[index].trim() != "") {
              SText += res[index];
            }
            write = false;
            this.Entriesdt.push({
              Stext: SText,
              Stime: Timestamp,
              CC: undefined,
              OC: undefined
            });
            break;
          } else {
            if (res[index].trim() != "") {
              if (write == true) {
                if (SText != "") {
                  SText += " ";
                }
                SText += res[index];
              }
            } else {
              write = false;
            }
          }
        }
      }

      if (index == res.length - 1) {
        this.status = "SRT file, " + this.Entriesdt.length.toString() + " Entries.";

        this.FileParsed = true;
      }
    }
  }

  ParseTTML(Feed: string): void {
    let fail: Boolean = true;

    if ((Feed.indexOf("<head>") != - 1) && (Feed.indexOf("<\/head>") != -1)) {
      let startindex: number = Feed.indexOf("<head>");
      let endindex: number = Feed.indexOf("<\/head>");

      fail = false;

      for (let PenStart: number = Feed.indexOf("<pen", startindex); PenStart < endindex; PenStart = Feed.indexOf("<pen", PenStart)) {
        if (PenStart == -1) {
          break;
        }

        let Penend: number = Feed.indexOf(">", PenStart);
        let target: number = -1;
        let endtarget: number = -1;
        let profilecontainer: Profile = {
          Name: "",
          Prefix: "",
          Suffix: "",
          CC: "",
          OC: ""
        };

        if ((Penend > endindex) || (Penend == -1)) {
          fail = true;
          break;
        }

        target = Feed.indexOf("id=\"", PenStart);
        if ((target > Penend) || (target == -1)) {
          fail = true;
          break;
        }
        endtarget = Feed.indexOf("\"", target + 4);
        if ((endtarget > Penend) || (endtarget == -1)) {
          fail = true;
          break;
        }
        profilecontainer.Name = Feed.substring(target + 4, endtarget);

        target = Feed.indexOf("fc=\"", PenStart);
        if ((target == -1) || (target > Penend)) {
          profilecontainer.CC = "#FFFFFF";
        } else {
          endtarget = Feed.indexOf("\"", target + 5);
          if ((endtarget > Penend) || (endtarget == -1)) {
            fail = true;
            break;
          }
          profilecontainer.CC = Feed.substring(target + 5, endtarget);
        }

        target = Feed.indexOf("ec=\"", PenStart);
        if ((target == -1) || (target > Penend)) {
          profilecontainer.OC = "#000000";
        } else {
          endtarget = Feed.indexOf("\"", target + 5);
          if ((endtarget > Penend) || (endtarget == -1)) {
            fail = true;
            break;
          }
          profilecontainer.OC = Feed.substring(target + 5, endtarget);
        }

        this.ProfileTempContainer.push(profilecontainer);
        PenStart = Penend;
      }
    }

    if (fail) {
      //this.status = "UNABLE TO PARSE THE FILE (FILE CORRUPTED?)";
      return (undefined);
    } else {
      fail = true;
    }

    if ((Feed.indexOf("<body>") != - 1) && (Feed.indexOf("<\/body>") != -1)) {
      let startindex: number = Feed.indexOf("<body>");
      let endindex: number = Feed.indexOf("<\/body>");
      let EntryContainer: Entries = {
        Stext: "",
        Stime: 0,
        CC: undefined,
        OC: undefined
      };

      fail = false;

      for (let PStart: number = Feed.indexOf("<p", startindex); PStart < endindex; PStart = Feed.indexOf("<p", PStart)) {
        if (PStart == -1) {
          break;
        }

        let PEnd: number = Feed.indexOf("</p>", PStart);

        if ((PEnd > endindex) || (PEnd == -1)) {
          fail = true;
          break;
        }

        let StartClosure: number = -1;
        let EndClosure: number = -1;
        let target: number = -1;
        let endtarget: number = -1;

        //  GET TIME
        StartClosure = PStart;
        EndClosure = Feed.indexOf(">", StartClosure);
        if ((EndClosure == -1) || (EndClosure > PEnd)) {
          fail = true;
          break;
        }

        target = Feed.indexOf("t=\"", StartClosure);
        if ((target > EndClosure) || (target == -1)) {
          fail = true;
          break;
        }
        endtarget = Feed.indexOf("\"", target + 3);
        if ((endtarget > EndClosure) || (endtarget == -1)) {
          fail = true;
          break;
        }

        if (isNaN(Number.parseInt(Feed.substring(target + 3, endtarget)))) {
          fail = true;
          break;
        } else {
          if (EntryContainer.Stime != Number.parseInt(Feed.substring(target + 3, endtarget))) {
            EntryContainer.Stime = Number.parseInt(Feed.substring(target + 3, endtarget));

            // LOOK FOR NON EMPTY SPAN
            StartClosure = EndClosure;
            for (StartClosure = Feed.indexOf("<s", StartClosure); StartClosure < PEnd; StartClosure = Feed.indexOf("<s", StartClosure)) {
              if (StartClosure == -1) {
                break;
              }

              EndClosure = Feed.indexOf(">", StartClosure);
              if ((EndClosure == -1) || (EndClosure > PEnd)) {
                PStart = endindex;
                fail = true;
                break;
              }

              let SpanEnd: number = Feed.indexOf("</s>", EndClosure);
              if ((SpanEnd == -1) || (SpanEnd > PEnd)) {
                PStart = endindex;
                fail = true;
                break;
              }

              if (Feed.substring(EndClosure + 1, SpanEnd).trim().length > 1) {
                EntryContainer.Stext = Feed.substring(EndClosure + 1, SpanEnd).trim();

                target = Feed.indexOf("p=\"", StartClosure);
                if ((target > EndClosure) || (target == -1)) {
                  fail = true;
                  break;
                }
                endtarget = Feed.indexOf("\"", target + 3);
                if ((endtarget > EndClosure) || (endtarget == -1)) {
                  fail = true;
                  break;
                }

                for (let i: number = 0; i < this.ProfileTempContainer.length; i++) {
                  if (this.ProfileTempContainer[i].Name == Feed.substring(target + 3, endtarget)) {
                    this.Entriesdt.push({
                      Stext: Feed.substring(EndClosure + 1, SpanEnd).trim(),
                      Stime: EntryContainer.Stime,
                      CC: this.ProfileTempContainer[i].CC,
                      OC: this.ProfileTempContainer[i].OC
                    });
                    EndClosure = PEnd;
                    break;
                  }
                }
              }
              StartClosure = EndClosure;
            }

          }
        }

        if (PStart != endindex) {
          PStart = PEnd;
        }
      }
    }

    if (fail) {
      this.status = "UNABLE TO PARSE THE FILE (FILE CORRUPTED?)";
    } else {
      this.status = "TTML file, " + this.ProfileTempContainer.length.toString() + " colour profiles, " + this.Entriesdt.length.toString() + " Entries.";

      this.FileParsed = true;
      /*
      this.status = this.this.Entriesdt.length.toString() + " = ";
      for(let index:number = 0; index < this.this.Entriesdt.length; index++){
        this.status += this.this.Entriesdt[index].Stext + " " + this.this.Entriesdt[index].Time + " " + this.this.Entriesdt[index].CC + " " + this.this.Entriesdt[index].OC + " | ";
      }
      */
    }
  }
  //===================================== UPLOAD MODULES =====================================



  //------------------------------------- EXPORT MODULES -------------------------------------
  ExportSrt(): void {
    var WriteStream = "";

    for (let i: number = 0; i < this.EntryList.length; i++) {
      WriteStream += (i + 1).toString() + "\n";
      WriteStream += this.StringifyTime(this.EntryList[i].Stime - this.EntryList[0].Stime, true) + " --> ";
      if (i == this.EntryList.length - 1) {
        WriteStream += this.StringifyTime(this.EntryList[i].Stime + 3000 - this.EntryList[0].Stime, true) + "\n";
      } else {
        WriteStream += this.StringifyTime(this.EntryList[i + 1].Stime - this.EntryList[0].Stime, true) + "\n";
      }
      WriteStream += this.EntryList[i].Stext + "\n\n";
    }

    const blob = new Blob([WriteStream], { type: 'text/plain' });

    if (this.SavedSetting.ArchiveTitle == "") {
      let d = new Date();
      this.SavedSetting.ArchiveTitle = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();

      if (this.RoomNick != "") {
        this.SavedSetting.ArchiveTitle = this.RoomNick + "_" + this.SavedSetting.ArchiveTitle;
      }
    }

    saveAs(blob, this.SavedSetting.ArchiveTitle + ".srt");
    this.status = "Generated file " + this.SavedSetting.ArchiveTitle + ".srt ( " + this.EntryList.length.toString() + " Entries)";  
  }

  ExportAss(): void {
    var WriteStream = "";
    let ProfileName: string[] = [];
    let ProfileData: (string | undefined)[][] = [];
    let ProfileContainer: (string | undefined)[] = ["", ""];

    ProfileName.push("Default");
    ProfileData.push(["FFFFFF", "000000"]);

    for (let i: number = 0; i < this.EntryList.length; i++) {
      if (this.ProfileList[this.EntryList[i].Prfidx].CC != undefined) {
        ProfileContainer[0] = this.ProfileList[this.EntryList[i].Prfidx].CC?.slice(1);
      } else {
        ProfileContainer[0] = "FFFFFF";
      }

      if (this.ProfileList[this.EntryList[i].Prfidx].OC != undefined) {
        ProfileContainer[1] = this.ProfileList[this.EntryList[i].Prfidx].OC?.slice(1);
      } else {
        ProfileContainer[1] = "000000";
      }

      let find: boolean = false;
      for (let j: number = 0; j < ProfileData.length; j++) {
        if ((ProfileData[j][0] == ProfileContainer[0]) && (ProfileData[j][1] == ProfileContainer[1])) {
          find = true;
          break;
        } else if ((!find) && (j == ProfileData.length - 1)) {
          ProfileData.push([ProfileContainer[0], ProfileContainer[1]]);
          ProfileName.push("Profile" + (ProfileData.length - 1).toString());
        }
      }
    }

    WriteStream += "[V4+ Styles]\n";
    WriteStream += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";

    for (let i: number = 0; i < ProfileName.length; i++) {
      WriteStream += "Style: " + ProfileName[i] + ",Arial,20,&H00"
        + ProfileData[i][0]?.substring(4, 6) + ProfileData[i][0]?.substring(2, 4) + ProfileData[i][0]?.substring(0, 2)
        + ",&H00000000,&H00"
        + ProfileData[i][1]?.substring(4, 6) + ProfileData[i][1]?.substring(2, 4) + ProfileData[i][1]?.substring(0, 2)
        + ",&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n";
    }
    WriteStream += "\n[Events]\n";
    WriteStream += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

    for (let i: number = 0; i < this.EntryList.length; i++) {
      WriteStream += "Dialogue: 0," + this.StringifyTime(this.EntryList[i].Stime - this.EntryList[0].Stime, false) + ",";

      if (i == this.EntryList.length - 1) {
        WriteStream += this.StringifyTime(this.EntryList[i].Stime + 3000 - this.EntryList[0].Stime, false) + ",";
      } else {
        WriteStream += this.StringifyTime(this.EntryList[i + 1].Stime - this.EntryList[0].Stime, false) + ",";
      }

      if (this.ProfileList[this.EntryList[i].Prfidx].CC != undefined) {
        ProfileContainer[0] = this.ProfileList[this.EntryList[i].Prfidx].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.ProfileList[this.EntryList[i].Prfidx].OC != undefined) {
        ProfileContainer[1] = this.ProfileList[this.EntryList[i].Prfidx].OC;
      } else {
        ProfileContainer[1] = "000000";
      }

      let find: boolean = false;
      for (let j: number = 0; j < ProfileData.length; j++) {
        if ((ProfileData[j][0] == ProfileContainer[0]) && (ProfileData[j][1] == ProfileContainer[1])) {
          find = true;
          WriteStream += ProfileName[j] + ",";
          break;
        } else if ((!find) && (j == ProfileData.length - 1)) {
          WriteStream += "Default,";
        }
      }

      WriteStream += ",0,0,0,," + this.EntryList[i].Stext + "\n";
    }

    const blob = new Blob([WriteStream], { type: 'text/plain' });

    if (this.SavedSetting.ArchiveTitle == "") {
      let d = new Date();
      this.SavedSetting.ArchiveTitle = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();

      if (this.RoomNick != "") {
        this.SavedSetting.ArchiveTitle = this.RoomNick + "_" + this.SavedSetting.ArchiveTitle;
      }
    }

    saveAs(blob, this.SavedSetting.ArchiveTitle + ".ass");
    this.status = "Generated file " + this.SavedSetting.ArchiveTitle + ".ass ( " + this.EntryList.length.toString() + " Entries)";
  }

  ExportTTML(): void {
    var WriteStream = "";
    let ProfileData: (string | undefined)[][] = [];
    let ProfileContainer: (string | undefined)[] = ["", ""];

    ProfileData.push(["FFFFFF", "000000"]);

    for (let i: number = 0; i < this.EntryList.length; i++) {
      if (this.ProfileList[this.EntryList[i].Prfidx].CC != undefined) {
        ProfileContainer[0] = this.ProfileList[this.EntryList[i].Prfidx].CC?.slice(1);
      } else {
        ProfileContainer[0] = "FFFFFF";
      }

      if (this.ProfileList[this.EntryList[i].Prfidx].OC != undefined) {
        ProfileContainer[1] = this.ProfileList[this.EntryList[i].Prfidx].OC?.slice(1);
      } else {
        ProfileContainer[1] = "000000";
      }

      let find: boolean = false;
      for (let j: number = 0; j < ProfileData.length; j++) {
        if ((ProfileData[j][0] == ProfileContainer[0]) && (ProfileData[j][1] == ProfileContainer[1])) {
          find = true;
          break;
        } else if ((!find) && (j == ProfileData.length - 1)) {
          ProfileData.push([ProfileContainer[0], ProfileContainer[1]]);
        }
      }
    }

    WriteStream += "<?xml version=\"1.0\" encoding=\"utf-8\"?><timedtext format=\"3\">\n"
      + "\t<head>"
      + "\t\t<wp id=\"0\" ap=\"7\" ah=\"0\" av=\"0\" />\n"
      + "\t\t<wp id=\"1\" ap=\"7\" ah=\"50\" av=\"100\" />\n"
      + "\t\t<ws id=\"0\" ju=\"2\" pd=\"0\" sd=\"0\" />\n"
      + "\t\t<ws id=\"1\" ju=\"2\" pd=\"0\" sd=\"0\" />\n\n"
      + "\t\t<pen id=\"0\" sz=\"100\" fc=\"#000000\" fo=\"0\" bo=\"0\" />\n"
      + "\t\t<pen id=\"1\" sz=\"0\" fc=\"#A0AAB4\" fo=\"0\" bo=\"0\" />\n";

    for (let i: number = 0; i < ProfileData.length; i++) {
      WriteStream += "\t\t<pen id=\"" + ((i * 2) + 2).toString() + "\" sz=\"100\" fc=\"#" + ProfileData[i][0] + "\" fo=\"254\" et=\"4\" ec=\"#" + ProfileData[i][1] + "\" />\n";
      WriteStream += "\t\t<pen id=\"" + ((i * 2) + 3).toString() + "\" sz=\"100\" fc=\"#" + ProfileData[i][0] + "\" fo=\"254\" et=\"3\" ec=\"#" + ProfileData[i][1] + "\" />\n";
    }

    WriteStream += "\t</head>\n\n\t<body>\n";

    for (let i: number = 0; i < this.EntryList.length; i++) {
      WriteStream += "\t\t<p t=\""
        + (this.EntryList[i].Stime + 1 - this.EntryList[0].Stime).toString()
        + "\" d=\"";

      if (i == this.EntryList.length - 1) {
        WriteStream += (this.EntryList[i].Stime + 3001 - this.EntryList[0].Stime).toString() + "\"";
      } else {
        WriteStream += (this.EntryList[i + 1].Stime + 1 - this.EntryList[0].Stime).toString() + "\"";
      }

      WriteStream += " wp=\"1\" ws=\"1\"><s p=\"1\">​</s>​<s p=\"";

      if (this.ProfileList[this.EntryList[i].Prfidx].CC != undefined) {
        ProfileContainer[0] = this.ProfileList[this.EntryList[i].Prfidx].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.ProfileList[this.EntryList[i].Prfidx].OC != undefined) {
        ProfileContainer[1] = this.ProfileList[this.EntryList[i].Prfidx].OC;
      } else {
        ProfileContainer[1] = "000000";
      }

      let find: boolean = false;
      let idnum: number = 0;
      for (let j: number = 0; j < ProfileData.length; j++) {
        if ((ProfileData[j][0] == ProfileContainer[0]) && (ProfileData[j][1] == ProfileContainer[1])) {
          find = true;
          idnum = j;
          break;
        } else if ((!find) && (j == ProfileData.length - 1)) {
          idnum = 0;
        }
      }

      WriteStream += ((idnum * 2) + 2).toString() + "\">​ " + this.EntryList[i].Stext + "​ ​</s><s p=\"1\">​</s></p>\n";

      WriteStream += "\t\t<p t=\""
        + (this.EntryList[i].Stime + 1 - this.EntryList[0].Stime).toString()
        + "\" d=\"";

      if (i == this.EntryList.length - 1) {
        WriteStream += (this.EntryList[i].Stime + 3001 - this.EntryList[0].Stime).toString() + "\"";
      } else {
        WriteStream += (this.EntryList[i + 1].Stime + 1 - this.EntryList[0].Stime).toString() + "\"";
      }

      WriteStream += " wp=\"1\" ws=\"1\"><s p=\"1\">​</s>​<s p=\"";

      if (this.ProfileList[this.EntryList[i].Prfidx].CC != undefined) {
        ProfileContainer[0] = this.ProfileList[this.EntryList[i].Prfidx].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.ProfileList[this.EntryList[i].Prfidx].OC != undefined) {
        ProfileContainer[1] = this.ProfileList[this.EntryList[i].Prfidx].OC;
      } else {
        ProfileContainer[1] = "000000";
      }

      find = false;
      WriteStream += ((idnum * 2) + 3).toString() + "\">​ " + this.EntryList[i].Stext + "​ ​</s><s p=\"1\">​</s></p>\n";
    }
    WriteStream += "\t</body>\n</timedtext>";

    const blob = new Blob([WriteStream], { type: 'text/plain' });

    if (this.SavedSetting.ArchiveTitle == "") {
      let d = new Date();
      this.SavedSetting.ArchiveTitle = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();

      if (this.RoomNick != "") {
        this.SavedSetting.ArchiveTitle = this.RoomNick + "_" + this.SavedSetting.ArchiveTitle;
      }
    }

    saveAs(blob, this.SavedSetting.ArchiveTitle + ".TTML");
    this.status = "Generated file " + this.SavedSetting.ArchiveTitle + ".TTML ( " + this.EntryList.length.toString() + " Entries)";
  }
  //===================================== EXPORT MODULES =====================================



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
  TrackerDelegate: any;
  PauseTracker: boolean = false;
  SeekBlock: boolean = false;
  VidType:string = "";
  public video: any;
  public player: any;

  //-----------------  YT  -----------------
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
    this.TogglePlayPauseYT();
  };

  ReadyStateYT() {
    this.PauseTracker = false;
  }

  TogglePlayPauseYT(){
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

  StartTrackerYT(): void {
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
  //=================  YT  =================

  //-----------------  TW  -----------------
  LoadvideoTW() {
    if (window['Twitch']) {
      this.startVideoTW();
      return;
    }

    var tag = document.createElement('script');
    tag.src = 'https://player.twitch.tv/js/embed/v1.js';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag.parentNode){
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } 
    
    var Checker = setInterval(() => {
      if (window['Twitch']){
        clearInterval(Checker);
        this.startVideoTW();
      }
    }, 1000);
  }

  startVideoTW() {
    this.reframed = false;
    var options = {
      width: '100%',
      height: '100%',
      video: this.video,
      autoplay: false,
      time: '0h0m0s'
    };
    this.player = new window['Twitch'].Player('player', options);

    this.player.addEventListener(window['Twitch'].Player.PAUSE, () => { 
      this.PauseTracker = true;
    });

    this.player.addEventListener(window['Twitch'].Player.PLAY, () => {
      this.PauseTracker = false;
    });

    this.player.addEventListener(window['Twitch'].Player.SEEK, (e: any) => { 
      this.TimerTime = e.position*1000;
      this.ScrollCalculator();
    });
  }

  StartTrackerTW(): void {
    this.PauseTracker = true;
    if (this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }

    this.TimeSaddle = Date.now();
    this.TrackerDelegate = setInterval(() => {
      if ((Date.now() - this.TimeSaddle < 1000) && (!this.PauseTracker)) {
        this.TimerTime += Date.now() - this.TimeSaddle;
      }
      this.TimeSaddle = Date.now();
      this.ScrollCalculator();  
     }, 20);
  }
  //=================  TW  =================

  //-----------------  TC  -----------------
  SetupIframeTC(MID: string, UID: string): void {
    if (this.IframeRef) {
      this.IframeRef.parentNode?.removeChild(this.IframeRef);
    }
    this.IframeRef = document.createElement('iframe');
    this.IframeRef.src = "https://twitcasting.tv/" + UID + "/embeddedplayer/" + MID + "?auto_play=false&default_mute=false";
    this.IframeRef.width = "100%";
    this.IframeRef.height = "100%";
    this.IframeRef.frameBorder = "0";
    
    this.LoadIframe("TC");
  }
  //=================  TC  =================

  //-----------------  TC  -----------------
  SetupIframeBL(VID: string): void {
    if (this.IframeRef) {
      this.IframeRef.parentNode?.removeChild(this.IframeRef);
    }
    
    switch (VID.slice(0, 2).toLowerCase()) {
      case "bv":
        VID = "bvid=" + VID.slice(2);
        break;
    
      case "av":
        VID = "aid=" + VID.slice(2);
        break;
    }

    this.IframeRef = document.createElement('iframe');
    this.IframeRef.src = "https://player.bilibili.com/player.html?" + VID + "&page=1&as_wide=1&high_quality=0&danmaku=0"
    this.IframeRef.width = "100%";
    this.IframeRef.height = "100%";
    this.IframeRef.frameBorder = "0";
    
    this.LoadIframe("BL");
  }
  //=================  TC  =================

  //-----------------  NC  -----------------
  SetupIframeNC(VID: string): void {
    if (this.IframeRef) {
      this.IframeRef.parentNode?.removeChild(this.IframeRef);
    }
    
    this.IframeRef = document.createElement('iframe');
    this.IframeRef.src = "https://embed.nicovideo.jp/watch/" + VID + "?autoplay=0";
    this.IframeRef.width = "100%";
    this.IframeRef.height = "100%";
    this.IframeRef.frameBorder = "0";
    this.IframeRef.allow= "encrypted-media;";
    
    this.LoadIframe("NC");
  }
  
  //=================  NC  =================

  //-----------------  IFRAME  -----------------
  IframeRef: HTMLIFrameElement | undefined;
  IFOrigin:string = "";

  TimePing(timestamp: number): void {
    if (this.IframeRef?.contentWindow) {
      this.IframeRef?.contentWindow.postMessage({
        n: "MChatXXMSync",
        d: timestamp
      }, "https://app.mchatx.org");
    }
  }

  StartPing(): void {
    if (this.IframeRef?.contentWindow) {
      this.IframeRef?.contentWindow.postMessage({
        n: "MChatXXMSync",
        d: "s"
      }, "https://app.mchatx.org");
    }
  }

  ModePing(Mode: string): void {
    if (this.IframeRef?.contentWindow) {
      this.IframeRef?.contentWindow.postMessage({
        n: "MChatXXMSync",
        d: Mode
      }, "https://app.mchatx.org");
    }

    switch (Mode) {
     case "TC":
       this.IFOrigin = "https://twitcasting.tv";
       break;

     case "NC":
      this.IFOrigin = "https://embed.nicovideo.jp";
      break;

     case "BL":
      this.IFOrigin = "https://player.bilibili.com";
      break;
    
     default:
       this.IFOrigin = "";
       break;
   }
  }

  PausePing(): void {
    if (this.IframeRef?.contentWindow) {
      this.IframeRef?.contentWindow.postMessage({
        n: "MChatXXMSync",
        d: "p"
      }, "https://app.mchatx.org");
    }
  }

  LoadIframe(Mode: string): void {
    if (this.IframeRef) {
      var PlayerDiv = document.getElementById('player');
      if (PlayerDiv){
        PlayerDiv.append(this.IframeRef);

        this.ModePing(Mode);

        window.addEventListener("message", (e:any) => {
          this.SessionStorageListener(e);
        });
      } 
    }
  }

  SessionStorageListener(e: any):void {
    if (e.origin == this.IFOrigin) {
      if (e.data.n == "MSyncXMChatX") {
        switch (e.data.d) {
          case "p":
            this.PauseTracker = true;
            break;
  
          case "s":
            this.PauseTracker = false;
            break;
        
          default:
            if (typeof e.data.d == "number") {
              this.TimerTime = e.data.d;
              this.ScrollCalculator();
            }
            break;
        }
      }
    }
  }
  //=================  IFRAME  =================



  //-----------------  Local  -----------------
  TargetVideoFile: File | null = null;
  LoadLocalVideo: boolean = false;
  @ViewChild('LocalVid') LocalVidPlayer !: ElementRef<HTMLVideoElement>;

  FileChangeVid(e: Event) {
    let ef = (e.target as HTMLInputElement);
    if (ef.files != null) {
      this.TargetVideoFile = ef.files[0];
      this.LoadLocalVideo = true;
    }
  }

  startVideoLocal() {
    if (this.LocalVidPlayer && this.TargetVideoFile) {
      this.LocalVidPlayer.nativeElement.src = URL.createObjectURL(this.TargetVideoFile);
      this.player = this.LocalVidPlayer.nativeElement;
      this.LocalVidPlayer.nativeElement.onpause = () => {
        this.StopTimer(false);
      }
    }
  }

  StartTrackerLocal(): void {
    if (this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }

    this.TrackerDelegate = setInterval(() => {
      if (!this.PauseTracker) {
        this.TimerTime = this.LocalVidPlayer.nativeElement.currentTime*1000;  
      }      
      this.ScrollCalculator();  
    }, 20);

  }
  //=================  Local  =================



  LoadVideo(): void {
    if (this.LoadLocalVideo){
      if (this.TargetVideoFile != null) {
        if (this.TargetVideoFile.name.match(/\.ogg|\.mp4|\.webm/gi) != null){
          this.VidLoad = true;
          this.VidType = "LL";

          setTimeout(() => {
            this.startVideoLocal();
            this.RerenderTimeline();
          }, 100);
    
          this.StopTimer(false);
          this.StartTrackerLocal();
          this.ModalMenu = 0;
        }
      }
    } else if (this.TempSetting.StreamLink.indexOf("https://www.bilibili.com/video/") == 0) {
      var VID  = this.TempSetting.StreamLink.slice("https://www.bilibili.com/video/".length);
      if (VID.indexOf("?") != -1) {
        VID = VID.slice(0, VID.indexOf("?"));
      }
      setTimeout(() => {
        this.SetupIframeBL(VID);
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.VidType = "IF";
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.indexOf("https://www.nicovideo.jp/watch/") == 0) {
      var VID  = this.TempSetting.StreamLink.slice("https://www.nicovideo.jp/watch/".length);
      if (VID.indexOf("?") != -1) {
        VID = VID.slice(0, VID.indexOf("?"));
      }
      setTimeout(() => {
        this.SetupIframeNC(VID);
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.VidType = "IF";
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.match(/twitcasting.tv\/(.*)\/movie\//g) != null) {
      var MID = this.TempSetting.StreamLink.slice(this.TempSetting.StreamLink.lastIndexOf("/") + 1);
      var UID = this.TempSetting.StreamLink.slice(0, this.TempSetting.StreamLink.lastIndexOf("/"));
      UID = UID.slice(0, UID.lastIndexOf("/"));
      UID = UID.slice(UID.lastIndexOf("/") + 1);
      setTimeout(() => {
        this.SetupIframeTC(MID, UID);
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.VidType = "IF";
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.indexOf("https://www.youtube.com/watch?v=") == 0){
      var YTID:string = this.TempSetting.StreamLink.replace("https://www.youtube.com/watch?v=", "");
      if (YTID.indexOf("&") != -1){
        YTID = YTID.substring(0,YTID.indexOf("&"));
      }
      this.video = YTID;
      this.VidType = "YT";
  
      setTimeout(() => {
        this.LoadvideoYT();
        this.RerenderTimeline();
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.StartTrackerYT();
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.indexOf("https://youtu.be/") == 0) {
      var YTID:string = this.TempSetting.StreamLink.replace("https://youtu.be/", "");
      this.video = YTID;
      this.VidType = "YT";
  
      setTimeout(() => {
        this.LoadvideoYT();
        this.RerenderTimeline();
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.StartTrackerYT();
      this.ModalMenu = 0;
    } else if (this.TempSetting.StreamLink.indexOf("https://www.twitch.tv/videos/") == 0) {
      var TWID: string = this.TempSetting.StreamLink.replace("https://www.twitch.tv/videos/", "");
      this.video = TWID;
      this.VidType = "TW";
      
      setTimeout(() => {
        this.LoadvideoTW();
        this.RerenderTimeline();
      }, 100);
      this.StopTimer(false);
      this.VidLoad = true;
      this.StartTrackerTW();
      this.ModalMenu = 0;
    }
  }

  UnSync():void {
    if (this.LocalVidPlayer) {
      this.LocalVidPlayer.nativeElement.src = "";
    }

    if (this.VidType == "IF") {
      window.removeEventListener("message", (e:any) => {
        this.SessionStorageListener(e);
      });
    }

    if (this.VidType == "TW") {
      this.player.removeEventListener(window['Twitch'].Player.PAUSE, () => { 
        this.PauseTracker = true;
      });
  
      this.player.removeEventListener(window['Twitch'].Player.PLAY, () => {
        this.PauseTracker = false;
      });
  
      this.player.removeEventListener(window['Twitch'].Player.SEEK, (e: any) => { 
        this.TimerTime = e.position*1000;
        this.ScrollCalculator();
      });
    }

    if (this.IframeRef) {
      this.IframeRef.parentNode?.removeChild(this.IframeRef);
    }

    var contr = document.getElementById("player");    
    if (contr) {
      while (contr.firstChild) {
        contr.removeChild(contr.firstChild);
      }
    }
    this.VidLoad = false;
    this.VidType = "";
    this.IFOrigin = "";
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
      this.TrackerDelegate = undefined;
    }
  }

  //===========================  VIDEO LOADER HANDLER  ===========================



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
  SecToPx: number = 100;
  SecPerBar: number = 120;
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
      this.JumpScrollEntry(idx);
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

          if (this.SecToPx <= 60) {
            for (let x = 0; x/10 < this.SecPerBar; x += 10) {
              this.ctx.beginPath();
              this.ctx.moveTo(x*this.SecToPx/10, 0);
              this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight);
              this.ctx.stroke();
              
              this.ctx.fillText(this.SectoTimestring(x/10 + i*this.SecPerBar + this.BarCount*this.SecPerBar, false, false), x*this.SecToPx/10 + 5, this.BarHeight);
            }
        
            this.ctx.restore();
          } else if (this.SecToPx <= 100) {
            for (let x = 0; x/10 < this.SecPerBar; x += 2) {
              if (x % 10 == 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(x*this.SecToPx/10, 0);
                this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight);
                this.ctx.stroke();
                
                this.ctx.fillText(this.SectoTimestring(x/10 + i*this.SecPerBar + this.BarCount*this.SecPerBar, false, false), x*this.SecToPx/10 + 5, this.BarHeight);
              } else {
                this.ctx.beginPath();
                this.ctx.moveTo(x*this.SecToPx/10, 0);
                this.ctx.lineTo(x*this.SecToPx/10, this.BarHeight*2.0/3.0);
                this.ctx.stroke();
              } 
            }
        
            this.ctx.restore();
          } else {
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

  JumpScrollEntry(idx: number): void {
    this.EntryTable.nativeElement.rows[idx].scrollIntoView({behavior: "smooth", block: "center"});
  }

  TextAreaEnterCanceller(event: KeyboardEvent):void {
    if (event.keyCode == 13) {
      event.preventDefault();
    }
  }
  //========================== RULER HANDLER ==========================



  //-------------------------- TIMER CONTROL --------------------------
  ActiveEntry:number = -1;
  TimeSaddle: number = Date.now();

  @HostListener('document:keydown.control.space', ['$event'])
  CtrlSpaceKeypress(event: KeyboardEvent):void {
    event.preventDefault();
    if (this.VidLoad){
      if (this.player){
        switch (this.VidType) {
          case "YT":
            if (this.player.getPlayerState() != 1) {
              this.player.playVideo();
            } else if (this.player.getPlayerState() == 1) {
              this.player.pauseVideo();
            }
            break;

          case "TW":
            if (this.player.isPaused()) {
              this.player.play();
            } else {
              this.player.pause();
            }
            break;
          
          case "LL":
            if (this.player.paused) {
              this.player.play();
            } else {
              this.player.pause();
            }
            break;

          case "IF":
            if (this.PauseTracker){
              this.StartPing();
            } else {
              this.PausePing();
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
    this.SendSeek(3000);
    this.ScrollCalculator();
  }

  @HostListener('document:keydown.control.arrowleft', ['$event'])
  CtrlLeftKeypress(event: KeyboardEvent):void {
    if (this.TimerTime > 5000) {
      this.TimerTime -= 3000;
      this.SendSeek(-3000);
    } else {
      this.TimerTime = 0;
      this.SendSeek(0);
    }
    this.ScrollCalculator();
  }


  StartTimer(propagate:boolean):void {
    if (this.VidLoad) {
      if (propagate){
        switch (this.VidType) {
          case "YT":
            this.player.playVideo();            
            break;
          
          case "TW":
            this.player.play();
            break;

          case "LL":
            this.player.play();
            break;
          
          case "IF":
            this.StartPing();
            break;
        }
      }
    } else {
      if (!this.TimerDelegate){
        this.TimeSaddle = Date.now();
        this.TimerDelegate = setInterval(() => {
          if (Date.now() - this.TimeSaddle < 1000) {
            this.TimerTime += Date.now() - this.TimeSaddle;
          }
          this.TimeSaddle = Date.now();
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
      switch (this.VidType) {
        case "YT":
          this.player.pauseVideo();
          break;
        
        case "TW":
          this.player.pause();
          break;

        case "LL":
          this.player.pause();
          break;

        case "IF":
          this.PausePing();
          break;
      }      
    }
  }

  SendSeek(timechange: number = 0){
    if (this.player){
      switch (this.VidType) {
        case "YT":
          this.player.seekTo(this.TimerTime/1000, true);          
          break;

        case "TW":
          this.player.seek(this.TimerTime/1000);
          break;

        case "LL":
          this.player.currentTime = this.TimerTime/1000;
          break;
        
        case "IF":
          this.TimePing(timechange);
          break;
      }
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



  //------------------------ AUTO SAVE MODULE ------------------------
  AutoSaveMode: Boolean = false;
  CDCtrigger: boolean = true;
  AutoSaveTimer: any | undefined = undefined;

  @HostListener('window:beforeunload')
  async ngOnDestroy() {
    if (this.TimerDelegate) {
      clearInterval(this.TimerDelegate);
    }
    if(this.TrackerDelegate) {
      clearInterval(this.TrackerDelegate);
    }
    if (this.AutoSaveTimer) {
      clearInterval(this.AutoSaveTimer);
    }

    if (this.VidType == "IF") {
      window.removeEventListener("message", (e:any) => {
        this.SessionStorageListener(e);
      });
    }

    if (this.VidType == "TW") {
      this.player.removeEventListener(window['Twitch'].Player.PAUSE, () => { 
        this.PauseTracker = true;
      });
  
      this.player.removeEventListener(window['Twitch'].Player.PLAY, () => {
        this.PauseTracker = false;
      });
  
      this.player.removeEventListener(window['Twitch'].Player.SEEK, (e: any) => { 
        this.TimerTime = e.position*1000;
        this.ScrollCalculator();
      });
    }

    if (this.AutoSaveMode && this.CDCtrigger) {
      if (this.EntryList.length > 0) {
        await this.AService.Autosave({
          data: {
            Entries: this.EntryList,
            Profile: this.ProfileList,
            Setting: this.SavedSetting,
            Link: this.SavedSetting.Link
        }}, this.Token, this.RoomNick, "SAVE").subscribe();
      }
    }
  }

  ReLoginAutosave(): void {
    this.SearchPass = "";
    this.ModalMenu = 11;
    this.LoginRedirect = 4;
  }

  InitAutoSave(): void {
    this.AutoSaveMode = false;
    this.AService.Autosave({}, this.Token, this.RoomNick, "INIT").subscribe({
      next:data => {
        this.AutoSaveMode = true;
        if (this.AutoSaveTimer) {
          clearInterval(this.AutoSaveTimer);
          this.AutoSaveTimer = undefined;
        }

        this.AutoSaveTimer = setInterval(() => {
          this.AutoSave(true);
        }, 1000*60*5);
      },
      error: err => {
        this.AutoSaveMode = false;
        if (this.AutoSaveTimer) {
          clearInterval(this.AutoSaveTimer);
          this.AutoSaveTimer = undefined;
        }
      }
    });
  }

  SessionLoader(): void {
    this.AService.LoadLastSession(this.Token, this.RoomNick).subscribe({
      next:data => {
        if (data.body != null){
          const dt = JSON.parse(data.body);
          this.SavedSetting = dt.Setting;
          this.ProfileList = dt.Profile;
          this.EntryList = dt.Entries;
          this.LoadVideo();
        }
      },
      error: err => {
      }
    });
  }

  AutoSave(SafeBox: boolean) {
    if (this.AutoSaveMode && this.CDCtrigger) {
      if (this.EntryList.length > 0){
        this.AService.Autosave({
          data: {
            Entries: this.EntryList,
            Profile: this.ProfileList,
            Setting: this.SavedSetting,
            Link: this.SavedSetting.Link
        }}, this.Token, this.RoomNick, "SAVE").subscribe();
      }
    }
    //this.CDCtrigger = false;
  }
  //======================== AUTO SAVE MODULE ========================



  faTimesCircle = faTimesCircle;
  faSearchPlus = faSearchPlus;
  faSearchMinus = faSearchMinus;
  faUser = faUser;
  faLock = faLock;
  faHome = faHome;
  faStop = faStop;
  faPlay = faPlay;
  faPause = faPause;
  faDownload = faDownload;
  faEyeSlash = faEyeSlash;
  faShareAlt = faShareAlt;
  faLink = faLink;
  faTags = faTags;
  faTwitch = faTwitch;
  faYoutube = faYoutube;
  faFileUpload = faFileUpload;
  faArrowLeft = faArrowLeft;
  faArrowRight = faArrowRight;
  faWindowClose = faWindowClose;
  faPlusSquare = faPlusSquare;
}