import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faDownload, faUserAlt, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { TsugeGushiService } from '../services/tsuge-gushi.service'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  constructor(
    private TGEnc: TsugeGushiService
  ) { }

  LoggedIn: boolean = false;
  AccountName: string = "";
  TL: boolean = false;

  ngOnInit(): void {
    let test: string | null = localStorage.getItem("MChatToken");
    if (test != undefined) {
      try {
        let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
        this.AccountName = TokenData["Room"];

        if (TokenData["Role"] == "TL"){
          this.TL = true;
        }

        this.LoggedIn = true;
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }
  }

  LogoutButtonPush(): void {
    localStorage.removeItem("MChatToken");
    this.LoggedIn = false;
    this.AccountName = "";
    location.reload();
  }

  @ViewChild('navBurger') navBurger!: ElementRef;
  @ViewChild('navMenu') navMenu!: ElementRef;

  toggleNavbar() {
    this.navBurger.nativeElement.classList.toggle('is-active');
    this.navMenu.nativeElement.classList.toggle('is-active');
  }

  faDiscord = faDiscord;
  faDownload = faDownload;
  faUser = faUser;
  faUserAlt = faUserAlt;
  faSignInAlt = faSignInAlt;
  faSignOutAlt = faSignOutAlt;

}
