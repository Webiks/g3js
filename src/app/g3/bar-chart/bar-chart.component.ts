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
  private linearScale: any;
  private ordinalScale: any;
  private direction: string;
  private mainElemMetric: any;
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

      this.direction = (this.config.direction) ? this.config.direction : 'BottomToTop';

      this.mainElemMetric = {
        container: mainG,
        height: height,
        width: width
      };
      let ordinalScaleLabels;
      let ordinalScaleDomain;
      const ordinalScalePadding = .2;

      // create scales and axes;
      switch (this.direction) {
        case 'BottomToTop':
          // y scale is linear
          this.linearScale  = SharedService.createScaleLinear(data, height, 0);
          SharedService.createAxis('y', 'left', this.linearScale, this.mainElemMetric, this.config);

          ordinalScaleLabels = (this.config.axes && this.config.axes.x) ? this.config.axes.x.labels : undefined;
          // y scale is ordinal
          ordinalScaleDomain = (ordinalScaleLabels) ? ordinalScaleLabels : SharedService.getScaleBandDomain(data);
          this.ordinalScale = d3.scaleBand()
            .padding(ordinalScalePadding)
            .domain(ordinalScaleDomain)
            .range([0, width]);

          SharedService.createAxis('x', 'bottom', this.ordinalScale, this.mainElemMetric, this.config);
          break;

        case 'LeftToRight':
          // y scale is ordinal
          ordinalScaleDomain = (ordinalScaleLabels) ? ordinalScaleLabels : SharedService.getScaleBandDomain(data);
          this.ordinalScale = d3.scaleBand()
            .padding(ordinalScalePadding)
            .domain(ordinalScaleDomain)
            .range([0, height]);

          SharedService.createAxis('y', 'left', this.ordinalScale, this.mainElemMetric, this.config);

          // x scale is linear
          this.linearScale  = SharedService.createScaleLinear(data, 0, width);
          SharedService.createAxis('x', 'bottom', this.linearScale, this.mainElemMetric, this.config);
          break;
      }
      const barContainers = mainG.selectAll()
        .data(data)
        .enter()
        .append('g')
        .attr('class', (d, i) => SharedService.getSegmentCssClass('bar_container', d, i))
        .attr('transform', (d, i) => this.getBarContainerTransform(ordinalScaleLabels, d, i));

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
      this.setAnimation(bars, transitionDuration);

      // add top label
      if (this.config.label && this.config.label.create !== false) {
        const getText = this.config.label.getTextFunction;
        const ordinalBandwidthCenter = SharedService.getOffset('50%', this.ordinalScale.bandwidth());
        // create labels (with offset
        const padding = 20;
        const barLabels = barContainers.selectAll('text')
          .data(d => d.hasOwnProperty('value') ? [d] : SharedService.stackData(d))
          .enter()
          .append('text')
          .attr('class', `${SharedService.CSS_PREFIX}bar_label`)
          .text(d => (getText) ? getText(d) : d.value);

        switch (this.direction) {
          case 'BottomToTop':
            barLabels.attr('dx', ordinalBandwidthCenter);
            break;
          case 'LeftToRight':
            barLabels.attr('dy', ordinalBandwidthCenter / 2 + this.ordinalScale.bandwidth() / 2);
            break;
        }
        this.setLabelsAnimation(barLabels, transitionDuration, padding);
        // barLabels.attr('y', height)
        //   .transition()
        //   .duration(transitionDuration)
        //   .ease(d3.easeCircle)
        //   .attr('y', d => {
        //     const res = (d.stackData) ? this.linearScale(d.stackData.high) : this.linearScale(d.value);
        //     const max = height - labelYOffset;
        //     return(res < max) ? res : max;
        //   });
      }
      // emit "done" event
      this.onDone.emit(svg);
    }
  }
  setLabelsAnimation(barLabels, duration, padding) {
    const d3 = BarChartComponent.d3;
    let propToAnimate;
    let fromFunc;
    let toFunc;
    switch (this.direction) {
      case 'BottomToTop':
        propToAnimate = 'y';
        fromFunc = () => this.mainElemMetric.height;
        toFunc = (d) => {
          const value = this.getBarLinearValue(d, 'high') + padding;
          const max = this.mainElemMetric.height;
          return (value < max) ? value : max;
        };
        break;
      case 'LeftToRight':
        propToAnimate = 'x';
        fromFunc = () => 0;
        toFunc = (d) => {
          const value = this.getBarLinearValue(d, 'high') - padding;
          const min = 10;
          return (value < min) ? min : value;
        };
        break;
    }
    barLabels.attr(propToAnimate, d => fromFunc(d))
      .transition()
      .duration(duration)
      .ease(d3.easeCircle)
      .attr(propToAnimate, d => toFunc(d));
  }
  getBarContainerTransform(configScaleBand, data, index) {
    let xVal = 0;
    let yVal = 0;
    switch (this.direction) {
      case 'BottomToTop':
        xVal = SharedService.getValueByScaleBand(this.ordinalScale, configScaleBand, data, index);
        break;
      case 'LeftToRight':
        xVal = 1;
        yVal = SharedService.getValueByScaleBand(this.ordinalScale, configScaleBand, data, index);
        break;
    }
    return `translate(${xVal}, ${yVal})`;
  }

  getBarLinearValue(d, stackProp) {
    switch (this.direction) {
      case 'BottomToTop':
        return (d.stackData) ? this.linearScale(d.stackData[stackProp]) : this.linearScale(d.value);
      case 'LeftToRight':
        return (d.stackData) ? this.linearScale(d.stackData[stackProp]) : this.linearScale(d.value);
    }
  }

  setAnimation(bars, duration) {
    const d3 = BarChartComponent.d3;

    switch (this.direction) {
      case 'BottomToTop':
        // animate height
        bars.attr('width', d => this.ordinalScale.bandwidth())
          .attr('y', this.mainElemMetric.height)
          .attr('height', 0)
          .transition()
          .duration(duration)
          .ease(d3.easeCircle)
          .attr('height', d => this.mainElemMetric.height - this.linearScale(d.value))
          .attr('y', d => this.getBarLinearValue(d, 'high'));
        break;
      case 'LeftToRight':
        // animate width
        bars.attr('height', d => this.ordinalScale.bandwidth())
          .attr('x', 0)
          .attr('width', 0)
          .transition()
          .duration(duration)
          .ease(d3.easeCircle)
          .attr('width', d => this.linearScale(d.value))
          .attr('x', d => (d.stackData) ? this.getBarLinearValue(d, 'low') : 0);
        break;
    }
  }
}
