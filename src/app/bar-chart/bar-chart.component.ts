import {
  Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {D3, D3Service,} from 'd3-ng2-service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BarChartComponent implements OnChanges {
  private static d3: D3;
  @Input() data: any[];
  @ViewChild('graphContainer') parentElement: ElementRef;
  // This function is based on code published by brendan sudol
  // https://brendansudol.com/writing/responsive-d3
  static responsivefy(svg) {
    console.log('foo', this)
    const d3 = BarChartComponent.d3;
    // get container + svg aspect ratio
    const container = d3.select(svg.node().parentNode),
      width = parseInt(svg.style('width'), 10),
      height = parseInt(svg.style('height'), 10),
      aspect = width / height;
    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('perserveAspectRatio', 'xMinYMid')
      .call(resize);
    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on('resize.' + container.attr('id'), resize);
    // get width of container and resize svg to fit it
    function resize() {
      const targetWidth = parseInt(container.style('width'), 10);
      svg.attr('width', targetWidth);
      svg.attr('height', Math.round(targetWidth / aspect));
    }
  }
  constructor(d3Service: D3Service) {
    BarChartComponent.d3 = d3Service.getD3();
    // console.log(this.parentNativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.data) {
      const d3 = BarChartComponent.d3;
      const d3ParnetElement = d3.select(this.parentElement.nativeElement);
      const svg = d3ParnetElement.html('')
        .append('svg')
        .attr('class', 'graph graph--bar-chart')
        .call(BarChartComponent.responsivefy);
      let parentMatric: ClientRect = (<HTMLElement>svg.node()).getBoundingClientRect();
      let margin = {top: 30, right: 0, bottom: 60, left: 40};
      let width = parentMatric.width - margin.left - margin.right;
      let height = parentMatric.height - margin.top - margin.bottom;

      let mainG = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      BarChartComponent.responsivefy(svg)
      // svg.attr('viewbox', null)
      // y scale
      let maxYValue = d3.max(this.data, d => d.value);
      let yScale = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([height, 0]);
      let yAxis = d3.axisLeft(yScale)
            .tickPadding(20);
      mainG.call(yAxis);
      // x scale
      let xScale = d3.scaleBand()
        .padding(0.2)
        .domain(this.data.map(d => d.name))
        .range([0, width]);
      let xAxis = d3.axisBottom(xScale);

      mainG.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'middle');

      //add bars
      let bar = mainG.selectAll('rect')
        .data(this.data)
        .enter()
        .append('rect')
        .attr('class', (d, k) =>  {
          // create per-category classes
          const indexClass = `graph__bar--index${k}`;
          const keyClass = (d.id) ? `graph__bar--${d.id}` : `graph__bar--${d.name}`;
          return `graph__bar ${indexClass} ${keyClass}`;
        });

    // .attr('class', 'graph__rect')

      bar.attr('x', d => xScale(d.name))
        .attr('width', d => xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .transition()
          .duration(700)
          .ease(d3.easeCircle)
          .attr('height', d => height - yScale(d.value))
          .attr('y', d => yScale(d.value))
    }
  }

}
