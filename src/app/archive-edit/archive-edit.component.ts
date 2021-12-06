import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ArchiveService } from '../services/archive.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service'
import { AccountService } from '../services/account.service';
import ArchiveData from '../models/ArchiveFullData';
import Entries from '../models/Entries';
import { saveAs } from 'file-saver';
import { faLock, faUser, faUpload, faHome, faSignOutAlt, faArrowLeft, faArrowRight, faEyeSlash, faDownload, faShareAlt, faLink, faTags,
         faWrench, faFileExport, faTrash, faEdit, faPenAlt, faFileUpload} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-archive-edit',
  templateUrl: './archive-edit.component.html',
  styleUrls: ['./archive-edit.component.scss']
})
export class ArchiveEditComponent implements OnInit {
  @ViewChild('loadstate') loadbutton!: ElementRef;
  
  SearchNick: string = "";
  SearchPass: string = "";

  ModalMenu:number = 0;
  /*
    1. Upload New
    2. Upload Revision
    3. Edit
    4. Download Script
    5. Delete
  */

  Room: string = "";
  status: string = "";
  Token: string = "";
  LoginMode: boolean = false;
  Processing: boolean = false;

  filename: string = "No file uploaded";

  removemarked: boolean = true;
  
  Archivedt: ArchiveData[] = [];
  ArchiveLength: number = 0;
  CurrentPage: number = 1;

  Entriesdt: Entries[] = [];
  SelectedIndex: number = -1;
  TargetFile: File | null = null;
  FileParsed: Boolean = false;
  Overwrite: Boolean = false;

  SelectedArchive: ArchiveData = {
    Room: "",
    Link: "",
    Nick: "",
    Hidden: false,
    Pass: false,
    Tags: "",
    StreamLink: "",
    ExtShare: false,
    Star: 0,
    Note: "",
    Downloadable: false
  }
  PassString: string = "";

  constructor(
    private AService: ArchiveService,
    private TGEnc: TsugeGushiService,
    private AccService: AccountService
  ) { }

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
              this.Room = TokenData["Room"];
              this.Token = TokenData["Token"];
              this.SearchNick = TokenData["Room"];
              this.CurrentPage = 1;
              this.LoadArchive();
            }
          });
        } else {
          this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
        }
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }
  }

  LoginRoom() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
      this.AccService.GetToken(this.SearchNick, this.SearchPass).subscribe({
        error: error => {
          setTimeout(() => {
          }, 2000);
          this.status = "WRONG PASSWORD/ROOM NAME";
          this.SearchNick = "";
          this.SearchPass = "";
        },
        next: data => {
          this.status = "LOGIN SUCCESS"
          if (data.body[0]["Role"] == "TL") {
            localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
              Room: this.SearchNick,
              Token: data.body[0]["Token"],
              Role: "TL"
            })));

            location.reload();
          } else {
            this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
            this.SearchNick = "";
            this.SearchPass = "";
          }
        }
      });
    }, 1000); //delay for button loading
  }

  LogOut():void {
    localStorage.removeItem("MChatToken");
    location.reload();
  }

  LoadArchive() {
    this.SelectedIndex = -1;
    this.Archivedt = [];
    this.AService.GetAllArchive(this.Room, this.Token, this.CurrentPage).subscribe(
      (response) => {
        var dt = JSON.parse(response.body);
        this.ArchiveLength = dt.Total;

        dt.Data.map((e: any) => {
          if (!e.Downloadable){
            e.Downloadable = false;
          }
          this.Archivedt.push(e);
        })
    });
  }

  PrevPage(): void {
    if (this.CurrentPage > 1){
      this.CurrentPage--;
      this.LoadArchive();
    }
  }

  NextPage(): void {
    this.CurrentPage++;
    this.LoadArchive();
  }

  PushDelete() {
    if (!this.Processing) {
      this.status = "DELETING...";
      this.Processing = true;
      if (this.SelectedArchive.Room != undefined) {
        this.AService.DeleteArchive(this.Room, this.Token, this.Archivedt[this.SelectedIndex].Link).subscribe({
          error: error => {
            this.status = error["error"];
            this.Processing = false;

            if (error["error"] == "ERROR : INVALID TOKEN") {
              localStorage.removeItem("MChatToken");
              location.reload();
            }
          },
          next: data => {
            this.status = "Deleted!! Updating archive list...";

            setTimeout(() => {
              this.status = "";
              this.Processing = false;
              this.ModalMenu = 0;
              this.LoadArchive();
            }, 2000);
          }
        });
      }
    }
  }

  PushUpdate() {
    if (!this.Processing) {
      this.status = "Updating...";
      this.Processing = true;
      if (this.SelectedArchive.Room != undefined) {
        this.AService.EditArchive(this.Room, this.Token, this.SelectedArchive.Link, this.SelectedArchive.Nick, this.SelectedArchive.Hidden, this.SelectedArchive.ExtShare, this.SelectedArchive.Tags, this.SelectedArchive.Pass, this.PassString, this.SelectedArchive.StreamLink, this.SelectedArchive.Note, this.SelectedArchive.Downloadable).subscribe({
          error: error => {
            this.status = error["error"];
            this.Processing = false;

            if (error["error"] == "ERROR : INVALID TOKEN") {
              localStorage.removeItem("MChatToken");
              location.reload();
            }
          },
          next: data => {
            this.status = "Updated!! Updating local archive list...";
            this.Archivedt[this.SelectedIndex] = {
              Room: this.SelectedArchive.Room,
              Link: this.SelectedArchive.Link,
              Nick: this.SelectedArchive.Nick,
              Hidden: this.SelectedArchive.Hidden,
              Pass: this.SelectedArchive.Pass,
              Tags: this.SelectedArchive.Tags,
              StreamLink: this.SelectedArchive.StreamLink,
              ExtShare: this.SelectedArchive.ExtShare,
              Star: this.SelectedArchive.Star,
              Note: this.SelectedArchive.Note,
              Downloadable: this.SelectedArchive.Downloadable
            };

            setTimeout(() => {
              this.status = "";
              this.Processing = false;
              this.ModalMenu = 0;
              this.LoadArchive();
            }, 2000);
          }
        });
      }
    }
  }

  EncodeURILink(link: string | undefined):string {
    if (!link){
      return '/ScriptEditor';
    } else {
      return '/ScriptEditor?archive=' + encodeURIComponent(link);
    }    
  }

  //------------------------------------- UPLOAD MODULES -------------------------------------
  OpenUploadModal(ModalMode: number): void {
    this.ModalMenu = ModalMode;
    this.status = "";
    this.filename = "No file uploaded";
    this.TargetFile = null;
    this.FileParsed = false;
    this.Entriesdt = [];

    if (ModalMode == 1){
      this.SelectedArchive = {
        Room: "",
        Link: "",
        Nick: "",
        Hidden: false,
        Pass: false,
        Tags: "",
        StreamLink: "",
        ExtShare: false,
        Star: 0,
        Note: "",
        Downloadable: false
      }
    } else {
      this.SelectedArchive = this.Archivedt[this.SelectedIndex];
    }
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

  PushRevision() {
    if (!this.Processing) {
      this.Processing = true;
      this.status = "Uploading..."

      this.AService.UpdateArchive(this.Room, this.Token, this.Archivedt[this.SelectedIndex].Link, JSON.stringify(this.Entriesdt)).subscribe({
        error: error => {
          this.status = error["error"];
          this.Processing = false;

          if (error["error"] == "ERROR : INVALID TOKEN") {
            localStorage.removeItem("MChatToken");
            location.reload();
          }
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

  PushUpload() {
    if (!this.Processing) {
      this.Processing = true;
      this.status = "Uploading..."
      let d = new Date();
      this.SelectedArchive.Link = this.Room + "_" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();

      if (this.SelectedArchive.Nick == "") {
        this.SelectedArchive.Nick = this.SelectedArchive.Link;
      }

      this.AService.AddArchive(this.Room, this.Token, this.SelectedArchive.Nick, this.SelectedArchive.Link, this.SelectedArchive.Hidden, this.SelectedArchive.ExtShare, this.SelectedArchive.Tags, this.SelectedArchive.Pass, this.PassString, this.SelectedArchive.StreamLink, JSON.stringify(this.Entriesdt), this.SelectedArchive.Note, this.SelectedArchive.Downloadable).subscribe({
        error: error => {
          this.status = error["error"];
          this.Processing = false;

          if (error["error"] == "ERROR : INVALID TOKEN") {
            localStorage.removeItem("MChatToken");
            location.reload();
          }
        },
        next: data => {
          this.status = "Uploaded!! Updating archive list...";

          setTimeout(() => {
            this.status = "";
            this.Processing = false;
            this.ModalMenu = 0;
            this.LoadArchive();
          }, 2000);
        }
      });
    }
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
    this.status = "PARSING FILE"
    this.Entriesdt = [];
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
    let Profile: string[][] = [];

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
                    Profile.push([
                      Linesplit[LocationIndex[0]].trim(),
                      Linesplit[LocationIndex[1]].trim().substr(8, 2) + Linesplit[LocationIndex[1]].trim().substr(6, 2) + Linesplit[LocationIndex[1]].trim().substr(4, 2),
                      Linesplit[LocationIndex[2]].trim().substr(8, 2) + Linesplit[LocationIndex[2]].trim().substr(6, 2) + Linesplit[LocationIndex[2]].trim().substr(4, 2)
                    ]);
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

      /*
      this.status = "";
      for(let index:number = 0; index < Profile.length; index++){
        this.status += Profile[index][0] + " " + Profile[index][1] + " " + Profile[index][2] + " | ";
      }
      */

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
                  for (let index2 = 0; index2 < Profile.length; index2++) {
                    if (Linesplit[LocationIndex[1]].trim() == Profile[index2][0]) {
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
                        CC: Profile[index2][1],
                        OC: Profile[index2][2]
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
      this.status = "ASS file, " + Profile.length.toString() + " colour profiles, " + this.Entriesdt.length.toString() + " Entries.";

      let startmatch = this.Entriesdt.filter(e => (e.Stext?.match(/--.*Stream.*Start.*--/i) != null));
      if (startmatch.length == 0){
        this.Entriesdt.unshift({
          Stext: "---Stream Start---",
          Stime: 0,
          CC: undefined,
          OC: undefined
        });
      }

      this.FileParsed = true;
      this.SelectedArchive = {
        Room: this.Room,
        Link: "",
        Nick: "",
        Hidden: false,
        Pass: false,
        Tags: "",
        StreamLink: "",
        ExtShare: false,
        Star: 0,
        Note: "",
        Downloadable: false
      }
      /*
      this.status = "";
      for(let index:number = 0; index < this.Entriesdt.length; index++){
        this.status += this.Entriesdt[index].Stext + " " + this.Entriesdt[index].Time + " " + this.Entriesdt[index].CC + " " + this.Entriesdt[index].OC + " | ";
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

        let startmatch = this.Entriesdt.filter(e => (e.Stext?.match(/--.*Stream.*Start.*--/i) != null));
        if (startmatch.length == 0){
          this.Entriesdt.unshift({
            Stext: "---Stream Start---",
            Stime: 0,
            CC: undefined,
            OC: undefined
          });
        }

        this.FileParsed = true;
        this.SelectedArchive = {
          Room: this.Room,
          Link: "",
          Nick: "",
          Hidden: false,
          Pass: false,
          Tags: "",
          StreamLink: "",
          ExtShare: false,
          Star: 0,
          Note: "",
          Downloadable: false
        }
      }
    }

    /*
      this.status = "";
      for(let index:number = 0; index < this.Entriesdt.length; index++){
      this.status += this.Entriesdt[index].Stext + " " + this.Entriesdt[index].Time + " " + this.Entriesdt[index].CC + " " + this.Entriesdt[index].OC + " | ";
      }
    */
  }

  ParseTTML(Feed: string): void {
    let fail: Boolean = true;
    let Profile: string[][] = [];

    if ((Feed.indexOf("<head>") != - 1) && (Feed.indexOf("<\/head>") != -1)) {
      let startindex: number = Feed.indexOf("<head>");
      let endindex: number = Feed.indexOf("<\/head>");
      let res: string[] = [];

      fail = false;

      for (let PenStart: number = Feed.indexOf("<pen", startindex); PenStart < endindex; PenStart = Feed.indexOf("<pen", PenStart)) {
        if (PenStart == -1) {
          break;
        }

        let Penend: number = Feed.indexOf(">", PenStart);
        let target: number = -1;
        let endtarget: number = -1;
        let profilecontainer: string[] = ["", "", ""];

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
        profilecontainer[0] = Feed.substring(target + 4, endtarget);

        target = Feed.indexOf("fc=\"", PenStart);
        if ((target == -1) || (target > Penend)) {
          profilecontainer[1] = "FFFFFF";
        } else {
          endtarget = Feed.indexOf("\"", target + 5);
          if ((endtarget > Penend) || (endtarget == -1)) {
            fail = true;
            break;
          }
          profilecontainer[1] = Feed.substring(target + 5, endtarget);
        }

        target = Feed.indexOf("ec=\"", PenStart);
        if ((target == -1) || (target > Penend)) {
          profilecontainer[2] = "000000";
        } else {
          endtarget = Feed.indexOf("\"", target + 5);
          if ((endtarget > Penend) || (endtarget == -1)) {
            fail = true;
            break;
          }
          profilecontainer[2] = Feed.substring(target + 5, endtarget);
        }

        Profile.push(profilecontainer);
        PenStart = Penend;
      }
    }

    if (fail) {
      //this.status = "UNABLE TO PARSE THE FILE (FILE CORRUPTED?)";
      return (undefined);
    } else {
      fail = true;

      /*
      this.status = "";
      for(let index:number = 0; index < Profile.length; index++){
        this.status += Profile[index][0] + " " + Profile[index][1] + " " + Profile[index][2] + " | ";
      }
      */
    }

    if ((Feed.indexOf("<body>") != - 1) && (Feed.indexOf("<\/body>") != -1)) {
      let startindex: number = Feed.indexOf("<body>");
      let endindex: number = Feed.indexOf("<\/body>");
      let res: string[] = [];
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

                for (let i: number = 0; i < Profile.length; i++) {
                  if (Profile[i][0] == Feed.substring(target + 3, endtarget)) {
                    this.Entriesdt.push({
                      Stext: Feed.substring(EndClosure + 1, SpanEnd).trim(),
                      Stime: EntryContainer.Stime,
                      CC: Profile[i][1],
                      OC: Profile[i][2]
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
      this.status = "TTML file, " + Profile.length.toString() + " colour profiles, " + this.Entriesdt.length.toString() + " Entries.";

      let startmatch = this.Entriesdt.filter(e => (e.Stext?.match(/--.*Stream.*Start.*--/i) != null));
      if (startmatch.length == 0){
        this.Entriesdt.unshift({
          Stext: "---Stream Start---",
          Stime: 0,
          CC: undefined,
          OC: undefined
        });
      }

      this.FileParsed = true;
      this.SelectedArchive = {
        Room: this.Room,
        Link: "",
        Nick: "",
        Hidden: false,
        Pass: false,
        Tags: "",
        StreamLink: "",
        ExtShare: false,
        Star: 0,
        Note: "",
        Downloadable: false
      }
      /*
      this.status = this.Entriesdt.length.toString() + " = ";
      for(let index:number = 0; index < this.Entriesdt.length; index++){
        this.status += this.Entriesdt[index].Stext + " " + this.Entriesdt[index].Time + " " + this.Entriesdt[index].CC + " " + this.Entriesdt[index].OC + " | ";
      }
      */
    }
  }
  //===================================== UPLOAD MODULES =====================================



    //------------------------------------- EXPORT MODULES -------------------------------------
  LoadEntries(mode: string): void {
    this.Entriesdt = [];
    this.AService.GetOneArchive(this.Room, this.Token, this.Archivedt[this.SelectedIndex].Link).subscribe(
      (response) => {
        var dt = JSON.parse(response.body);
        for (let i = 0; i < dt.length; i++) {
          this.Entriesdt.push({
            Stext: dt[i].Stext,
            Stime: dt[i].Stime,
            CC: dt[i].CC,
            OC: dt[i].OC
          });
        }

        switch (mode) {
          case 'srt':
            this.ExportSrt();
            break;
          case 'ass':
            this.ExportAss();
            break;
          case 'TTML':
            this.ExportTTML();
            break;
        }
    });
  }

  ExportSrt(): void {
    var WriteStream = "";

    for (let i: number = 0; i < this.Entriesdt.length; i++) {
      WriteStream += (i + 1).toString() + "\n";
      WriteStream += this.StringifyTime(this.Entriesdt[i].Stime - this.Entriesdt[0].Stime, true) + " --> ";
      if (i == this.Entriesdt.length - 1) {
        WriteStream += this.StringifyTime(this.Entriesdt[i].Stime + 3000 - this.Entriesdt[0].Stime, true) + "\n";
      } else {
        WriteStream += this.StringifyTime(this.Entriesdt[i + 1].Stime - this.Entriesdt[0].Stime, true) + "\n";
      }
      WriteStream += this.Entriesdt[i].Stext + "\n\n";
    }

    const blob = new Blob([WriteStream], { type: 'text/plain' });
    saveAs(blob, this.Archivedt[this.SelectedIndex].Nick + ".srt");
    this.status = "Generated file " + this.Archivedt[this.SelectedIndex].Nick + ".srt ( " + this.Entriesdt.length.toString() + " Entries)";
  }

  ExportAss(): void {
    var WriteStream = "";
    let ProfileName: string[] = [];
    let ProfileData: (string | undefined)[][] = [];
    let ProfileContainer: (string | undefined)[] = ["", ""];

    ProfileName.push("Default");
    ProfileData.push(["FFFFFF", "000000"]);

    for (let i: number = 0; i < this.Entriesdt.length; i++) {
      if (this.Entriesdt[i].CC != undefined) {
        ProfileContainer[0] = this.Entriesdt[i].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }

      if (this.Entriesdt[i].OC != undefined) {
        ProfileContainer[1] = this.Entriesdt[i].OC;
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

    for (let i: number = 0; i < this.Entriesdt.length; i++) {
      WriteStream += "Dialogue: 0," + this.StringifyTime(this.Entriesdt[i].Stime - this.Entriesdt[0].Stime, false) + ",";

      if (i == this.Entriesdt.length - 1) {
        WriteStream += this.StringifyTime(this.Entriesdt[i].Stime + 3000 - this.Entriesdt[0].Stime, false) + ",";
      } else {
        WriteStream += this.StringifyTime(this.Entriesdt[i + 1].Stime - this.Entriesdt[0].Stime, false) + ",";
      }

      if (this.Entriesdt[i].CC != undefined) {
        ProfileContainer[0] = this.Entriesdt[i].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.Entriesdt[i].OC != undefined) {
        ProfileContainer[1] = this.Entriesdt[i].OC;
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

      WriteStream += ",0,0,0,," + this.Entriesdt[i].Stext + "\n";
    }

    const blob = new Blob([WriteStream], { type: 'text/plain' });
    saveAs(blob, this.Archivedt[this.SelectedIndex].Nick + ".ass");
    this.status = "Generated file " + this.Archivedt[this.SelectedIndex].Nick + ".ass ( " + this.Entriesdt.length.toString() + " Entries)";
  }

  ExportTTML(): void {
    var WriteStream = "";
    let ProfileData: (string | undefined)[][] = [];
    let ProfileContainer: (string | undefined)[] = ["", ""];

    ProfileData.push(["FFFFFF", "000000"]);

    for (let i: number = 0; i < this.Entriesdt.length; i++) {
      if (this.Entriesdt[i].CC != undefined) {
        ProfileContainer[0] = this.Entriesdt[i].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }

      if (this.Entriesdt[i].OC != undefined) {
        ProfileContainer[1] = this.Entriesdt[i].OC;
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

    for (let i: number = 0; i < this.Entriesdt.length; i++) {
      WriteStream += "\t\t<p t=\""
        + (this.Entriesdt[i].Stime + 1 - this.Entriesdt[0].Stime).toString()
        + "\" d=\"";

      if (i == this.Entriesdt.length - 1) {
        WriteStream += (this.Entriesdt[i].Stime + 3001 - this.Entriesdt[0].Stime).toString() + "\"";
      } else {
        WriteStream += (this.Entriesdt[i + 1].Stime + 1 - this.Entriesdt[0].Stime).toString() + "\"";
      }

      WriteStream += " wp=\"1\" ws=\"1\"><s p=\"1\">​</s>​<s p=\"";

      if (this.Entriesdt[i].CC != undefined) {
        ProfileContainer[0] = this.Entriesdt[i].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.Entriesdt[i].OC != undefined) {
        ProfileContainer[1] = this.Entriesdt[i].OC;
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

      WriteStream += ((idnum * 2) + 2).toString() + "\">​ " + this.Entriesdt[i].Stext + "​ ​</s><s p=\"1\">​</s></p>\n";

      WriteStream += "\t\t<p t=\""
        + (this.Entriesdt[i].Stime + 1 - this.Entriesdt[0].Stime).toString()
        + "\" d=\"";

      if (i == this.Entriesdt.length - 1) {
        WriteStream += (this.Entriesdt[i].Stime + 3001 - this.Entriesdt[0].Stime).toString() + "\"";
      } else {
        WriteStream += (this.Entriesdt[i + 1].Stime + 1 - this.Entriesdt[0].Stime).toString() + "\"";
      }

      WriteStream += " wp=\"1\" ws=\"1\"><s p=\"1\">​</s>​<s p=\"";

      if (this.Entriesdt[i].CC != undefined) {
        ProfileContainer[0] = this.Entriesdt[i].CC;
      } else {
        ProfileContainer[0] = "FFFFFF";
      }
      if (this.Entriesdt[i].OC != undefined) {
        ProfileContainer[1] = this.Entriesdt[i].OC;
      } else {
        ProfileContainer[1] = "000000";
      }

      find = false;
      WriteStream += ((idnum * 2) + 3).toString() + "\">​ " + this.Entriesdt[i].Stext + "​ ​</s><s p=\"1\">​</s></p>\n";
    }
    WriteStream += "\t</body>\n</timedtext>";

    const blob = new Blob([WriteStream], { type: 'text/plain' });
    saveAs(blob, this.Archivedt[this.SelectedIndex].Nick + ".TTML");
    this.status = "Generated file " + this.Archivedt[this.SelectedIndex].Nick + ".TTML ( " + this.Entriesdt.length.toString() + " Entries)";
  }
  //===================================== EXPORT MODULES =====================================


  faLock = faLock;
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  faUpload = faUpload;
  faHome = faHome;
  faArrowLeft = faArrowLeft;
  faArrowRight = faArrowRight;
  faEyeSlash = faEyeSlash;
  faDownload = faDownload;
  faShareAlt = faShareAlt;
  faLink = faLink;
  faTags = faTags;
  faWrench = faWrench;
  faFileExport = faFileExport;
  faTrash = faTrash;
  faEdit = faEdit;
  faPenAlt = faPenAlt;
  faFileUpload = faFileUpload;
}
