import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-testing-ground',
  templateUrl: './testing-ground.component.html',
  styleUrls: ['./testing-ground.component.scss']
})
export class TestingGroundComponent implements OnInit {

  status: string = ""; //  LIST ALL THE VISIBLE ELEMENTS

  constructor() { }

  //  INTERSECTION OBSERVER MODULE
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        this.status += e.target.id + "| ";  //  ADD TO THE LIST OF VISIBLE ELEMENTS
      } else {
        this.status = this.status.replace(e.target.id + "| ", "");  //  REMOVE FROM THE LIST OF VISIBLE ELEMENTS
      }
    })

    if ((this.status.indexOf("3-") != -1) && (this.status.indexOf("2-") == -1)) {  //  IF SECTION 3 IS VISIBLE BUT SECTION 2 IS NOT VISIBLE
      let target1 = document.getElementById("container1");
      let target2 = document.getElementById("container2");

      if ((target1 != null) && (target2 != null)) {
        target1.className = "";
        target2.className = "fixedcontainer2";
      }
    } else {
      let target1 = document.getElementById("container1");
      let target2 = document.getElementById("container2");

      if ((target1 != null) && (target2 != null)) {
        target1.className = "fixedcontainer1";
        target2.className = "";
      }
    }
  });


  ngOnInit(): void {
    //  ASSIGN OBSERVER TO ALL THE SECTIONS
    for (let i = 1; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        let target = document.getElementById(i.toString() + "-" + j.toString());
        if (target != null) {
          this.observer.observe(target);
        }
      }
    }
  }

}
