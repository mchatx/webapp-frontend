import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { TranslatorService } from '../services/translator.service';
import { faHome, faLock, faUser } from '@fortawesome/free-solid-svg-icons';

class FullEntry {
  Stext: string = "";
  Stime: string = "";
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

class RoomData {
  ExtSharing: boolean = false;
  EntryPass: boolean = false;
  Empty: boolean = false;
  Hidden: boolean = false;
  StreamLink: string = "";
  Tags: string = "";
  Note: string = "";
  SessPass: string = "";
  PassList: string = "";
}

@Component({
  selector: 'app-translator-client',
  templateUrl: './translator-client.component.html',
  styleUrls: ['./translator-client.component.scss']
})
export class TranslatorClientComponent implements OnInit {
  @ViewChild('footer') footer !: ElementRef;
  @ViewChild('cardcontainer') cardcontainer !: ElementRef; 
  @ViewChild('loadstate') loadbutton!: ElementRef;
  WinWidth: number = window.innerWidth;

  LoginMode: boolean = false;
  SearchPass: string = "";
  status:string = "";
  ModalMenu:number = 0;

  //  NOTIF
  ModalNotif: Boolean = false;
  NotifText: string = "";

  //  DISPLAY VARIABLES
  OpenOption:Boolean = false
  EntryList: FullEntry[] = [];
  OT:number = 1;
  ChatProxy:HTMLIFrameElement | undefined;

  FFsize:number = 21;
  FStyle:string = "Ubuntu";
  TxAlign:CanvasTextAlign = "left";
  MaxDisplay = 50;
  BGColour:string = "#28282B";

  RoomNick: string = "";
  AppToken: string = "";

  //  TL VARIABLES
  TLEntry:FullEntry = ({
    Stext: "",
    Stime: "",
    CC: undefined,
    OC: undefined,
    key: ""
  });

  Prefix:string = "";
  Suffix:string = "";
  OCcheck:boolean = false;
  CCcheck:boolean = false;
  OCcolour:string = "#000000";
  CCcolour:string = "#FFFFFF";

  ProfileTab:boolean = false;
  Profiletabtimeout:any;
  SelectedProfile: number = 0;
  ProfileList:Profile[] = [];

  constructor(
    private TGEnc: TsugeGushiService,
    private TLService: TranslatorService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    let test2: string | null = sessionStorage.getItem("MChatAppToken");

    if (test2 != undefined) {
      try {
        this.AppToken = this.TGEnc.TGDecoding(test2);  
        this.LoginMode = true;

        this.ProfileList.push({
          Name: 'Default',
          Prefix: '',
          Suffix: '',
          OC: undefined,
          CC: undefined
        });

        this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
          act: "Get First"
        }))).subscribe({
          next: data => {
            const dt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(data.body).BToken));
            dt.forEach((e:FullEntry) => {
              e.Stime = new Date(Date.parse('01 Jan 1970 ' + e.Stime.slice(0, e.Stime.lastIndexOf(":")) + ' UTC')).toTimeString().split(" ")[0];
              this.EntryList.push(e);
            });
          }
        });

        this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
          act: "Get MetaData"
        }))).subscribe({
          next: data => {
            const dt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(data.body).BToken));
            this.RoomDt.Empty = dt["Empty"];
            this.RoomDt.EntryPass = dt["EntryPass"];
            this.RoomDt.ExtSharing = dt["ExtSharing"];
            this.RoomDt.Hidden = dt["Hidden"];
            this.RoomDt.Note = dt["Note"];
            this.RoomDt.PassList = dt["PassList"];
            this.RoomDt.SessPass = dt["SessPass"];
            this.RoomDt.StreamLink = dt["StreamLink"];
            this.RoomDt.Tags = dt["Tags"];

            if(this.cardcontainer && this.footer){
              this.cardcontainer.nativeElement.style["height"] = (window.innerHeight - this.footer.nativeElement.offsetHeight - 25).toString() + "px";
              this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
            }
          }
        });

        return;
      } catch (error) {
        sessionStorage.removeItem("MChatAppToken");
      }
    }
    
    let test: string | null = sessionStorage.getItem("MChatToken");    
    if (test != undefined) {
      try {
        let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
        this.RoomNick = TokenData["Room"];
      } catch (error) {
      }
    }
  }

  LoginRoom() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
    }, 1000);

    this.TLService.Login(this.TGEnc.TGEncoding(JSON.stringify({
      room: this.RoomNick,
      pass: this.SearchPass
    }))).subscribe({
      error: error => {
        setTimeout(() => {
        }, 2000);
        this.status = "WRONG PASSWORD/ROOM NAME";
        this.SearchPass = "";
        sessionStorage.removeItem("MChatAppToken");
      },
      next: data => {
        const TToken = JSON.parse(data.body).BToken;
        sessionStorage.setItem("MChatAppToken", TToken)
        location.reload();
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.WinWidth = window.innerWidth;
    if(this.cardcontainer && this.footer){
      this.cardcontainer.nativeElement.style["height"] = (window.innerHeight - this.footer.nativeElement.offsetHeight - 25).toString() + "px";
      this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
    }
  }

  //-------------------------- AUX CONTROL --------------------------
  RoomDt: RoomData = new RoomData();
  ProfileName:string = "";
  OpenSessionPass:string = "";
  StreamLink:string = "";
  Tags:string = "";
  Notes:string = "";
  PassCheck:boolean = false;
  PassString:string = "";
  ArchiveTitle:string = "";
  ThirdPartySharing:boolean = true;
  Hidden:boolean = false;
  EditCC:string = "";
  EditCCheck:boolean = false;
  EditOC:string = "";
  EditOCheck:boolean = false;
  EditText:string = "";
  EditKey:string = "";
  EditIdx:number = 0;
  Downloadable: boolean = false;

  /*
  1 => Add New Profile
  2 => Host Open Session
  3 => Stream Link, Tags, Note
  4 => Password
  5 => Export Script
  6 => Save to Archive
  7 => Clear room
  8 => Edit Entry
  */
  SetModalMenu(idx: number):void {
    this.ModalMenu = idx;
    switch (this.ModalMenu) {
      case 1:
        this.ProfileName = "";        
        break;
      
      case 2:
        this.OpenSessionPass = this.RoomDt.SessPass;
        break;

      case 3:
        this.StreamLink = this.RoomDt.StreamLink;
        this.Tags = this.RoomDt.Tags;
        this.Notes = this.RoomDt.Note;
        break;
  
      case 4:
        this.PassCheck = this.RoomDt.EntryPass;
        this.PassString = this.RoomDt.PassList;
        break;

      case 5:
        
        break;
  
      case 6:
        this.ArchiveTitle = "";
        this.PassCheck = this.RoomDt.EntryPass;
        this.PassString = this.RoomDt.PassList;
        this.StreamLink = this.RoomDt.StreamLink;
        this.Tags = this.RoomDt.Tags;
        this.ThirdPartySharing = this.RoomDt.ExtSharing;
        this.Hidden = this.RoomDt.Hidden;
        this.Downloadable = false;
        break;
  
      case 7:
        
        break;
    }
  }

  ClearRoom():void {
    this.ModalNotif = true;
    this.NotifText = "FLUSHING ROOM..."
    this.ModalMenu = 0;

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Clear Room"
    }))).subscribe({
      next: data => {
        this.EntryList = [];
        this.ModalNotif = false;
        this.RoomDt.SessPass = "";
        this.RoomDt.Empty = true;
        this.RoomDt.Note = "";
      },
      error: err => {
        this.NotifText = "ERROR FLUSHING ROOM...";
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }

  SaveOpenSessionPass():void {
    this.ModalNotif = true;
    this.NotifText = "Saving change";

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Update Metadata",
      mode: 0,
      data: this.OpenSessionPass
    }))).subscribe({
      next: data => {
        this.RoomDt.SessPass = this.OpenSessionPass;
        this.ModalNotif = false;
        this.ModalMenu = 0;
      },
      error: err => {
        console.log(err);
      }
    });
  }

  SaveExtraInfo():void {
    this.ModalNotif = true;
    this.NotifText = "Saving change";

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Update Metadata",
      mode: 1,
      data: {
        Link: this.StreamLink,
        Tags: this.Tags,
        Note: this.Notes
      }
    }))).subscribe({
      next: data => {
        this.RoomDt.StreamLink = this.StreamLink;
        this.RoomDt.Tags = this.Tags;
        this.RoomDt.Note = this.Notes;
        this.ModalMenu = 0;
        this.ModalNotif = false;
      },
      error: err => {
        console.log(err);
      }
    });
  }

  SavePassword():void {
    this.ModalNotif = true;
    this.NotifText = "Saving change";

    if ((this.PassCheck == false) || (this.PassString.trim() == "")){
      this.PassCheck = false;
      this.PassString = "";
    } else {
      this.PassCheck = true;
    }

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Update Metadata",
      mode: 2,
      data: {
        PP: this.PassCheck,
        PString: this.PassString
      }
    }))).subscribe({
      next: data => {
        this.RoomDt.EntryPass = this.PassCheck;
        this.RoomDt.PassList = this.PassString;
        this.ModalNotif = false;
        this.ModalMenu = 0;
      },
      error: err => {
        console.log(err);
      }
    });
  }

  ThirdPartyChange():void {
    this.ModalNotif = true;
    this.NotifText = "Saving change";
    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Update Metadata",
      mode: 3,
      data: this.ThirdPartySharing
    }))).subscribe({
      next: data => {
        this.RoomDt.ExtSharing = this.ThirdPartySharing;
        this.ModalNotif = false;
        console.log("3rd Party Change");
      },
      error: err => {
        console.log(err);
      }
    });
  }

  SaveToArchive():void {
    this.ModalNotif = true;
    this.NotifText = "SAVING ARCHIVE..."
    this.ModalMenu = 0;

    if ((this.PassCheck == false) || (this.PassString.trim() == "")){
      this.PassCheck = false;
      this.PassString = "";
    } else {
      this.PassCheck = true;
    }

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "SAVE ARCHIVE",
      data: {
        Title: this.ArchiveTitle,
        EntryPass: this.PassString,
        StreamLink: this.StreamLink,
        Tags: this.Tags,
        ExtShare: this.ThirdPartySharing,
        Hidden: this.Hidden,
        Note: this.RoomDt.Note,
        Downloadable: this.Downloadable
      }
    }))).subscribe({
      next: data => {
        this.EntryList = [];
        this.ModalNotif = false;
        this.RoomDt.SessPass = "";
        this.RoomDt.Empty = true;
        this.RoomDt.Note = "";
      },
      error: err => {
        this.NotifText = "ERROR FLUSHING ROOM...";
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }

  OpenEditEntry(idx : number):void {
    let test = this.EntryList[idx].CC;
    this.EditIdx = idx;
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
    this.SetModalMenu(8);
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

    var TempEntry: any = {
      Stext: this.EditText,
      CC: this.TLEntry.CC,
      OC: this.TLEntry.OC,
      key: this.EditKey
    }

    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Update Entry",
      data: TempEntry,
      ExtShare: this.RoomDt.ExtSharing,
      OT: this.EntryList[this.EditIdx].Stext
    }))).subscribe({
      next: data => {
        this.EntryRepaint({
          Stext: TempEntry.Stext,
          Stime: "",
          CC: TempEntry.CC,
          OC: TempEntry.OC,
          key: TempEntry.key
        });
      }
    });

    this.ModalMenu = 0;
  }
  //========================== AUX CONTROL ==========================



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
    if (!this.SpamBlock && (this.ModalMenu == 0) && (this.TLEntry.Stext.trim() != "")){
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
      
      const Stime2 = new Date().toTimeString().split(" ")[0];

      var a: any = new Date();
      var b: string = a.getMilliseconds().toString();
      while (b.length < 3){
        b = "0" + b;
      }
      a = a.toUTCString().split(" ");
      a = a[a.length - 2];
  
      var TempEntry: any = {
        Stext: this.Prefix + this.TLEntry.Stext + this.Suffix,
        Stime2: Date.now(),
        CC: this.TLEntry.CC,
        OC: this.TLEntry.OC,
        Stime: a + ":" + b
      }

      if (this.RoomDt.Empty == true){
        TempEntry.Empty = true;
      }

      this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
        act: "New Entry",
        data: TempEntry,
        ExtShare: this.RoomDt.ExtSharing
      }))).subscribe({
        next: data => {
          if (this.RoomDt.Empty == true){
            this.RoomDt.Empty = false;
          }
    
          const dt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(data.body).BToken));
          this.EntryPrint({
            Stext: TempEntry["Stext"],
            Stime: Stime2,
            CC: TempEntry["CC"],
            OC: TempEntry["OC"],
            key: dt["key"]
          });
          setTimeout(() => {
            if (this.cardcontainer){
              this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
            }
          }, 100);
        }
      });

      this.TLEntry.Stext = "";
      setTimeout(() => {
        this.SpamBlock = false;
      }, 1000);
    }
  }

  Broadcast() {
    this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
      act: "Broadcast",
      data: {
        Link: this.RoomDt.StreamLink,
        Tag: this.RoomDt.Tags
      }
    }))).subscribe({
      next: data => {
        this.EntryPrint({
          Stext: "(SYSTEM) Session Broadcasted",
          Stime: new Date().toTimeString().split(" ")[0],
          CC: undefined,
          OC: undefined,
          key: ""
        });
        setTimeout(() => {
          if (this.cardcontainer){
            this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
          }
        }, 100);
      }
    });

    if (this.EntryList.filter(e => (e.Stext.indexOf('- Stream Starts -') != -1)).length == 0) {
      const Stime2 = new Date().toTimeString().split(" ")[0];

      var a: any = new Date();
      var b: string = a.getMilliseconds().toString();
      while (b.length < 3){
        b = "0" + b;
      }
      a = a.toUTCString().split(" ");
      a = a[a.length - 2];
  
      var TempEntry: any = {
        Stext: "--- Stream Starts ---",
        Stime2: Date.now(),
        CC: "",
        OC: "",
        Stime: a + ":" + b
      }

      if (this.RoomDt.Empty == true){
        TempEntry.Empty = true;
      }

      this.TLService.FetchRaw(this.AppToken, this.TGEnc.TGEncoding(JSON.stringify({
        act: "New Entry",
        data: TempEntry,
        ExtShare: this.RoomDt.ExtSharing
      }))).subscribe({
        next: data => {
          if (this.RoomDt.Empty == true){
            this.RoomDt.Empty = false;
          }
    
          const dt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(data.body).BToken));
          this.EntryPrint({
            Stext: TempEntry["Stext"],
            Stime: Stime2,
            CC: TempEntry["CC"],
            OC: TempEntry["OC"],
            key: dt["key"]
          });
          setTimeout(() => {
            if (this.cardcontainer){
              this.cardcontainer.nativeElement.scrollTop = this.cardcontainer.nativeElement.scrollHeight;
            }
          }, 100);
        }
      });
    }
  }
  //========================== TL INPUT CONTROL ==========================  



  //-----------------------------------  LIVE LISTENER  -----------------------------------
  /*
  StartListening(Btoken: string): void {
    const RoomES = new EventSource('http://localhost:33333/TLAPI/?BToken=' + Btoken);

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
              Stime: "",
              CC: dt["content"]["CC"],
              OC: dt["content"]["OC"]              
            });
          } else if (dt["flag"] == "update"){
            this.EntryRepaint({
              Stext: dt["content"]["Stext"],
              key: dt["content"]["key"],
              Stime: "",
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
        Stime: "",
        Stext: "CONNECTION ERROR",
        OC: undefined,
        CC: undefined,
        key: ""
      })
    }

    RoomES.onopen = e => {
      this.EntryPrint({
        Stime: "",
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
  */
  //===================================  LIVE LISTENER  ===================================



  //-----------------------------------  ENTRY HANDLER  -----------------------------------
  EntryRepaint(dt:FullEntry): void{
    for(let i:number = 0; i < this.EntryList.length; i++){
      if (this.EntryList[i].key == dt.key){
        dt.Stime = this.EntryList[i].Stime;

        this.EntryList[i] = dt;
        break;
      }
    }
  }

  EntryPrint(dt:FullEntry): void{
    if (this.EntryList.length == this.MaxDisplay){
      this.EntryList.shift();
    }

    this.EntryList.push(dt);
  }
  //===================================  ENTRY HANDLER  ===================================



  //-----------------------------------  EXPORT HANDLER  -----------------------------------
  ExportToFile(mode:number):void {
    this.ModalMenu = 0;
  }
  //===================================  EXPORt HANDLER  ===================================



  faUser = faUser;
  faLock = faLock;
  faHome = faHome;
}