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
      const transitionDuration = SharedService.getTransitionDuration(this.config);
      const d3 = PieChartComponent.d3;
      const d3ParentElement = d3.select(this.parentElement.nativeElement);
      const graphClass = (this.config.css) ? this.config.css : '';
      const svg = d3ParentElement.html('')
        .append('svg')
        .attr('class', `graph graph--pie-chart ${graphClass}`)
        .call(this.sharedService.responsivefy);
      const parentMatric: ClientRect = (<HTMLElement>svg.node()).getBoundingClientRect();
      const margin = SharedService.getMargin(this.config.margin);
      const width = parentMatric.width - margin.left - margin.right;
      const height = parentMatric.height - margin.top - margin.bottom;

      const mainG = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);


      let data = this.data;
      if (this.config.filterDataFunction && typeof this.config.filterDataFunction === 'function') {
        data = data.filter((d) => this.config.filterDataFunction(d));
      }
      // y scale
      const maxYValue = d3.max(data, d => d.value);
      const yScale = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([height, 0]);
      // todo: extern tick?

      const containerAxisData = {
        container: mainG,
        height: height,
        width: width
      };
      SharedService.createAxis('y', 'left', yScale, containerAxisData, this.config);

      // x scale
      const xScale = d3.scaleBand()
        .padding(0.2)
        .domain(data.map(d => d.text))
        .range([0, width]);

      SharedService.createAxis('x', 'bottom', xScale, containerAxisData, this.config);
      // const xAxis = d3.axisBottom(xScale);

      const bar = mainG.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', (d, k) => {
          // create per-category classes
          const indexClass = `graph__bar--index${k}`;
          const inputClass = (d.css) ? ` ${d.css}` : '';
          return `graph__bar ${indexClass}${inputClass}`;
        });
      bar.attr('fill', (d, k) => this.config.colorFunction(d, k));
      // add bar click event
      SharedService.addOnClick(bar, this);

      bar.attr('x', d => xScale(d.text))
        .attr('width', d => xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCircle)
        .attr('height', d => height - yScale(d.value))
        .attr('y', d => yScale(d.value));
    }
  }
}
