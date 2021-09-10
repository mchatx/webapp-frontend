import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { faLock, faUser, faEnvelope, faMailBulk } from '@fortawesome/free-solid-svg-icons';
import Room from 'src/app/models/Room';
import { AccountService } from '../services/account.service'

@Component({
  selector: 'app-new-room',
  templateUrl: './new-room.component.html',
  styleUrls: ['./new-room.component.scss']
})
export class NewRoomComponent implements OnInit {
  Data: Room = {
    Nick: "",
    Pass: "",
    Link: "",
    Contact: "",
    Agree: false
  }

  submitted: boolean = false;
  status: string | undefined;
  Passconfirm: string | undefined;

  constructor(
    private AService: AccountService
  ) { }

  ngOnInit(): void {
  }

  PushData(): void {
    this.status = "";
    if ((this.Data.Pass == "") || (this.Data.Contact == "") || (this.Data.Nick == "") || (this.Data.Agree == false)) {
      this.status = "Please fill in all the required fields!";
      this.Data.Pass = "";
      this.Passconfirm = "";
    } else if (this.Data.Pass != this.Passconfirm) {
      this.status = "Password does not match!"
      this.Passconfirm = "";
      this.Data.Pass = "";
    } else if ((this.Data.Pass != undefined) && (this.Data.Contact != undefined) && (this.Data.Nick != undefined) && (this.Data.Link != undefined)){
      if (this.submitted == false){
        this.AService.PushRoomApplication(this.Data.Nick, this.Data.Pass, this.Data.Link, this.Data.Contact).subscribe({
          error: error => {
            this.status = "ERROR SENDING DATA TO SERVER";
          },
          next: data => {
            this.status = "Application has been sent and will be reviewed ASAP. Thank you.";
            this.submitted = true;
          }
        });
      } else {
        this.status = "Application has been sent and will be reviewed ASAP. Thank you.";
      }
    }
  }

  faLock = faLock;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faMailBulk = faMailBulk;
}
