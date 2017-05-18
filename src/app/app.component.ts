import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  updateFlag = [];  // set a new reference to force graph component to update changes
  displayDisabledColumns = true;
  // == all properties are optional ==
  // value - set category value (column height, default 0)
  // id - bar rect element id. setDisplay function based on id
  // text - set label
  // css - set bar class
  // color - NOT OPERATIONAL YET
  myData = [
    {id: '1', text: 'cat1', value: 13, color: ''},
    {text: 'cat2', value: 10},
    {text: 'cat3', value: 12},
    {text: 'cat4', value: 3},
    {text: 'cat5', value: 5, css: 'bar-yellow bar-on-hover-green'},
    {text: 'cat6', value: 0},
    {text: 'cat7', value: 20}
  ];
  activeColumnsNumber = this.myData.length;
  // == all properties are optional ==
  // id - graph id function based on id
  // css - set bar class
  // transitionTime - animation transition duration in ms.
  // filterDataFunction -  filter data function
  // skipTransitionOnce - one-time flag to skip transition once (will reset afterwards
  // margin - set graph margins (should be set according to Axes
  // colorFunction - set color function
  // label - top column label
  // axes - create(flag), diagonalText (flag), d3AxisAPI (see D3 API)
  chartConfig = {
    id: '',
    css: '',
    transitionTime: '',
    filterDataFunction: (d) => this.displayDisabledColumns || d.addToDOM !== false,
    skipTransitionOnce: false,
    margin: {top: 30, right: 20, bottom: 60, left: 40},
    colorFunction: (d, i) => (d.value > 10) ? 'green' : 'red',
    label: {
      create: true,
      xOffset: '38%',
      yOffset: 25
    },
    axes: {
      x: {
        create: true,
        diagonalText: true,
        // access to d3 axis API
        d3AxisAPI: {
          tickSize: 8
        },
      },
      y: {
        // access to d3 axis API
        d3AxisAPI: {
          tickPadding: 10
        }
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
    this.activeColumnsNumber = this.myData.filter((d) => d['addToDOM'] !== false).length;
    this.updateFlag = [];
  }

  toggleDisabledDisplay() {
    this.displayDisabledColumns = !this.displayDisabledColumns ;
    this.updateFlag = [];
  }
}
