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
    {text: 'cat7', value: 20},
    {text: 'cat8', value: 8}
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
  barChartConfig = {
    id: '',
    css: '',
    transitionTime: '',
    filterDataFunction: (d) => this.displayDisabledColumns || d.addToDOM !== false,
    skipTransitionOnce: false,
    margin: {top: 10, right: 20, bottom: 60, left: 40},
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

  pieChartConfig = {
    id: '',
    css: '',
    transitionTime: '',
    filterDataFunction: (d) => this.displayDisabledColumns || d.addToDOM !== false,
    skipTransitionOnce: false,
    margin: 20,
    colorFunction: (d, i) => {
      let color = 'rgb(27, 192, 201)';
      if(d.value > 4) {
        color = 'rgb(49, 130, 189)';
      }
      if(d.value > 10) {
        color = 'rgb(107, 174, 214)';
      }
      if(d.value > 10) {
        color = 'rgb(158, 202, 225)';
      }
      return color;
    },
    // label: {
    //   create: true,
    //   xOffset: '38%',
    //   yOffset: 25
    // },
  };

  // graph click
  barChartClick(event) {
    if (event.target.tagName === 'rect') {
      this.barClick(event);
    } else {
      console.log('some click event', event);
    }
  }

  // === pie-chart events ===//
  pieChartClick() {

  }

  // === bar-chart events ===//
  // bar-chart - bar click
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
      this.barChartConfig.skipTransitionOnce = true;
    }
    this.activeColumnsNumber = this.myData.filter((d) => d['addToDOM'] !== false).length;
    this.updateFlag = [];
  }

  toggleDisabledDisplay() {
    this.displayDisabledColumns = !this.displayDisabledColumns ;
    this.updateFlag = [];
  }
}
