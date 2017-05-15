import {
  Component, ElementRef, Input, Output, OnChanges, SimpleChanges, ViewChild,
  ViewEncapsulation, EventEmitter, DoCheck
} from '@angular/core';
import {D3, D3Service,} from 'd3-ng2-service';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  encapsulation: ViewEncapsulation.None
})
export class BarChartComponent implements OnChanges {
  private static DEFAULT = {
    transitionTime: 700,
    margin: {top: 30, right: 0, bottom: 60, left: 40}
  };
  private static d3: D3;
  @Input() data: any[];
  @Input() config: any;
  @Input() update: any;
  @Output() onClick = new EventEmitter<any>();

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


  static addOnClick(element, context) {
    element.on('click', (data, index, elements) => {
      context.onClick.emit({data, index, elements, 'target': elements[index]});
    });
  }
  constructor(d3Service: D3Service) {
    BarChartComponent.d3 = d3Service.getD3();
    // console.log(this.parentNativeElement);
  }
  ngOnChanges() {
    if (this.data) {
      let transitionDuration = this.getTransitionDuration();
      const d3 = BarChartComponent.d3;
      const d3ParnetElement = d3.select(this.parentElement.nativeElement);
      const svg = d3ParnetElement.html('')
        .append('svg')
        .attr('class', 'graph graph--bar-chart')
        .call(BarChartComponent.responsivefy);
      let parentMatric: ClientRect = (<HTMLElement>svg.node()).getBoundingClientRect();
      let margin = this.config.margin || BarChartComponent.DEFAULT.margin;
      let width = parentMatric.width - margin.left - margin.right;
      let height = parentMatric.height - margin.top - margin.bottom;

      let mainG = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)


      let data = this.data;
      if (this.config.filterDataFunction && typeof this.config.filterDataFunction === 'function') {
        data = data.filter((d) => this.config.filterDataFunction(d));
      }
      // y scale
      let maxYValue = d3.max(this.data, d => d.value);
      let yScale = d3.scaleLinear()
        .domain([0, maxYValue])
        .range([height, 0]);
      let yAxis = d3.axisLeft(yScale)
      // todo: extern tick?
        .tickPadding(20);
      mainG.call(yAxis);
      // todo: add override support
      // x scale
      let xScale = d3.scaleBand()
        .padding(0.2)
        .domain(data.map(d => d.text))
        .range([0, width]);
      let xAxis = d3.axisBottom(xScale);
      // add axis click event
      // todo: add directions support?
      mainG.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')

        .style('text-anchor', 'middle')
      // add labels click event
      BarChartComponent.addOnClick(mainG.selectAll('text'), this);


      let bar = mainG.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', (d, k) => {
          // create per-category classes
          const indexClass = `graph__bar--index${k}`;
          const inputClass = (d.css) ? ` ${d.css}` : '';
          return `graph__bar ${indexClass}${inputClass}`;
        })
      bar.attr('fill', (d, k) => this.config.colorFunction(d, k))
      // add bar click event
      BarChartComponent.addOnClick(bar, this);

      bar.attr('x', d => xScale(d.text))
        .attr('width', d => xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCircle)
        .attr('height', d => height - yScale(d.value))
        .attr('y', d => yScale(d.value))
    }
  }

  getTransitionDuration() {
    let duration = BarChartComponent.DEFAULT.transitionTime;
    if (this.config.skipTransitionOnce) {
      duration = 0;
      this.config.skipTransitionOnce = false;
    } else if (this.config.transitionTime) {
      duration = this.config.transitionTime;
    }
    return duration;
  }
}
