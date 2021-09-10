import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AccountService } from '../services/account.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { Router } from '@angular/router';
import { faAt, faLock, faLink, faEnvelope, faCoffee, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faPatreon, faTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-accountpage',
  templateUrl: './accountpage.component.html',
  styleUrls: ['./accountpage.component.scss']
})
export class AccountpageComponent implements OnInit {
  ishiddendel: boolean = false;
  ishiddenemail: boolean = false;
  ishiddenpass: boolean = false;
  isModalActive: boolean = false;

  @ViewChild("loadstate") loadbutton !: ElementRef;

  Nick: string | null = "";
  EmailAddress: string = "";
  RoleTL: boolean = false;
  Links: string[] = [];
  LinksTemp: string[] = [];
  Note: string = "";
  NoteTemps: string = "";

  status: string = "";
  processing: boolean = false;
  mode: number = 0;

  FPEditmode: boolean = false;
  LinkInput: string = "";

  Pass: string = "";
  input1: string = "";
  input2: string = "";

  constructor(
    private AccService: AccountService,
    private Router: Router,
    private TGEnc: TsugeGushiService
  ) { }

  ngOnInit(): void {
    let rawdt = localStorage.getItem("MChatToken");
    if (rawdt != null) {
      let dt = JSON.parse(this.TGEnc.TGDecoding(rawdt));
      this.AccService.GetAccountData(
        this.TGEnc.TGEncoding(JSON.stringify({
          Nick: dt["Room"]
        }))
      ).subscribe({
        error: error => {
          this.Router.navigate(['']);
        },
        next: data => {
          dt = JSON.parse(data["body"]);
          this.Nick = dt["Nick"];
          this.EmailAddress = dt["Email"];
          if (dt["Role"] != undefined) {
            if (dt["Role"] == "TL") {
              this.RoleTL = true;
            }
          }
          if (dt["Note"] != undefined) {
            this.Note = dt["Note"];
          }
          if (dt["Links"] != undefined) {
            this.Links = dt["Links"];
          }
        }
      });
    } else {
      this.Router.navigate(['login']);
    }
  }

  DeleteAccount(): void {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      if (this.input1 != this.Nick) {
        this.input1 = "";
      } else if (!this.processing) {
        this.processing = true;
        this.AccService.PostDeleteAccount(
          this.TGEnc.TGEncoding(JSON.stringify({
            Nick: this.Nick,
            Pass: this.Pass
          }))
        ).subscribe({
          error: error => {
            this.status = error["error"];
            this.processing = false;
          },
          next: data => {
            localStorage.removeItem("MChatToken");
            this.status = "Account has been deleted, redirecting now"
            setTimeout(() => {
              location.reload();
            }, 7000);
          }
        });
      }
    }, 1000); //delay for loading

  }

  ChangeMode(modechange: number) {
    if ((this.mode != modechange) && (!this.processing)) {
      this.mode = modechange;
      this.input1 = "";
      this.input2 = "";
      this.Pass = "";
      this.status = "";
      if (modechange == 0) {
        this.isModalActive = false;
        this.ishiddenemail = false;
        this.ishiddenpass = false;
        this.ishiddendel = false;
      }
      if (modechange == 1) {
        this.ishiddenpass = !this.ishiddenpass;
        this.ishiddendel = !this.ishiddendel;
      }
      if (modechange == 2) {
        this.ishiddenemail = !this.ishiddenemail;
        this.ishiddendel = !this.ishiddendel;
      }
      if (modechange == 3) {
        this.isModalActive = !this.isModalActive;
        this.ishiddenemail = !this.ishiddenemail;
        this.ishiddenpass = !this.ishiddenpass;
      }
    }
  }

  ChangePass(): void {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      if (this.input1 != this.input2) {
        this.input1 = "";
        this.input2 = "";
        this.Pass = "";
        this.status = "PASS DOESN'T MATCH";
        return;
      }

      if (!this.processing) {
        this.status = "";
        this.processing = true;
        this.AccService.PostChangePass(
          this.TGEnc.TGEncoding(JSON.stringify({
            Nick: this.Nick,
            Pass: this.Pass,
            NewPass: this.input1
          }))
        ).subscribe({
          error: error => {
            this.status = error["error"];
            this.processing = false;
            this.Pass = "";
          },
          next: data => {
            this.mode = 0;
            this.status = "Password has been changed."
            this.processing = false;
          }
        });
      }
    }, 1000);  //delay for loading 
  }

  ChangeEmail(): void {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      if (!this.processing) {
        this.status = "";
        this.processing = true;
        this.AccService.PostChangeEmail(
          this.TGEnc.TGEncoding(JSON.stringify({
            Nick: this.Nick,
            Pass: this.Pass,
            NewEmail: this.input1
          }))
        ).subscribe({
          error: error => {
            this.status = error["error"];
            this.Pass = "";
            this.input1 = "";
            this.input2 = "";
            this.processing = false;
          },
          next: data => {
            this.EmailAddress = this.input1;
            this.mode = 0;
            this.processing = false;
          }
        });
      }
    }, 1000); //delay for loading

  }

  OpenFPEdit() {
    this.FPEditmode = true;
    this.LinksTemp = this.Links.slice();
    this.NoteTemps = this.Note;
    this.LinkInput = "";
  }

  CancelFPEdit() {
    this.FPEditmode = false;
  }

  SaveFPEdit() {
    if (!this.processing) {
      this.status = "";
      this.processing = true;
      this.AccService.PostChangeFPInfo(
        this.TGEnc.TGEncoding(JSON.stringify({
          Nick: this.Nick,
          Note: this.NoteTemps,
          Links: this.LinksTemp
        }))
      ).subscribe({
        error: error => {
          this.status = error["error"];
          this.processing = false;
        },
        next: data => {
          this.FPEditmode = false;
          this.Links = this.LinksTemp.slice();
          this.Note = this.NoteTemps;
          this.processing = false;
        }
      });
    }
  }

  DeleteFPLinks(index: number) {
    this.LinksTemp.splice(index, 1);
  }

  AddLink() {
    if (this.LinkInput != "") {
      this.LinksTemp.push(this.LinkInput);
      this.LinkInput = "";
    }
  }

  CheckLink(link: string): string {
    let MatchResult = link.match(/mail\.com|youtube\.com\/channel\/|ko-fi\.com\/|www\.patreon\.com\/|twitter\.com\//g);
    if (MatchResult != null) {
      return MatchResult[0];
    } else {
      return "Neutral";
    }
  }

  faLock = faLock;
  faAt = faAt;
  faLink = faLink;
  faEnvelope = faEnvelope;
  faCoffee = faCoffee;
  faDiscord = faDiscord;
  faPatreon = faPatreon;
  faYoutube = faYoutube;
  faPlus = faPlus;
  faTwitter = faTwitter;
}
