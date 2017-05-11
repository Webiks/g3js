import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app works!';
  catindex = 1;

  // value - set category value (column height, default 0)
  // id - setDisplay function based on id
  // text - set label
  // css - set bar class
  myData = [
    {id: '1', text: 'cat1', value: 13},
    {text: 'cat2', value: 10},
    {text: 'cat3', value: 12},
    {text: 'cat4', value: 3},
    {text: 'cat5', value: 5},
    {text: 'cat6', value: 20}
  ];
  chartConfig = {
    id: '',
    css: '',
    responsivefy: () => {},
    setY: () => {}
  }
  foo() {
    // this.myData.splice(this.catindex, 1);
    // let newdata = this.myData;
    // this.myData = null;
    // this.myData = newdata;
    // console.log(newdata)

    this.myData = this.myData.splice(this.catindex, 1);
  }
}
