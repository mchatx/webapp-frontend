import { Component, OnInit, ViewChild, ElementRef, Inject, HostListener } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ScheduleService } from '../services/schedule.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { AccountService } from '../services/account.service';
import ScheduleData from '../models/Schedule';
import { faLock, faUser, faTags } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-schedule-edit',
  templateUrl: './schedule-edit.component.html',
  styleUrls: ['./schedule-edit.component.scss']
})
export class ScheduleEditComponent implements OnInit {
  isModalActive: boolean = false;
  isModalLogin: boolean = true;
  @ViewChild('loadstate') loadbutton!: ElementRef;
  @ViewChild('show_hidden') showhidden!: ElementRef;
  mode: string | null = "";
  LoginMode: boolean = false;
  status: string = "";
  SearchNick: string = "";
  SearchPass: string = "";
  ScheduleList: any;
  SelectedIndex: number = -1;
  SelectedSched: ScheduleData = {
    Room: "",
    Link: "",
    Note: "",
    Time: 0,
    Tag: ""
  };
  DateParser: String = "";
  TimeParser: String = "";
  windowScrolled: boolean | undefined;
  Token: string = "";

  constructor(@Inject(DOCUMENT) private document: Document,
    private RouteParam: ActivatedRoute,
    private ScheduleService: ScheduleService,
    private TGEnc: TsugeGushiService,
    private AccService: AccountService,
    private router: Router,
  ) { }
  @HostListener("window:scroll", [])
  onWindowScroll() {
    if (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop > 100) {
      this.windowScrolled = true;
    }
    else if (this.windowScrolled && window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop < 10) {
      this.windowScrolled = false;
    }
  }
  scrollToTop() {
    (function smoothscroll() {
      var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
      if (currentScroll > 0) {
        window.requestAnimationFrame(smoothscroll);
        window.scrollTo(0, currentScroll - (currentScroll / 8));
      }
    })();
  }

  ngOnInit(): void {
    this.LoginMode = false;
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
              this.SelectedSched.Room = TokenData["Room"];
              this.Token = TokenData["Token"];
              this.SearchNick = TokenData["Room"];
              if (this.mode != "Add") {
                this.LoadSchedule();
              }
            }
          });
        } else {
          this.status = "THIS ACCOUNT DOESN'T HAVE TL PRIVILEGE";
        }
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }

    this.mode = this.RouteParam.snapshot.paramMap.get('mode');

    let Today: string = (new Date(Date.now() - (new Date().getTimezoneOffset() * 60.0 * 1000.0))).toISOString();
    this.DateParser = Today.substr(0, 10);
    this.TimeParser = Today.substr(11, 5);
  }

  LoginRoom() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
    }, 1000);
    this.AccService.GetToken(this.SearchNick, this.SearchPass).subscribe({
      error: error => {
        setTimeout(() => {
        }, 2000);
        this.status = "WRONG PASSWORD/ROOM NAME";
        this.SearchNick = "";
        this.SearchPass = "";
        localStorage.removeItem("MChatToken");
      },
      next: data => {
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
  }

  AddSchedule() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      this.showhidden.nativeElement.classList.remove('is-hidden');
      setTimeout(() => {
        this.showhidden.nativeElement.classList.add('is-hidden');
        let time: string = ((new Date(this.DateParser + " " + this.TimeParser + ":00")).getTime()).toString();

        if (this.SelectedSched.Link == "") {
          this.status = "Stream Link Missing";
        } else if (Number.parseInt(time) < (Date.now())) {
          this.status = "Stream has already ended?";
        } else if (time == "NaN") {
          this.status = "Invalid Date";
        } else {
          this.SelectedSched.Room = this.SearchNick;
          this.SelectedSched.Time = Number.parseInt(time);

          this.ScheduleService.AddSchedule(this.SelectedSched.Room, this.Token, this.SelectedSched.Link, this.SelectedSched.Note, this.SelectedSched.Tag, this.SelectedSched.Time).subscribe({
            error: error => {
              this.status = error["error"];
              this.LoginMode = false;

              if (error["error"] == "ERROR : INVALID TOKEN") {
                localStorage.removeItem("MChatToken");
                location.reload();
              }
            },
            next: data => {
              this.status = "Schedule Added. Redirecting...";
              this.isModalActive = !this.isModalActive;
              setTimeout(() => {
                this.router.navigate(['/schedule']);
                this.scrollToTop();
              }, 3000); //3s
            }
          });
        }
      }, 3000);  //delay for progress
    }, 1000);   //delay for button loading
  }

  LoadSchedule() {
    this.ScheduleService.getSchedule(this.SelectedSched.Room).subscribe(
      (response) => {
        this.ScheduleList = response.map((e: any) => {
          if (e.Time != undefined) {
            let Stamp: string = (new Date(e.Time - (new Date().getTimezoneOffset() * 60.0 * 1000.0))).toISOString();
            return ({
              LocalTimeStr: Stamp.substr(0, 10) + " " + Stamp.substr(11, 5),
              ...e
            });
          } else {
            return (null);
          };
        })
      });
  }

  SetSelected(index: number) {
    this.SelectedIndex = index;
    this.SelectedSched.Link = this.ScheduleList[this.SelectedIndex].Link;
    this.SelectedSched.Time = this.ScheduleList[this.SelectedIndex].Time;
    this.SelectedSched.Note = this.ScheduleList[this.SelectedIndex].Note;
    this.SelectedSched.Tag = this.ScheduleList[this.SelectedIndex].Tag;
    this.DateParser = this.ScheduleList[this.SelectedIndex].LocalTimeStr.substr(0, 10);
    this.TimeParser = this.ScheduleList[this.SelectedIndex].LocalTimeStr.substr(11, 5);
  }

  SendUpdate() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      this.showhidden.nativeElement.classList.remove('is-hidden');
      setTimeout(() => {
        this.showhidden.nativeElement.classList.add('is-hidden');
        let time: string = ((new Date(this.DateParser + " " + this.TimeParser + ":00")).getTime()).toString();

        if (this.SelectedSched.Link == "") {
          this.status = "Needed Link";
        } else if (this.SelectedIndex == -1) {
          this.status = "Select a Schedule to Edit"
        }
        else if (time == "NaN") {
          this.status = "Invalid Date";
        } else {
          this.ScheduleService.EditSchedule(this.SelectedSched.Room, this.Token, this.SelectedSched.Link, this.SelectedSched.Note, this.SelectedSched.Tag, this.ScheduleList[this.SelectedIndex]._id, Number.parseInt(time)).subscribe({
            error: error => {
              this.status = error["error"];
              this.LoginMode = false;

              if (error["error"] == "ERROR : INVALID TOKEN") {
                localStorage.removeItem("MChatToken");
                location.reload();
              }
            },
            next: data => {
              this.status = "Schedule Updated. Redirecting...";
              this.isModalActive = !this.isModalActive;
              setTimeout(() => {
                this.router.navigate(['/schedule']);
                this.scrollToTop();
              }, 3000); //3s
            }
          });
        }
      }, 3000); //delay for progress bar
    }, 1000); //delay for button loading
  }

  RemoveSchedule() {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading')
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading')
      this.showhidden.nativeElement.classList.remove('is-hidden')
      setTimeout(() => {
        this.showhidden.nativeElement.classList.add('is-hidden')

        if (this.SelectedIndex != -1) {
          this.ScheduleService.DeleteSchedule(this.SelectedSched.Room, this.Token, this.ScheduleList[this.SelectedIndex]._id).subscribe({
            error: error => {
              this.status = error["error"];
              this.LoginMode = false;

              if (error["error"] == "ERROR : INVALID TOKEN") {
                localStorage.removeItem("MChatToken");
                location.reload();
              }
            },
            next: data => {
              this.status = "Schedule Removed. Redirecting...";
              this.isModalActive = !this.isModalActive;
              setTimeout(() => {
                this.router.navigate(['/schedule']);
                this.scrollToTop();
              }, 3000); //3s
            }
          });
        }
        else {
          this.status = "No Schedule Selected for Removal.";
        }
      }, 3000); // delay for progess bar
    }, 1000); //delay for button loading    
  }

  faUser = faUser;
  faLock = faLock;
  faYoutube = faYoutube;
  faTags = faTags;
}