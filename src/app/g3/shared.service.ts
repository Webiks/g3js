import { Injectable } from '@angular/core';
import { D3, D3Service } from 'd3-ng2-service';

/*
 * todo: chartes components should implement interface
 * which include all important sharedService methods
 * */
@Injectable()
export class SharedService {
  private static d3: D3;
  private static DEFAULT = {
    transitionTime: 700,
    margin: {top: 30, right: 0, bottom: 60, left: 40}
  };
  static addOnClick(element, context) {
    if (context.onClick) {
      element.on('click', (data, index, elements) => {
        context.onClick.emit({data, index, elements, 'target': elements[index]});
      });
    }
  }
  static getData(config, data: any[]): any[] {
    // extract data (filter if needed)
    if (config.filterDataFunction && typeof config.filterDataFunction === 'function') {
      data = data.filter((d) => config.filterDataFunction(d));
    }
    return data;
  }
  static getTransitionDuration(config) {
    let duration = SharedService.DEFAULT.transitionTime;
    if (config.skipTransitionOnce) {
      duration = 0;
      config.skipTransitionOnce = false;
    } else if (config.transitionTime) {
      duration = config.transitionTime;
    }
    return duration;
  }
  static getMargin(config) {
    return  (typeof config.margin !== 'undefined') ? config.margin : SharedService.DEFAULT.margin;
  }

  static getSegmentCssClass(segmentType, data, index) {
      // create per-category classes
      const indexClass = `graph__${segmentType}--index${index}`;
      const inputClass = (data.css) ? ` ${data.css}` : '';
      return `graph__${segmentType} ${indexClass}${inputClass}`;
  }

  static getOffset(offset, baseForPercentage) {
    if (offset === undefined) {
      return 0;
    }
    let result;
    switch (typeof offset) {
      case 'number':
        result = offset;
        break;
      case 'string':
        result = parseInt(offset, 10);
          if (offset[offset.length - 1] === '%') {
            result = result / 100 * baseForPercentage;
        }
        break;
    }
    return result;
  }
  static createMainSVG(config, parentElement, graphType) {
    const graphClass = (config.css) ? config.css : '';
    return parentElement.html('')
      .append('svg')
      .attr('id', config.id)
      .attr('class', `graph graph--${graphType} ${graphClass}`)
      .call(SharedService.responsivefy);
  }
  static createAxis(axisKey: string, position: string, scale, containerData, config) {
    if (!config.axes || !config.axes[axisKey]) {
      return;
    }
    const axisConfig = config.axes[axisKey];
    let axisElement;
    let transformString;
    // create axis and axis css-transform string
    if (axisConfig.create !== false) {
      // todo: add more directions support?
      switch (position) {
        case 'left':
          axisElement = SharedService.d3.axisLeft(scale);
          break;
        case 'bottom':
          axisElement = SharedService.d3.axisBottom(scale);
          transformString = `translate(0, ${containerData.height})`;
          break;
      }
      // invoke d3 Axis API
        for (const prop in axisConfig.d3AxisAPI) {
          if (axisConfig.d3AxisAPI.hasOwnProperty(prop)) {
            axisElement[prop](axisConfig.d3AxisAPI[prop]);
          }
      }
      // add axis
      let axisCssClass = `axis-${axisKey}`;
      const axisG = containerData.container.append('g');
      // add position transformation
      if (transformString) {
        axisG.attr('transform', transformString);
      }
      axisG.call(axisElement);
      // add text diagonal transformation
      if (axisConfig.diagonalText) {
        axisG.selectAll('text')
          .attr('transform', 'rotate(-45)');
          axisCssClass += ' diagonal-text';
      }
      axisG.attr('class', axisCssClass);
    }
  }
// add responsive support for d3
  // This function is based on code published by brendan sudol
  // https://brendansudol.com/writing/responsive-d3
  static responsivefy(svg) {
    const d3 = SharedService.d3;
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
    SharedService.d3 = d3Service.getD3();
  }
}
