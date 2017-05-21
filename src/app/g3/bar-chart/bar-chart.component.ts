import {
  Component, ElementRef, Input, Output, OnChanges, ViewChild,
  ViewEncapsulation, EventEmitter
} from '@angular/core';
import {D3, D3Service} from 'd3-ng2-service';
import {SharedService} from 'app/g3/shared.service';

@Component({
  selector: 'app-bar-chart',
  template: `<div #graphContainer class="graph_container"></div>`,
  encapsulation: ViewEncapsulation.None
})
export class BarChartComponent implements OnChanges {

  private static d3: D3;
  @Input() data: any[];
  @Input() config: any;
  @Input() update: any;
  @Output() onClick = new EventEmitter<any>();
  @ViewChild('graphContainer') parentElement: ElementRef;

  constructor(d3Service: D3Service, private sharedService: SharedService) {
    BarChartComponent.d3 = d3Service.getD3();
  }
  ngOnChanges() {
    if (this.data) {
      let data = SharedService.getData(this.data, this.config);
      const transitionDuration = SharedService.getTransitionDuration(this.config);
      const d3 = BarChartComponent.d3;
      const d3ParentElement = d3.select(this.parentElement.nativeElement);
      const graphClass = (this.config.css) ? this.config.css : '';
      // create graph main SVG element
      const svg = d3ParentElement.html('')
        .append('svg')
        .attr('id', this.config.id)
        .attr('class', `graph graph--bar-chart ${graphClass}`)
        .call(this.sharedService.responsivefy);
      // create metric
      const parentMatric: ClientRect = (<HTMLElement>svg.node()).getBoundingClientRect();
      const margin = SharedService.getMargin(this.config);
      const width = parentMatric.width - margin.left - margin.right;
      const height = parentMatric.height - margin.top - margin.bottom;

      const mainG = svg.append('g')
        // move bars area according to margin
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // create y scale
      const maxYValue = d3.max(data, d => d.value);
      const yScale = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([height, 0]);

      const containerAxisData = {
        container: mainG,
        height: height,
        width: width
      };
      // create y axis
      SharedService.createAxis('y', 'left', yScale, containerAxisData, this.config);

      // x scale
      const xScale = d3.scaleBand()
        .padding(0.2)
        .domain(data.map(d => d.text))
        .range([0, width]);
      // create x axis
      SharedService.createAxis('x', 'bottom', xScale, containerAxisData, this.config);

      const barContainers = mainG.selectAll('rect')
        .data(data)
        .enter()
        .append('g');
      // add columns - bars (rects elements)
      const bars = barContainers .append('rect')
        .attr('id', d => d.id)
        .attr('class', (d, k) => {
          // create per-category classes
          const indexClass = `graph__bar--index${k}`;
          const inputClass = (d.css) ? ` ${d.css}` : '';
          return `graph__bar ${indexClass}${inputClass}`;
        });
      // fill by color function
      if(this.config.colorFunction) {
        bars.attr('fill', (d, k) => this.config.colorFunction(d, k));
      }
      // add tooltip
      bars.append('title').text((d) => (d.text) ? `${d.text} : ${d.value}` : d.value);
      // add bar click event
      SharedService.addOnClick(bars, this);
      // add bars transition
      bars.attr('x', d => xScale(d.text))
        .attr('width', d => xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCircle)
        .attr('height', d => height - yScale(d.value))
        .attr('y', d => yScale(d.value));

      // add top label
      if (this.config.label && this.config.label.create !== false) {
        const labelXOffset = SharedService.getOffset(this.config.label.xOffset, xScale.bandwidth());
        const labelYOffset = SharedService.getOffset(this.config.label.yOffset, height);
        // create labels (with offset
        const barLabels = barContainers
          .append('text')
          .attr('class', 'graph__bar_label')
          .text(d => (d.value))
          .attr('dx', labelXOffset)
          .attr('dy', labelYOffset);
        // add bar labels transition
        barLabels.attr('x', d => xScale(d.text))
          .attr('y', height)
          .transition()
          .duration(transitionDuration)
          .ease(d3.easeCircle)
          .attr('y', d => {
            const res = yScale(d.value);
            const max = height - labelYOffset;
            return(res < max) ? res : max;
          });
      }
    }
  }
}
