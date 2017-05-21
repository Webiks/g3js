import {
  Component, ElementRef, Input, Output, OnChanges, ViewChild,
  ViewEncapsulation, EventEmitter
} from '@angular/core';
import {D3, D3Service} from 'd3-ng2-service';
import {SharedService} from 'app/g3/shared.service';

@Component({
  selector: 'app-pie-chart',
  template: `<div #graphContainer class="graph_container"></div>`,
  encapsulation: ViewEncapsulation.None
})
export class PieChartComponent implements OnChanges {

  private static d3: D3;
  @Input() data: any[];
  @Input() config: any;
  @Input() update: any;
  @Output() onClick = new EventEmitter<any>();
  @ViewChild('graphContainer') parentElement: ElementRef;

  constructor(d3Service: D3Service, private sharedService: SharedService) {
    PieChartComponent.d3 = d3Service.getD3();
  }
  ngOnChanges() {
    if (this.data) {
      let data = SharedService.getData(this.data, this.config);
      const transitionDuration = SharedService.getTransitionDuration(this.config);
      const d3 = PieChartComponent.d3;
      const d3ParentElement = d3.select(this.parentElement.nativeElement);
      const graphClass = (this.config.css) ? this.config.css : '';
      // create graph main SVG element
      const svg = d3ParentElement.html('')
        .append('svg')
        .attr('id', this.config.id)
        .attr('class', `graph graph--pie-chart ${graphClass}`)
        .call(this.sharedService.responsivefy);
      // create metric
      const parentMatric: ClientRect = (<HTMLElement>svg.node()).getBoundingClientRect();

      const margin = SharedService.getMargin(this.config);
      const width = parentMatric.width - margin*2;
      const height = parentMatric.height - margin*2;
      const radius = Math.min(width,height) / 2;

      const mainG = svg.append('g')
      // move the center of the pie chart from 0,0 to radius,radius
        .attr('height', height)
        .attr('width', width)
        .attr('transform',`translate(${parentMatric.width/2},${parentMatric.height/2})`);

      // to define the radius
      var arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

      // for the start and end angles of the segments
      var pie = d3.pie()
        .value(d => (<any>d).value) // <any> to ignore typing
        .sort(null);  // no sort

      var segments = mainG.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', <any>arc); // <any> to ignore typing
        // .attr('fill', 'red')

      // fill by color function
      if(this.config.colorFunction) {
        segments.attr('fill', (d, k) => this.config.colorFunction(d, k));
      }

      //todo:
      // add classes
      // .attr('class', (d, k) => {
      //   // create per-category classes
      //   const indexClass = `graph__pie--index${k}`;
      //   const inputClass = (d.css) ? ` ${d.css}` : '';
      //   return `graph__pie ${indexClass}${inputClass}`;

      // // add tooltip
      // pies.append('title').text((d) => (d.text) ? `${d.text} : ${d.value}` : d.value);
      // // add pie click event
      // SharedService.addOnClick(pies, this);

      // add pies transition
      // add labels
    }
  }
}
