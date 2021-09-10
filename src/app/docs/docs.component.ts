import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { faWindows, faAndroid, faLinux, faApple, } from '@fortawesome/free-brands-svg-icons';
import { faDownload, faExternalLinkAlt, faEdit, faTimes, faAssistiveListeningSystems, faLanguage, faFile, faFileArchive } from '@fortawesome/free-solid-svg-icons';
import { faCalendarPlus, faCalendarMinus } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {
  isModal1Active: boolean = false;
  isModal2Active: boolean = false;
  isModal3Active: boolean = false;
  isModal4Active: boolean = false;
  isModal5Active: boolean = false;
  isModal6Active: boolean = false;
  isModal7Active: boolean = false;
  isModal8Active: boolean = false;
  isModal9Active: boolean = false;
  isModal10Active: boolean = false;
  isModal11Active: boolean = false;
  isModal12Active: boolean = false;
  isModal13Active: boolean = false;
  ngOnInit(): void {
  }

  toggleModal1() {
    this.isModal1Active = !this.isModal1Active;
  }
  toggleModal2() {
    this.isModal2Active = !this.isModal2Active;
  }
  toggleModal3() {
    this.isModal3Active = !this.isModal3Active;
  }
  toggleModal4() {
    this.isModal4Active = !this.isModal4Active;
  }
  toggleModal5() {
    this.isModal5Active = !this.isModal5Active;
  }
  toggleModal6() {
    this.isModal6Active = !this.isModal6Active;
  }
  toggleModal7() {
    this.isModal7Active = !this.isModal7Active;
  }
  toggleModal8() {
    this.isModal8Active = !this.isModal8Active;
  }
  toggleModal9() {
    this.isModal9Active = !this.isModal9Active;
  }
  toggleModal10() {
    this.isModal10Active = !this.isModal10Active;
  }
  toggleModal11() {
    this.isModal11Active = !this.isModal11Active;
  }
  toggleModal12() {
    this.isModal12Active = !this.isModal12Active;
  }
  toggleModal13() {
    this.isModal13Active = !this.isModal13Active;
  }

  faWindows = faWindows;
  faAndroid = faAndroid;
  faLinux = faLinux;
  faApple = faApple;
  faDownload = faDownload;
  faExternalLinkAlt = faExternalLinkAlt;
  faCalenderPlus = faCalendarPlus;
  faCalenderMinus = faCalendarMinus;
  faEdit = faEdit;
  faTimes = faTimes;
  faAssistiveListeningSystems = faAssistiveListeningSystems;
  faLanguage = faLanguage;
  faFile = faFile;
  faFileArchive = faFileArchive;

  code1 = `{
    "Nick" : "Testing",
    "EntryPass" : true,
    "Empty" : false,
    "StreamLink" : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  
  }
  `;
  code2 = `{
    "Nick" : "Test Script",
    "Link" : "MonMon TL_2020-12-04_15-03-35",
    "Pass" : false  
  }
  `;
  code3 = '{ "link":"MonMon TL_2020-12-04_15-03-35" }';
  code4 = `{
    "Stime" : "35600",
    "Stext" : "Enjoy The Stream",
    "CC" : "009B48",
    "OC" : "D6006E"  
  }
  `;
  code5 = ` var es = new EventSource('http://[mimimimiooon]/Listener/?room=Testing', { withCredentials: true});`;
  code6 = `{
    "Room" : "Testing",
    "Link" : "Just a Test",
    "Note" : "Testing Note",
    "Time" : 1616047080000,  
    "Tags" : "Seiso"
  }
  `;

  code7 = `
    data: {
      "flag": "new",
      "content": "{
        "_id": "6135542d4b8b1f1d98ee6e63",
        "Room": "Kamishiro Taishi",
        "Link": "Kamishiro Taishi_2021-09-05_23-35-08",
        "Nick": "[2021.09.06] Ookami Mio - AsaMio",
        "Hidden": false,
        "Pass": false,
        "StreamLink": "https://youtu.be/6Hsrgci3wQQ",
        "Tags": "en",
        "ExtShare": true,
        "Downloadable": true
      }"
    }
  `;

  code8 = `
    data: {
      "flag": "new",
      "content": "{
        "Nick": "MonMon TL",
        "EntryPass": false,
        "StreamLink": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "Tags": "en",
        "ExtShare": false
      }"
    }
  `;
}
