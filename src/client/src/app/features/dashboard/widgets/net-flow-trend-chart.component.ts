import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type { ChartData, ChartOptions } from 'chart.js';
import { DashboardStateService } from '../../../core/services/dashboard-state.service';

@Component({
  selector: 'app-net-flow-trend-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div data-testid="net-flow-trend-chart"
         class="trend-chart-container"
         [style.max-height]="isMobile() ? '200px' : '320px'">
      @if (chartData().labels && chartData().labels!.length > 0) {
        <canvas baseChart
                [data]="chartData()"
                [options]="chartOptions"
                type="line"
                aria-label="Net flow trend line chart"
                style="max-height: 100%; width: 100%;">
        </canvas>
      } @else {
        <div data-testid="empty-state" class="empty-placeholder">
          <span>📉</span>
          <p>No data available for the selected period.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .trend-chart-container {
      position: relative;
      width: 100%;
    }
    .empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 180px;
      color: #9ca3af;
      font-size: 0.875rem;
      gap: 0.5rem;
      span { font-size: 2rem; }
    }
  `],
})
export class NetFlowTrendChartComponent {
  private stateService = inject(DashboardStateService);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 767px)').pipe(map(r => r.matches)),
    { initialValue: false },
  );

  chartData = computed<ChartData<'line'>>(() => {
    const series = this.stateService.monthlySeries();
    if (!series.length) return { labels: [], datasets: [] };
    return {
      labels: series.map(s => s.month),
      datasets: [
        {
          label: 'Net Flow',
          data: series.map(s => s.net),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102,126,234,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  });

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
        },
      },
    },
  };
}
