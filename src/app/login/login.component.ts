import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../services/account.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';

// ICONS
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  @ViewChild('loadstate') loadbutton!: ElementRef;
  status: string = "";
  Nick: string = "";
  Pass: string = "";
  Processing: boolean = false;

  // ICONS
  faUser = faUser;
  faLock = faLock;

  constructor(
    private AccService: AccountService,
    private TGEnc: TsugeGushiService,
    private Router: Router
  ) { }

  ngOnInit(): void {
    if (localStorage.getItem("MChatToken") != undefined) {
      this.Router.navigate(['']);
    }
  }

  LoginTry(): void {
    this.status = "";
    this.loadbutton.nativeElement.classList.add('is-loading');
    setTimeout(() => {
      this.loadbutton.nativeElement.classList.remove('is-loading');
      if (!this.Processing) {
        this.Processing = true;
        this.AccService.GetTokenPublic(this.Nick, this.Pass).subscribe({
          error: error => {
            setTimeout(() => {
            }, 2000);
            this.status = "WRONG PASSWORD/ROOM NAME";
            this.Nick = "";
            this.Pass = "";
            localStorage.removeItem("MChatToken");
            this.Processing = false;
          },
          next: data => {
            this.status = "LOGIN SUCCESS"
            if (data.body[0]["Role"] == "TL") {
              localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
                Room: this.Nick,
                Token: data.body[0]["Token"],
                Role: "TL"
              })));
              location.reload();
            } else {
              localStorage.setItem("MChatToken", this.TGEnc.TGEncoding(JSON.stringify({
                Room: this.Nick,
                Token: data.body[0]["Token"]
              })));
              location.reload();
            }
          }
        });
      }
    }, 1000); //delay for button loading    
  }
}
