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
  @Output() onDone = new EventEmitter<any>();
  @ViewChild('graphContainer') parentElement: ElementRef;

  constructor(d3Service: D3Service, private sharedService: SharedService) {
    BarChartComponent.d3 = d3Service.getD3();
  }
  ngOnChanges() {
    if (this.data) {
      const data = SharedService.getData(this.config, this.data);
      const margin = SharedService.getMargin(this.config);
      const transitionDuration = SharedService.getTransitionDuration(this.config);
      const d3 = BarChartComponent.d3;
      const d3ParentElement = d3.select(this.parentElement.nativeElement);

      // create graph main SVG element
      const svg = SharedService.createMainSVG(this.config, d3ParentElement, 'bar-chart');

      // create metric
      const parentMatric = (<HTMLElement>svg.node()).getBoundingClientRect();

      const width = parentMatric.width - margin.left - margin.right;
      const height = parentMatric.height - margin.top - margin.bottom;

      const mainG = svg.append('g')
        // move bars area according to margin
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // create y scale
      const maxYValue = d3.max(data, d => (d.hasOwnProperty('value')) ? d.value : d3.sum(d.values));
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

      // create x scale
      const xScaleLabels = (this.config.axes && this.config.axes.x) ? this.config.axes.x.labels : undefined;
      const xScaleDomain = (xScaleLabels) ? xScaleLabels : SharedService.getScaleBandDomain(data);
      const xScale = d3.scaleBand()
        .padding(0.2)
        .domain(xScaleDomain)
        .range([0, width]);
      // create x axis
      SharedService.createAxis('x', 'bottom', xScale, containerAxisData, this.config);

      const barContainers = mainG.selectAll()
        .data(data)
        .enter()
        .append('g')
        .attr('class', (d, i) => SharedService.getSegmentCssClass('bar_container', d, i))
        .attr('transform', (d, i) => {
          const xVal = SharedService.getXbyScaleBand(xScale, xScaleLabels, d, i);
          return `translate(${xVal}, 0)`;
        })
        .attr('width', d => xScale.bandwidth());

      // add columns - bars (rect elements)
      const bars = barContainers.selectAll('rect')
        .data(d => (d.hasOwnProperty('value')) ? [d] : SharedService.stackData(d))
        .enter()
        .append('rect')
        .attr('id', d => d.id)
        .attr('class', `${SharedService.CSS_PREFIX}bar`);

      // fill by color function
      if (this.config.colorFunction) {
        bars.attr('fill', (d, i) => this.config.colorFunction(d, i));
      }
      // add tooltip
      bars.append('title').text((d) => (d.text) ? `${d.text} : ${d.value}` : d.value);
      // add bar click event
      SharedService.addOnClick(bars, this);

      // add bars transition
      bars.attr('width', d => xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCircle)
        .attr('height', d => height - yScale(d.value))
        .attr('y', d => (d.stackData) ? yScale(d.stackData.high) : yScale(d.value));

      // add top label
      if (this.config.label && this.config.label.create !== false) {
        const getText = this.config.label.getTextFunction;
        const labelXOffset = SharedService.getOffset(this.config.label.xOffset, xScale.bandwidth());
        const labelYOffset = SharedService.getOffset(this.config.label.yOffset, height);
        // create labels (with offset
        const barLabels = barContainers.selectAll('text')
          .data(d => d.hasOwnProperty('value') ? [d] : SharedService.stackData(d))
          .enter()
          .append('text')
          .attr('class', `${SharedService.CSS_PREFIX}bar_label`)
          // .text(d => (getText) ? getText(d) : d.value)
          .text(d => (getText) ? getText(d) : d.value)
          .attr('dx', labelXOffset)
          .attr('dy', labelYOffset);
        barLabels.attr('y', height)
          .transition()
          .duration(transitionDuration)
          .ease(d3.easeCircle)
          .attr('y', d => {
            const res = (d.stackData) ? yScale(d.stackData.high) : yScale(d.value);
            const max = height - labelYOffset;
            return(res < max) ? res : max;
          });
        // emit "done" event
        this.onDone.emit(svg);
      }
    }
  }
}
