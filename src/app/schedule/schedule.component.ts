import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ScheduleService } from '../services/schedule.service';
import ScheduleData from '../models/Schedule';
import ScheduleDisplay from '../models/ScheduleDisplay';
import { faEdit, faSearch, faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { faCalendarPlus, faCalendarMinus } from '@fortawesome/free-regular-svg-icons';
import { DomSanitizer } from '@angular/platform-browser';

//  TO DIVIDE THE SCHEDULE DEPENDING ON THE DAYS BASED ON LOCAL TIME
type Pager = {
  Timestamp: string,
  DataList: ScheduleDisplay[]
};

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit{

  SchedulePage: Pager[] = [];   //  DIVIDE SCHEDULE INTO PAGES BASED ON LOCAL TIME DAY
  SearchRoom: string = "";
  SearchLink: string = "";
  SearchTags: string = "";

  constructor(
    private SService: ScheduleService,
    private Sanitizer: DomSanitizer
  ) { }

  timer:any;
  Failcount : number = 0;
  JumpToContainer(index : string): void {
    this.Failcount++;
    let DOMtarget = document.getElementById( index + " Container");
    if (DOMtarget != null){
      //DOMtarget.setAttribute("AttributeA", "ValueX");
      //DOMtarget.className = "box m-4 animate__animated animate__fadeInUp is-active";
      //DOMtarget.scrollIntoView();
      clearInterval(this.timer);
    }
    if (this.Failcount == 5){
      clearInterval(this.timer);
    }
  }

  ngOnInit(): void {
    this.SService.getSchedule().subscribe(
      (response) => {
        this.PopulatePager(response, true); // PARSE AND DIVIDE THE INCOMING RESPONSE INTO PAGES
      }
    )
  }

  PopulatePager(Data: ScheduleData[], InitJump: boolean = false): void {
    while (this.SchedulePage.length > 0) {
      this.SchedulePage.pop();
    }

    let Startnum: number = Date.now() - ((new Date()).getHours() + 24) * 3600 * 1000 - (new Date()).getMinutes() * 60 * 1000;

    let index: number = -1;
    let created: boolean = false;
    let todayindex: number = -1;

    let i:number = 0;

    Data.map(e => {
      if (e.Time != undefined) {
        while (e.Time > Startnum) {
          created = false;
          Startnum += 24 * 3600 * 1000;
        }

        if (created == false) {
          if (Date.now() > Startnum){
            todayindex++;
          }

          let Stamp: string = (new Date(Startnum - ((new Date().getTimezoneOffset() + 24.0 * 60.0) * 60.0 * 1000.0))).toISOString();
          this.SchedulePage.push({
            Timestamp: Stamp.substr(0, 10),
            DataList: [],
          });
          created = true;
          index++;
        }

        let Stamp: string = (new Date(e.Time - (new Date().getTimezoneOffset() * 60.0 * 1000.0))).toISOString();
        this.SchedulePage[index].DataList.push({
          Room: e.Room,
          Link: e.Link,
          Note: e.Note,
          Time: Stamp.substr(0, 10) + " " + Stamp.substr(11, 5),
          Tag: e.Tag,
        });
      }

      i++;

      //  ACTIVATE JUMP TO CONTAINER
      if ((i == Data.length) && (InitJump)){
        this.Failcount = 0;
        this.timer = setInterval(() => {
          this.JumpToContainer((todayindex + 1).toString());
        }, 1000);
      }
    });
  }

  SearchByRoom(): void {
    this.SService.getScheduleRoom(this.SearchRoom).subscribe(
      (response) => {
        this.PopulatePager(response);
      }
    )
  }

  SearchByLink(): void {
    this.SService.getScheduleLink(this.SearchLink).subscribe(
      (response) => {
        this.PopulatePager(response);
        this.SearchLink = "";
      }
    )
  }

  SearchByTags(): void {
    this.SService.getScheduleTags(this.SearchTags.replace(", ", "_").replace(" ", "_")).subscribe(
      (response) => {
        this.PopulatePager(response);
      }
    )
  }

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustUrl("m-chad://Room/" + url.replace(" ", "%20"));
    } else {
      return ("Error");
    }
  }

  ClearSearch(){
    this.SService.getSchedule().subscribe(
      (response) => {
        this.PopulatePager(response);
      }
    )
  }

  faRedoAlt = faRedoAlt;
  faSearch = faSearch;
  faCalenderPlus = faCalendarPlus;
  faCalenderMinus = faCalendarMinus;
  faEdit = faEdit;
}
