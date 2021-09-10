import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faStar, faLock, faLink, faEnvelope, faCoffee, faSearch, faRedoAlt, faChevronDown, faEdit, faAngleRight, faAngleDoubleRight, faAngleLeft, faAngleDoubleLeft } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faPatreon, faYoutube, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { AccountService } from '../services/account.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import { ArchiveService } from '../services/archive.service';
import Archive from '../models/Archive';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  RoomNick: string | null = "";
  RoleTL: boolean = false;
  Links: string[] = [];
  Note: string = "";
  ArchiveList: Archive[] = [];
  status: string = "";

  SearchLink: string = "";
  SearchTags: string = "";
  Search: string[] = ['Link', 'Tags'];
  SelectedIndex: number = 0;

  TotalPage: number = 0;
  CurrentPage: number = 1;
  PageArray: number[] = [1, 2, 3, 4, 5];
  SearchQuery: any;

  isSearchActive: boolean = true;
  
  TokenOwner: string | undefined;

  constructor(
    private RouteParam: ActivatedRoute,
    private AccService: AccountService,
    private Router: Router,
    private TGEnc: TsugeGushiService,
    private AService: ArchiveService,
    private Sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    let test: string | null = localStorage.getItem("MChatToken");
    if (test != undefined) {
      try {
        let TokenData = JSON.parse(this.TGEnc.TGDecoding(test));
        this.TokenOwner = TokenData["Room"];
      } catch (error) {
        localStorage.removeItem("MChatToken");
      }
    }

    if(this.RouteParam.snapshot.paramMap.get('Nick') != this.RoomNick){
      this.RoomNick = this.RouteParam.snapshot.paramMap.get('Nick');
      this.AccService.GetAccountData(
        this.TGEnc.TGEncoding(JSON.stringify({
          Nick: this.RoomNick
        }))
      ).subscribe({
        error: error => {
          this.Router.navigate(['']);
        },
        next: data => {
          let dt = JSON.parse(data["body"]);
          if (dt["Role"] != undefined){
            if (dt["Role"] == "TL"){
              this.RoleTL = true;
            }
          }
          if (dt["Note"] != undefined){
            this.Note = dt["Note"];
          }
          if (dt["Links"] != undefined){
            this.Links = dt["Links"];
          }

          this.StartLatch();
        }
      });    
    }
  }

  StartLatch(){
    this.RouteParam.queryParamMap.subscribe((params) => {
      var QueryContainer: any = { ...params.keys, ...params };
      if (QueryContainer.params){
        this.SearchQuery = JSON.parse(JSON.stringify(QueryContainer.params));
      } else {
        this.SearchQuery = {};
      }

     if (this.SearchQuery["Link"]){
        this.SelectedIndex = 0;
        this.SearchLink = this.SearchQuery["Link"];
        this.SearchTags = "";
      } else if (this.SearchQuery["Tags"]){
        this.SelectedIndex = 1;
        this.SearchLink = "";
        this.SearchTags = this.SearchQuery["Tags"];
      } else {
        this.SelectedIndex = 0;
        this.SearchLink = "";
        this.SearchTags = "";
      }

      if (this.SearchQuery["page"]){
        this.CurrentPage = this.SearchQuery["page"];
      } else {
        this.CurrentPage = 1;
      }

      this.SearchQuery["Room"] = this.RoomNick;
      this.FirstFetch();
    });    
  }

  LinkParser(link:string):string {
    if (link.indexOf("mail.com") != -1){
      return ("mailto:" + link);
    } else {
      return (link);
    }
  }

  CheckLink(link:string): string{
    let MatchResult = link.match(/mail\.com|youtube\.com\/channel\/|ko-fi\.com\/|www\.patreon\.com\//g);
    if (MatchResult != null){
      return MatchResult[0];
    } else {
      return "Neutral";
    }
  }

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustUrl("m-chad://Archive/" + url.replace(" ", "%20"));
    } else {
      return ("Error");
    }
  }

  sanitizeroom(url: string | null) {
    if (url != null) {
      return this.Sanitizer.bypassSecurityTrustUrl("m-chad://Room/" + url.replace(" ", "%20"));
    } else {
      return ("Error");
    }
  }

  TagClick(Tag: string | undefined) {
    if (Tag != undefined) {
      return({
        Tags: Tag
      });
    } else {
      return ({});
    }
  }

  ShowSearch(indexitem: number) {
    this.SelectedIndex = indexitem;
    this.isSearchActive = !this.isSearchActive;
  }

  FirstFetch() {
    var Query = JSON.parse(JSON.stringify(this.SearchQuery));
    Query["Act"] = "ArchiveList";
    Query["Page"] = this.CurrentPage;
    this.AService.FetchArchive(this.TGEnc.TGEncoding(JSON.stringify(Query))).subscribe(
      (response) => {
        this.ArchiveList = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"])).map((e: Archive) => {
          if (!e.Star) e.Star = 0;
          if (e.Tags != undefined) {
            e.Tags = e.Tags.toString().split(",");
            for (let i = 0; i < e.Tags.length; i++) {
              e.Tags[i] = e.Tags[i].trim();
            }
          }
          return e;
        });
      }
    )

    Query["Act"] = "ArchiveCount";
    this.AService.FetchArchive(this.TGEnc.TGEncoding(JSON.stringify(Query))).subscribe(
      (response) => {
        this.TotalPage = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"])).Total;
        this.RefreshPageArray();
      }
    );
  };
  
  RefreshPageArray(){
    this.PageArray.splice(0, this.PageArray.length);
    for(let i = this.CurrentPage - 2; i <= this.CurrentPage + 2; i++){
      if (i < 1){
        continue;
      } else if (i > this.TotalPage){
        break;
      } else {
        this.PageArray.push(i);
      }
    }
  }

  ChangePage(){
    this.SearchQuery["Act"] = "ArchiveList";

    if (this.CurrentPage > this.TotalPage){
      this.CurrentPage = this.TotalPage;
    } else if (this.CurrentPage < 1){
      this.CurrentPage = 1;
    }

    this.SearchQuery["Page"] = this.CurrentPage;
    this.AService.FetchArchive(this.TGEnc.TGEncoding(JSON.stringify(this.SearchQuery))).subscribe(
      (response) => {
        this.RefreshPageArray();
        this.ArchiveList = JSON.parse(this.TGEnc.TGDecoding(JSON.parse(response.body)["BToken"])).map((e: Archive) => {
          if (!e.Star) e.Star = 0;
          if (e.Tags != undefined) {
            e.Tags = e.Tags.toString().split(",");
            for (let i = 0; i < e.Tags.length; i++) {
              e.Tags[i] = e.Tags[i].trim();
            }
          }
          return e;
        });
      }
    );
  }

  SearchQueryParamCreator(NType: number, NMode: number): any{
    /*
      NType 
        0: page aux
        1: page
        2: search button

      NMode
        Page aux
          0: Double back
          1: Back
          2: Next
          3: Double next

        page
          [page number]
        
        search button
          1: link
          2: tags
    */
    
    switch (NType) {
      case 0:
        var Query = JSON.parse(JSON.stringify(this.SearchQuery));
        delete Query["Room"];
        switch (NMode) {
          case 0:
            Query["page"] = 1;
            return(Query);
          
          case 1:
            if (this.CurrentPage > 1){
              Query["page"] = this.CurrentPage - 1;
            } else {
              Query["page"] = 1;
            }
            return(Query);

          case 2:
            if (this.CurrentPage < this.TotalPage){
              Query["page"] = parseInt(this.CurrentPage.toString()) + 1;
            } else {
              Query["page"] = this.TotalPage;
            }
            return(Query);

          case 3:
            Query["page"] = this.TotalPage;
            return(Query)
        }  
        break;
      
      case 1:
        var Query = JSON.parse(JSON.stringify(this.SearchQuery));
        delete Query["Room"];
        Query["page"] = NMode;
        return(Query)       

      case 2:
        switch (NMode) {
          case 1:
            return({
              Link: this.SearchLink
            });

          case 2:
            return({
              Tags: this.SearchTags.replace(", ", "_").replace(" ", "_")
            });
        }
    }
  }

  faEdit = faEdit;
  faTwitter = faTwitter;
  faLock = faLock;
  faStar = faStar;
  faLink = faLink;
  faEnvelope = faEnvelope;
  faCoffee = faCoffee;
  faDiscord = faDiscord;
  faPatreon = faPatreon;
  faYoutube = faYoutube;
  faSearch = faSearch;
  faChevronDown = faChevronDown;
  faRedoAlt = faRedoAlt;
  faAngleRight = faAngleRight;
  faAngleDoubleRight = faAngleDoubleRight;
  faAngleLeft = faAngleLeft;
  faAngleDoubleLeft = faAngleDoubleLeft;
}
