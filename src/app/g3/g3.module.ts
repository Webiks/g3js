import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {D3Service} from 'd3-ng2-service';
import {BarChartComponent} from './bar-chart/bar-chart.component';
import {PieChartComponent} from './pie-chart/pie-chart.component';
import {SharedService} from './shared.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    BarChartComponent,
    PieChartComponent
  ],
  exports: [
    BarChartComponent,
    PieChartComponent
  ],
  providers: [D3Service, SharedService]
})
export class G3Module { }
