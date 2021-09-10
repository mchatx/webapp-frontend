import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArchiveService } from '../services/archive.service';
import { TsugeGushiService } from '../services/tsuge-gushi.service';
import Archive from '../models/Archive';
import { ShowSearch } from '../models/ShowSearch';
import { faChevronDown, faSearch, faRedoAlt, faStar, faLock, faAngleRight, faAngleDoubleRight, faAngleLeft, faAngleDoubleLeft } from '@fortawesome/free-solid-svg-icons';
import { faSearchengin } from '@fortawesome/free-brands-svg-icons';
import { DomSanitizer } from '@angular/platform-browser';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss']
})
export class ArchiveComponent implements OnInit {
  isdropActive: boolean = false;
  isSearchActive: boolean = true;

  ArchiveList: Archive[] = [];
  SearchRoom: string = "";
  SearchLink: string = "";
  SearchTags: string = "";

  TotalPage: number = 0;
  CurrentPage: number = 1;
  PageArray: number[] = [1, 2, 3, 4, 5];
  SearchQuery: any;

  Search: string[] = ['Room', 'Link', 'Tags'];
  SelectedIndex: number = 0;

  constructor(
    private AService: ArchiveService,
    private Sanitizer: DomSanitizer,
    private TGEnc: TsugeGushiService,
    private router: Router,
    private ARoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.ARoute.queryParamMap
      .subscribe((params) => {
        var QueryContainer: any = { ...params.keys, ...params };
        if (QueryContainer.params){
          this.SearchQuery = QueryContainer.params;
        } else {
          this.SearchQuery = {};
        }

        if (this.SearchQuery["Room"]){
          this.SelectedIndex = 0;
          this.SearchRoom = this.SearchQuery["Room"];
          this.SearchLink = "";
          this.SearchTags = "";
        } else if (this.SearchQuery["Link"]){
          this.SelectedIndex = 1;
          this.SearchRoom = "";
          this.SearchLink = this.SearchQuery["Link"];
          this.SearchTags = "";
        } else if (this.SearchQuery["Tags"]){
          this.SelectedIndex = 2;
          this.SearchRoom = "";
          this.SearchLink = "";
          this.SearchTags = this.SearchQuery["Tags"];
        } else {
          this.SelectedIndex = 0;
          this.SearchRoom = "";
          this.SearchLink = "";
          this.SearchTags = "";
        }

        if (this.SearchQuery["page"]){
          this.CurrentPage = this.SearchQuery["page"];
        } else {
          this.CurrentPage = 1;
        }

        this.FirstFetch();
      }
    );
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

  sanitize(url: string | undefined) {
    if (url != undefined) {
      return this.Sanitizer.bypassSecurityTrustUrl("m-chad://Archive/" + url.replace(" ", "%20"));
    } else {
      return ("Error");
    }
  }

  toggleDrop() {
    this.isdropActive = !this.isdropActive;
  }

  ShowSearch(indexitem: number) {
    this.SelectedIndex = indexitem;
    this.isSearchActive = !this.isSearchActive;
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
          0: room
          1: link
          2: tags
    */
    
    switch (NType) {
      case 0:
        var Query = JSON.parse(JSON.stringify(this.SearchQuery));
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
        Query["page"] = NMode;
        return(Query)       

      case 2:
        switch (NMode) {
          case 0:
            return ({
              Room: this.SearchRoom
            });
        
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

  faRedoAlt = faRedoAlt;
  faSearch = faSearch;
  faChevronDown = faChevronDown;
  faStar = faStar;
  faLock = faLock;
  faAngleRight = faAngleRight;
  faAngleDoubleRight = faAngleDoubleRight;
  faAngleLeft = faAngleLeft;
  faAngleDoubleLeft = faAngleDoubleLeft;
}
