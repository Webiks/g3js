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
  arc: any;
  outerArc: any;
  radius: number;

  @Input() data: any[];
  @Input() config: any;
  @Input() update: any;
  @Output() onClick = new EventEmitter<any>();
  @Output() onDone = new EventEmitter<any>();
  @ViewChild('graphContainer') parentElement: ElementRef;


  static midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }

  constructor(d3Service: D3Service, private sharedService: SharedService) {
    PieChartComponent.d3 = d3Service.getD3();
  }
  ngOnChanges() {
    if (this.data) {
      const data = SharedService.getData(this.config, this.data);
      const transitionDuration = SharedService.getTransitionDuration(this.config);
      const d3 = PieChartComponent.d3;
      const d3ParentElement = d3.select(this.parentElement.nativeElement);
      // create graph main SVG element
      const svg = SharedService.createMainSVG(this.config, d3ParentElement, 'pie-chart');
      // create metric
      const parentMatric = (<HTMLElement>svg.node()).getBoundingClientRect();
      const margin = SharedService.getMargin(this.config);
      const width = parentMatric.width - margin * 2;
      const height = parentMatric.height - margin * 2;
      const radius = this.radius = Math.min(width, height) / 2;
      const donutWidth = (this.config.donutWidth) ? this.config.donutWidth : 0;

      const mainG = svg.append('g')
      // move the center of the pie chart from 0,0 to radius,radius
        .attr('height', height)
        .attr('width', width)
        .attr('transform', `translate(${parentMatric.width / 2},${parentMatric.height / 2})`);


      // to define the radius
      this.arc = d3.arc()
        .innerRadius(radius * 0.7 - donutWidth)
        .outerRadius(radius * 0.7)
        // .startAngle(0)
        .padAngle(0.01)
        .cornerRadius(3);

      this.outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      // for the start and end angles of the segments
      const pie = d3.pie()
        .value(d => (<any>d).value) // <any> to ignore typing
        .sort(null);  // no sort

      // add all group elements
      mainG.append('g').attr('class', 'slices');
      mainG.append('g').attr('class', 'labels');
      mainG.append('g').attr('class', 'lines');

      /* ------- slices -------*/
      const pieSlices = <any>mainG.select('.slices').selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('class', (d, i) => SharedService.getSegmentCssClass('pie_slice', d.data, i))
        .attr('fill', (d, i) => this.config.colorFunction(d, i));

      // add pie-slices on-click event
      SharedService.addOnClick(pieSlices, this);

      // add tooltip
      pieSlices.append('title').text((d) => {
        return (d.data.text) ? `${d.data.text} : ${d.value}` : d.value;
      });
      // add pie-slices transition
      pieSlices.transition()
        .ease(d3.easeCubicInOut)
        .duration(transitionDuration)
        .attrTween('d', this.tweenPie.bind(this));

      /* ------- Labels -------*/
      const pieLabels = svg.select('.labels').selectAll('text')
        .data(pie(data));

      const pieLabelsText = pieLabels.enter()
        .append('text')
        .attr('class', (d, i) => SharedService.getSegmentCssClass('pie_label', d.data, i))
        .attr('dy', '.35em')
        .text((d) => (d.data.value) ? d.data.text : null);

      pieLabelsText.transition()
        .duration(transitionDuration)
        .attrTween('transform', this.tweenLabel.bind(this))

      .styleTween('text-anchor', this.tweenLabelTextAnchor.bind(this));

      // add pie labels on-click event
      SharedService.addOnClick(pieLabelsText, this);

      /* ------- Labels lines -------*/
      const pieLabelsLines = svg.select('.lines').selectAll('polyline')
        .data(pie(data));

      const pieLabelsPolyLines = pieLabelsLines.enter()
        .append('polyline')
        .attr('class', (d, i) => SharedService.getSegmentCssClass('pie_line', d.data, i));

      pieLabelsPolyLines.transition().duration(transitionDuration)
        .attrTween('points', this.tweenLine.bind(this));

      // add pie polylines on-click event
      SharedService.addOnClick(pieLabelsPolyLines, this);

      // emit "done" event
      this.onDone.emit(svg);
    }
  }

  tweenPie(b) {
    const i = PieChartComponent.d3.interpolate({startAngle: 0, endAngle: 0}, b);
    return (t) => this.arc(i(t));
  }
  tweenLine(d) {
    const interpolate = PieChartComponent.d3.interpolate(this['_current'], d);
    if (d.data.value) {
      return (t) => {
        const d2 = interpolate(t);
        const pos = this.outerArc.centroid(d2);
        pos[0] = this.radius * 0.95 * (PieChartComponent.midAngle(d2) < Math.PI ? 1 : -1);
        return [this.arc.centroid(d2), this.outerArc.centroid(d2), pos];
      };
    }
  }
   tweenLabel(d) {
    const interpolate = PieChartComponent.d3.interpolate(this['_current'], d);
     if (d.data.value) {
       return (t) => {
         const d2 = interpolate(t);
         const pos = this.outerArc.centroid(d2);
         pos[0] = this.radius * (PieChartComponent.midAngle(d2) < Math.PI ? 1 : -1);
         return `translate(${pos})`;
       };
     }
  }
  tweenLabelTextAnchor(d) {
    const interpolate = PieChartComponent.d3.interpolate(this['_current'], d);
    if (d.data.value) {
      return (t) => {
        const d2 = interpolate(t);
        return PieChartComponent.midAngle(d2) < Math.PI ? 'start' : 'end';
      };
    }
  }
}
