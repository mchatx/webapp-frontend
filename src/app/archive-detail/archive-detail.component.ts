import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { CommentService } from '../services/comment.service';
import { AccountService } from '../services/account.service';
import { RatingService } from '../services/rating.service';
import { WPproxyService } from '../services/wpproxy.service';
import Archive from '../models/Archive';
import Comment from '../models/Comment';
import Entries from '../models/Entries';
import { faLock, faUnlock, faUser, faEdit, faTrash, faReply } from '@fortawesome/free-solid-svg-icons';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-archive-detail',
  templateUrl: './archive-detail.component.html',
  styleUrls: ['./archive-detail.component.scss']
})
export class ArchiveDetailComponent implements OnInit {

  status: string = "";
  ARLink: string | null = "";
  Nick: string = "";
  Pass: string = "";
  Token: string = "";
  CurrentArchive: Archive | null = null;
  ARID: string = "";
  isLoginModalActive: boolean = false;
  modalstatus: string = "";
  Processing: boolean = false;
  Downloadable: Boolean = false;

  @ViewChild('loadstate1') loadbutton1!: ElementRef;
  @ViewChild('loadstate2') loadbutton2!: ElementRef;
  @ViewChild('loadstate3') loadbutton3!: ElementRef;
  constructor(
    private Sanitizer: DomSanitizer,
    private TGEnc: TsugeGushiService,
    private CMService: CommentService,
    private AccService: AccountService,
    private RateService: RatingService,
    private RouteParam: ActivatedRoute,
    private WPServ: WPproxyService,
    private Router: Router
  ) { }

  ngOnInit(): void {
    let test = localStorage.getItem("MChatToken")
    if (test != undefined) {
      let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
      this.Nick = TokenData["Room"];
      this.Token = TokenData["Token"];
    }

    this.ARLink = this.RouteParam.snapshot.paramMap.get('ArLink');
    if (this.ARLink != null) {
      var dt;

      if (this.Nick != "") {
        dt = {
          Link: this.ARLink.replace("%20", " "),
          Nick: this.Nick
        }
      } else {
        dt = {
          Link: this.ARLink,
        }
      }

      this.CMService.GetArchiveData(this.TGEnc.TGEncoding(JSON.stringify(dt))).subscribe(
        (response) => {
          if (response.status != 200) {
            setTimeout(() => {
              this.Router.navigate(['archive']);
            }, 5000);
            this.status = "UNABLE TO ACCESS ARCHIVE.";
            return;
          }

          let dt = JSON.parse(response.body);
          this.ARID = dt["_id"];
          this.CurrentArchive = {
            Room: dt["Room"],
            Nick: dt["Nick"],
            Pass: dt["Pass"],
            Link: dt["Link"],
            StreamLink: dt["StreamLink"],
            Tags: dt["Tags"],
            Star: dt["Star"],
            Note: dt["Note"],
          }

          if (!dt["Downloadable"]){
            this.Downloadable = false;
          } else {
            this.Downloadable = dt["Downloadable"];
          }

          if (!this.CurrentArchive.Star) {
            this.CurrentArchive.Star = 0;
          }
          this.RepopulateComment();

          if (this.Nick != "") {
            this.CheckRating();
          }
        },
        (error) => {
          setTimeout(() => {
            this.Router.navigate(['archive']);
          }, 5000);
          this.status = "UNABLE TO ACCESS ARCHIVE, REDIRECTING BACK.";
          return;
        }
      );
    } else {
      this.Router.navigate(['archive']);
    }
  }

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustUrl("m-chad://Archive/" + url.replace(" ", "%20"));
    } else {
      return ("Error");
    }
  }

  RoomNameClick(RoomName: string | undefined) {
    if (RoomName != undefined) {
      this.Router.navigate(['room', RoomName]);
    }
  }

  //------------------------------------------------------- LOGIN HANDLER -------------------------------------------------------
  Login(): void {
    this.modalstatus = "";
    this.loadbutton3.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton3.nativeElement.classList.remove('is-loading');
      if (!this.Processing) {
        this.Processing = true;
        this.AccService.GetTokenPublic(this.Nick, this.Pass).subscribe({
          error: error => {
            setTimeout(() => {
            }, 2000);
            this.modalstatus = "WRONG PASSWORD/USERNAME";
            this.Nick = "";
            this.Pass = "";
            localStorage.removeItem("MChatToken");
            this.Processing = false;
          },
          next: data => {
            this.modalstatus = "LOGIN SUCCESS"
            if (data.body[0]["Role"] == "TL") {
              localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
                Room: this.Nick,
                Token: data.body[0]["Token"],
                Role: "TL"
              })));
            } else {
              localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
                Room: this.Nick,
                Token: data.body[0]["Token"]
              })));
            }
            location.reload();
          }
        });
      }
    }, 1000); // delay for button loading

  }

  CloseLoginModal(): void {
    this.isLoginModalActive = !this.isLoginModalActive;
  }
  //======================================================= LOGIN HANDLER =======================================================



  //------------------------------------------------------- COMMENT HANDLER -------------------------------------------------------
  newcomment: string = "";
  editcomment: string = "";
  CommentsList: Comment[] = [];
  SelectedComment: number = -1;
  isDeleteModalActive: boolean = false;
  isEditModalActive: boolean = false;

  AddComment(): void {
    this.status = "";
    this.loadbutton1.nativeElement.classList.add("is-loading");
    setTimeout(() => {
      this.loadbutton1.nativeElement.classList.remove("is-loading");
      if ((!this.Processing) || (this.newcomment.length != 0)) {
        if (!localStorage.getItem("MChatToken")) {
          this.Nick = "";
          this.Token = "";
          this.isLoginModalActive = !this.isLoginModalActive;
          this.Pass = "";
          this.modalstatus = "";
          return;
        }

        this.Processing = true;

        this.CMService.CommentPost(this.TGEnc.TGEncoding(JSON.stringify({
          Act: "Add",
          Nick: this.Nick,
          Token: this.Token,
          content: this.newcomment,
          TStamp: Math.floor(Date.now() / 1000).toString(),
          ARID: this.ARID
        }))).subscribe(
          (response) => {
            this.Processing = false;
            this.newcomment = "";
            this.RepopulateComment();
          },
          (error) => {
            this.status = error.error;
            this.Processing = false;

            if (error.error == "ERROR : INVALID TOKEN") {
              this.isLoginModalActive = !this.isLoginModalActive;
              this.Pass = "";
              this.modalstatus = "";
            }
          }
        )
      }
    }, 1000); // delay for loading

  }

  RemoveComment(): void {
    if ((!this.Processing) || ((this.SelectedComment != -1) && (this.SelectedComment < this.CommentsList.length))) {
      this.Processing = true;

      this.CMService.CommentPost(this.TGEnc.TGEncoding(JSON.stringify({
        Act: "Delete",
        Nick: this.Nick,
        Token: this.Token,
        TStamp: this.CommentsList[this.SelectedComment].TStamp,
        ARID: this.ARID
      }))).subscribe(
        (response) => {
          this.Processing = false;
          this.CloseDeleteModal();
          this.RepopulateComment();
        },
        (error) => {
          this.status = error.error;
          this.Processing = false;

          if (error.error == "ERROR : INVALID TOKEN") {
            this.isLoginModalActive = !this.isLoginModalActive;
            this.Pass = "";
            this.modalstatus = "";
            this.CloseDeleteModal();
            this.RepopulateComment();
          }
        }
      )
    }
  }

  OpenDeleteModal(index: number): void {
    if (!localStorage.getItem("MChatToken")) {
      this.Nick = "";
      this.Token = "";
      this.isDeleteModalActive = false;
      this.isLoginModalActive = true;
      this.Pass = "";
      this.modalstatus = "";
      return;
    }
    else {
      this.isDeleteModalActive = !this.isDeleteModalActive;
      this.SelectedComment = index;
    }
  }

  CloseDeleteModal(): void {
    this.isDeleteModalActive = !this.isDeleteModalActive;
    this.SelectedComment = -1;
  }

  EditComment(): void {
    this.status = "";
    this.loadbutton2.nativeElement.classList.add("is-loading");
    setTimeout(() => {
      this.loadbutton2.nativeElement.classList.remove("is-loading");
      if ((!this.Processing) || ((this.SelectedComment != -1) && (this.SelectedComment < this.CommentsList.length))) {
        this.Processing = true;

        this.CMService.CommentPost(this.TGEnc.TGEncoding(JSON.stringify({
          Act: "Edit",
          Nick: this.Nick,
          Token: this.Token,
          TStamp: this.CommentsList[this.SelectedComment].TStamp,
          content: this.editcomment + " (edited)",
          ARID: this.ARID
        }))).subscribe(
          (response) => {
            this.Processing = false;
            this.CloseEditModal();
            this.RepopulateComment();
          },
          (error) => {
            this.status = error.error;
            this.Processing = false;

            if (error.error == "ERROR : INVALID TOKEN") {
              this.isLoginModalActive = !this.isLoginModalActive;
              this.Pass = "";
              this.modalstatus = "";
              this.CloseEditModal();
              this.RepopulateComment();
            }
          }
        )
      }
    }, 1000); // delay for loading

  }

  OpenEditModal(index: number): void {
    if (!localStorage.getItem("MChatToken")) {
      this.Nick = "";
      this.Token = "";
      this.isEditModalActive = false;
      this.isLoginModalActive = true;
      this.Pass = "";
      this.modalstatus = "";
      return;
    }
    else
      this.isEditModalActive = !this.isEditModalActive;

    let test = this.CommentsList[index].Content;
    if (test != undefined) {
      this.editcomment = test;
    }

    this.SelectedComment = index;
  }

  CloseEditModal(): void {
    this.isEditModalActive = !this.isEditModalActive;
    this.SelectedComment = -1;
  }

  RepopulateComment(): void {
    this.CommentsList = [];
    this.CMService.CommentPost(this.TGEnc.TGEncoding(JSON.stringify({
      Act: "Request",
      ARID: this.ARID
    }))).subscribe(
      (response) => {
        this.CommentsList = JSON.parse(response.body);
      },
      (error) => {
        this.status = error.error;
      }
    );
  }
  //======================================================= COMMENT HANDLER =======================================================



  //-------------------------------------------------------- RATING HANDLER --------------------------------------------------------
  RatingBtn: string = "☆"
  //☆ or ★ (Rated)

  CheckRating() {
    if ((this.Nick != "") && (this.ARID != "")) {
      this.RateService.RatingPost(this.TGEnc.TGEncoding(JSON.stringify({
        Act: "Check",
        Nick: this.Nick,
        ARID: this.ARID
      }))).subscribe(
        (response) => {
          if (response.body == "True") {
            this.RatingBtn = "★ (Rated)"
          } else {
            this.RatingBtn = "☆"
          }
        },
        (error) => {
          this.RatingBtn = "☆"
        }
      )
    }
  }

  RatingBtnClick() {
    if (!localStorage.getItem("MChatToken")) {
      this.Nick = "";
      this.Token = "";
      this.isLoginModalActive = !this.isLoginModalActive;
      this.Pass = "";
      this.modalstatus = "";
      return;
    }
    if ((this.Nick != "") && (this.ARID != "") && (!this.Processing)) {

      if (this.RatingBtn == "☆") {
        this.Processing = true;
        this.RateService.RatingPost(this.TGEnc.TGEncoding(JSON.stringify({
          Act: "Add",
          Nick: this.Nick,
          Token: this.Token,
          ARID: this.ARID
        }))).subscribe(
          (response) => {
            this.Processing = false;
            if (response.body == "Ok") {
              this.RatingBtn = "★ (Rated)"
              var test = this.CurrentArchive?.Star;
              if ((test != null) && (this.CurrentArchive != null)) {
                test += 1;
                this.CurrentArchive.Star = test;
              }
            } else {
              this.RatingBtn = "★ (Rated)"
            }
          },
          (error) => {
            this.Processing = false;
            if (error.error == "ERROR : INVALID TOKEN") {
              this.isLoginModalActive = !this.isLoginModalActive;
              this.Pass = "";
              this.modalstatus = "";
            }
          }
        )
      } else {
        this.Processing = true;
        this.RateService.RatingPost(this.TGEnc.TGEncoding(JSON.stringify({
          Act: "Delete",
          Nick: this.Nick,
          Token: this.Token,
          ARID: this.ARID
        }))).subscribe(
          (response) => {
            this.Processing = false;
            if (response.body == "OK") {
              this.RatingBtn = "☆"
              var test = this.CurrentArchive?.Star;
              if ((test != null) && (this.CurrentArchive != null)) {
                test -= 1;
                this.CurrentArchive.Star = test;
              }
            }
          },
          (error) => {
            this.Processing = false;
            if (error.error == "ERROR : INVALID TOKEN") {
              this.isLoginModalActive = !this.isLoginModalActive;
              this.Pass = "";
              this.modalstatus = "";
            }
          }
        )
      }
    }
  }
  //======================================================== RATING HANDLER ========================================================



  //------------------------------------- EXPORT MODULES -------------------------------------
  PassModal: boolean = false;
  isDownloadModalActive: boolean = false;
  @ViewChild('loadstatesrt') loadbuttonsrt!: ElementRef;
  @ViewChild('loadstateass') loadbuttonass!: ElementRef;
  @ViewChild('loadstatettml') loadbuttonttml!: ElementRef;
  @ViewChild('show_hidden') showhidden!: ElementRef;
  @ViewChild('loadstate4') loadbutton4!: ElementRef;
  Entriesdt: Entries[] = [];
  passretry:number = 0;

  TryDownload():void {
    this.loadbutton4.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton4.nativeElement.classList.remove('is-loading');
      this.showhidden.nativeElement.classList.remove('is-hidden');
      setTimeout(() => {
        this.showhidden.nativeElement.classList.add('is-hidden');
        if (this.CurrentArchive?.Room != undefined){
          this.WPServ.getArchive(this.TGEnc.TGEncoding(JSON.stringify({
            Act: 'GetArchive',
            ARLink: this.CurrentArchive.Link,
            Pass: this.Pass
          }))).subscribe(
            (response) => {
              this.Entriesdt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"])).map((e: Entries) => {
                return e;
              });
              this.PassModal = false;
            },
            (err) => {
              if ((err.error == "ERROR : ARCHIVE IS PASSWORD PROTECTED, PLEASE SUBMIT PASSWORD IN THE PAYLOAD") || (err.error == "ERROR : PASSWORD DOES NOT MATCH")){
                if (this.passretry < 4){
                  this.passretry++;
                  this.Pass = "";
                  this.modalstatus = "WRONG PASSWORD";
                } else {
                  this.isDownloadModalActive = !this.isDownloadModalActive;
                }              
              }
            }
          )
        }
      }, 3000);
    }, 1000);
  }

  DownloadBtnClick(): void{
    if (this.CurrentArchive != null){
      if (this.CurrentArchive.Pass != null){
        this.Pass = "";
        this.passretry = 0;
        this.Entriesdt = [];
        this.PassModal = this.CurrentArchive.Pass;
        this.isDownloadModalActive = true;
        this.modalstatus = "";
      }      
    }
  }

  LoadEntries(mode: string): void {
    if (this.Entriesdt.length == 0) {
      this.status = "";
      switch (mode) {
        case 'srt':
          this.loadbuttonsrt.nativeElement.classList.add('is-loading');
          break;
        case 'ass':
          this.loadbuttonass.nativeElement.classList.add('is-loading');
          break;
        case 'TTML':
          this.loadbuttonttml.nativeElement.classList.add('is-loading');
          break;
        default:
          break;
      }
      setTimeout(() => {
        this.loadbuttonsrt.nativeElement.classList.remove('is-loading');
        this.loadbuttonass.nativeElement.classList.remove('is-loading');
        this.loadbuttonttml.nativeElement.classList.remove('is-loading');
        this.showhidden.nativeElement.classList.remove('is-hidden');
        setTimeout(() => {
          this.showhidden.nativeElement.classList.add('is-hidden');
          if (this.CurrentArchive?.Room != undefined){
            this.WPServ.getArchive(this.TGEnc.TGEncoding(JSON.stringify({
              Act: 'GetArchive',
              ARLink: this.CurrentArchive.Link,
            }))).subscribe(
              (response) => {
                this.Entriesdt = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"])).map((e: Entries) => {
                  return e;
                });
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
              }
            )
          }
        }, 3000);
      }, 1000);
    } else {
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
    }
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
    saveAs(blob, this.CurrentArchive?.Nick + ".srt");
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
    saveAs(blob, this.CurrentArchive?.Nick + ".ass");
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
    saveAs(blob, this.CurrentArchive?.Nick + ".TTML");
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
  //===================================== EXPORT MODULES =====================================



  faUser = faUser;
  faLock = faLock;
  faUnlock = faUnlock;
  faEdit = faEdit;
  faTrash = faTrash;
  faReply = faReply;
}
