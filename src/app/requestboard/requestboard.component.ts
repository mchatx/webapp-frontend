import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RequestService } from '../services/request.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { AccountService } from '../services/account.service';
import RequestCard from '../models/RequestCard';
import { faLock, faPlay, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-requestboard',
  templateUrl: './requestboard.component.html',
  styleUrls: ['./requestboard.component.scss']
})
export class RequestboardComponent implements OnInit {
  status: string = "";
  modalstatus: string = "";
  CheckLink: string = "";
  Processing: boolean = false;
  Nick: string = "";
  Token: string = "";
  Pass: string = "";
  isLoginModalActive: boolean = false;
  RequestData: RequestCard[] = [];
  @ViewChild('loadstate') loadbutton!: ElementRef;
  @ViewChild('loadstate1') loadbutton1!: ElementRef;
  @ViewChild('showhidden') showhidden!: ElementRef;
  constructor(
    private RService: RequestService,
    private TGEnc: TsugeGushiService,
    private AccService: AccountService
  ) { }

  ngOnInit(): void {
    let test = localStorage.getItem("MChatToken")
    if (test != undefined) {
      let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
      this.Nick = TokenData["Room"];
      this.Token = TokenData["Token"];
    }
    this.RepopulateData();
  }

  RepopulateData(): void {
    let dt = "";
    if (this.Nick == "") {
      dt = this.TGEnc.TGEncoding(JSON.stringify({
        Act: "Request"
      }))
    } else {
      dt = this.TGEnc.TGEncoding(JSON.stringify({
        Act: "Request",
        Nick: this.Nick
      }))
    }

    this.RService.GetRecentRequest(dt).subscribe(
      (response) => {
        this.RequestData = JSON.parse(response.body).map((e: RequestCard) => {
          if (e.Link != undefined) {
            e.Link = this.RService.ReverseLinkParser(e.Link);
          }
          return e;
        });
      }
    )

  }

  //------------------------------------------------------- LOGIN HANDLER -------------------------------------------------------
  Login(): void {
    this.modalstatus = "";
    this.loadbutton1.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton1.nativeElement.classList.remove('is-loading');
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

  AddRequest(index: number = -1): void {
    this.status = "";
    if (index == -1) {
      this.loadbutton.nativeElement.classList.add('is-loading');
      setTimeout(() => {
        this.loadbutton.nativeElement.classList.remove('is-loading');
        this.showhidden.nativeElement.classList.remove('is-hidden')
        setTimeout(() => {
          this.showhidden.nativeElement.classList.add('is-hidden')
          if (!this.Processing) {
            if (!localStorage.getItem("MChatToken")) {
              this.Nick = "";
              this.Token = "";
              this.isLoginModalActive = !this.isLoginModalActive;
              this.Pass = "";
              this.modalstatus = "";
              return;
            }


            let UID;
            if (index == -1) {
              UID = this.RService.LinkParser(this.CheckLink);
            } else {
              UID = this.RequestData[index].Link;
              if (UID != undefined) {
                UID = this.RService.LinkParser(UID);
              }
            }


            if (UID == "ERROR") {
              this.status = "INVALID LINK";
              return;
            }
            //this.status = "PROCESSING REQUEST";
            this.Processing = true;

            this.RService.RequestPost(this.TGEnc.TGEncoding(JSON.stringify({
              Act: "Add",
              Nick: this.Nick,
              Link: UID,
              Token: this.Token,
              insecure: true
            }))).subscribe(
              (response) => {
                this.status = "Request Sent";
                this.Processing = false;
                this.CheckLink = "";
                this.RepopulateData();
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
        }, 3000); // delay progress
      }, 1000); // button loading delay
    }
    else {
      this.showhidden.nativeElement.classList.remove('is-hidden')
      setTimeout(() => {
        this.showhidden.nativeElement.classList.add('is-hidden')
        if (!this.Processing) {
          if (!localStorage.getItem("MChatToken")) {
            this.Nick = "";
            this.Token = "";
            this.isLoginModalActive = !this.isLoginModalActive;
            this.Pass = "";
            this.modalstatus = "";
            return;
          }


          let UID;
          if (index == -1) {
            UID = this.RService.LinkParser(this.CheckLink);
          } else {
            UID = this.RequestData[index].Link;
            if (UID != undefined) {
              UID = this.RService.LinkParser(UID);
            }
          }


          if (UID == "ERROR") {
            this.status = "INVALID LINK";
            return;
          }
          //this.status = "PROCESSING REQUEST";
          this.Processing = true;

          this.RService.RequestPost(this.TGEnc.TGEncoding(JSON.stringify({
            Act: "Add",
            Nick: this.Nick,
            Link: UID,
            Token: this.Token,
            insecure: true
          }))).subscribe(
            (response) => {
              this.status = "Request from Board Sent";
              this.Processing = false;
              this.CheckLink = "";
              this.RepopulateData();
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
      }, 3000); // delay progress      
    }
  }

  RemoveRequest(index: number): void {
    this.status = "";
    this.showhidden.nativeElement.classList.remove('is-hidden')
    setTimeout(() => {
      this.showhidden.nativeElement.classList.add('is-hidden')
      if (!this.Processing) {
        if (!localStorage.getItem("MChatToken")) {
          this.Nick = "";
          this.Token = "";
          this.isLoginModalActive = !this.isLoginModalActive;
          this.Pass = "";
          this.modalstatus = "";
          return;
        }

        let UID = this.RequestData[index].Link;
        if (UID != undefined) {
          UID = this.RService.LinkParser(UID);
        }

        if (UID == "ERROR") {
          this.status = "INVALID LINK";
          return;
        }

        //this.status = "PROCESSING REQUEST";
        this.Processing = true;

        this.RService.RequestPost(this.TGEnc.TGEncoding(JSON.stringify({
          Act: "Delete",
          Nick: this.Nick,
          Link: UID,
          Token: this.Token
        }))).subscribe(
          (response) => {
            this.status = "Request for cancellation Sent";
            this.Processing = false;
            this.RepopulateData();
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
    }, 3000); // delay progress


  }


  faPlay = faPlay;
  faUser = faUser;
  faLock = faLock;
}
