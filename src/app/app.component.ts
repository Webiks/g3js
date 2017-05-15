import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  updateFlag = [];  // set a new reference to force graph component to update changes
  displayDisabledColumns = true;
  // value - set category value (column height, default 0)
  // id - bar rect element id. setDisplay function based on id
  // text - set label
  // css - set bar class
  myData = [
    {id: '1', text: 'cat1', value: 13, color: ''},
    {text: 'cat2', value: 10},
    {text: 'cat3', value: 12},
    {text: 'cat4', value: 3},
    {text: '', value: 5},
    {text: 'cat6', value: 20}
  ];
  // id - graph id function based on id
  // css - set bar class
  chartConfig = {
    id: '',
    css: '',
    transitionTime: '',
    filterDataFunction: (d) => this.displayDisabledColumns || d.addToDOM !== false,
    skipTransitionOnce: false,
    margin: {top: 30, right: 20, bottom: 60, left: 40},
    colorFunction: (d, i) => (d.value > 10) ? 'green' : 'red',
    axis: {
      x: {
        display: true,
        diagonal: true
      },
      y: {
        display: true,
      }
    },
  };
  // graph click
  graphClick(event) {
    if (event.target.tagName === 'rect') {
      this.barClick(event);
    } else {
      console.log('some click event', event);
    }
  }
  // graph - bar click
  barClick(event) {
    console.log(event.target);
    let newClass;
    if (!event.data.css) {
      event.data.css = '';
    }
    if (event.data.css.indexOf('disabled') === -1) {
      newClass = event.data.css + ' disabled';
      event.data['addToDOM'] = false;
    } else {
      newClass = event.data.css.replace(' disabled', '');
      event.data['addToDOM'] = undefined;
    }
    event.data.css = newClass;
    if (this.displayDisabledColumns) {
      this.chartConfig.skipTransitionOnce = true;
    }
    this.updateFlag = [];
  }

  toggleDisabledDisplay() {
    this.displayDisabledColumns = !this.displayDisabledColumns ;
    this.updateFlag = [];
  }
}
