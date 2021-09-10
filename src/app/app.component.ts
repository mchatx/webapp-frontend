import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'MchadBSTest';

  constructor(
    private router: Router,
    private activatedRoute:ActivatedRoute
  ) { }

  HeadHide:boolean=false;
  
  ngOnInit(){

    this.router.events.pipe(filter(events=>events instanceof NavigationEnd), map(evt =>this.activatedRoute), map(route => {
      while(route.firstChild) {
        route = route.firstChild;
      }
      return route;
    })).pipe(
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(
      x=>x.PlainPage===true ?this.HeadHide=true:this.HeadHide=false
    );
  }
    
}