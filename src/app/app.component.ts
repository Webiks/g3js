import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  catindex = 1;
  updateFlag = false;
  // value - set category value (column height, default 0)
  // id - bar rect element id. setDisplay function based on id
  // text - set label
  // css - set bar class
  myData = [
    {id: '1', text: 'cat1', value: 13},
    {text: 'cat2', value: 10},
    {text: 'cat3', value: 12},
    {text: 'cat4', value: 3},
    {text: '', value: 5},
    {text: 'cat6', value: 20}
  ];
  // id - graph id function based on id
  // css - set bar class
  // responsivefy - override responsivefy function
  chartConfig = {
    id: '',
    css: '',
    responsivefy: () => {},
    setY: () => {}
  }
  hide() {
    this.myData.splice(this.catindex, 1);
    this.updateFlag = true;

  }
  changeCss() {
    this.myData[this.catindex]['css'] = 'myCss';
    this.updateFlag = true;

  }

  updateFlagReset() {
    this.updateFlag = false;
  }
}
