import { Component, OnInit } from '@angular/core';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { AccountService } from '../services/account.service';
import { Router } from '@angular/router';

//   ICONS
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-restartpass',
  templateUrl: './restartpass.component.html',
  styleUrls: ['./restartpass.component.scss']
})
export class RestartpassComponent implements OnInit {
  EmailAddress: string = "";
  status: string = "";
  Processing: boolean = false;

  faEnvelope = faEnvelope;

  constructor(
    private Router: Router,
    private TGEnc: TsugeGushiService,
    private AccService: AccountService
  ) { }

  ngOnInit(): void {
    if (localStorage.getItem("MChatToken") != undefined){    
      this.Router.navigate(['']);
    }
  }

  ResetPass(){
    if (this.EmailAddress == ""){
      this.status = "Please fill in your email address.";
      return;
    }

    if (!this.Processing){
      this.Processing = true;
      this.AccService.PostResetPass(
        this.TGEnc.TGEncoding(JSON.stringify({
          Email: this.EmailAddress
        }))
      ).subscribe({
        error: error => {
          this.status = error["error"];
          this.EmailAddress = "";
          this.Processing = false;
        },
        next: data => {
          this.status = "NEW TEMPORARY PASSWORD WILL BE SENT TO YOUR EMAIL SOON (TM)."
          setTimeout(() => {
            this.Router.navigate(['login']);
          }, 2000);
        }
      });    
    }
  }

}
