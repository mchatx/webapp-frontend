import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service'

//  ICONS
import { faLock, faUser, faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  @ViewChild('loadstate') loadbutton!: ElementRef;
  Nick: string = "";
  Pass: string = "";
  ConfirmPass: string = "";
  status: string = "";
  EmailAddress: string = "";
  Processing: boolean = false;

  // ICONS
  faUser = faUser;
  faLock = faLock;
  faEnvelope = faEnvelope;

  constructor(
    private TGEnc: TsugeGushiService,
    private AccService: AccountService,
    private Router: Router
  ) { }

  ngOnInit(): void {
    if (localStorage.getItem("MChatToken") != undefined) {
      this.Router.navigate(['']);
    }
  }

  SignUpTry(): void {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      if ((this.Nick == "") || (this.EmailAddress == "")) {
        this.status = "Please fill all fields";
        return;
      }

      if (this.Pass != this.ConfirmPass) {
        this.Pass = "";
        this.ConfirmPass = "";
        this.status = "Password does not match";
        return;
      }

      if (!this.Processing) {
        this.Processing = true;
        this.AccService.PostSignUp(
          this.TGEnc.TGEncoding(JSON.stringify({
            Nick: this.Nick,
            Pass: this.Pass,
            Email: this.EmailAddress
          }))
        ).subscribe({
          error: error => {
            this.status = error["error"];
            this.Pass = "";
            this.ConfirmPass = "";
            this.Processing = false;
          },
          next: data => {
            this.status = "VERIFICATION EMAIL WILL BE SENT TO YOUR EMAIL ADDRESS SOON(TM)."
            setTimeout(() => {
              this.Router.navigate(['']);
            }, 2000);
          }
        });
      }
    }, 1000); //add delay to loading    
  }


}
