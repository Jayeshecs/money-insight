import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardStateService } from '../../../core/services/dashboard-state.service';
import { Granularity } from '../../../core/models/data-models';

/** Convert YYYY-MM to a month index (months since 2000-01). */
function dateToMonthIndex(ym: string): number {
  if (!ym || ym.length < 7) return 0;
  const y = parseInt(ym.substring(0, 4), 10);
  const m = parseInt(ym.substring(5, 7), 10);
  return (y - 2000) * 12 + (m - 1);
}

/** Convert month index back to YYYY-MM string. */
function monthIndexToDate(idx: number): string {
  const totalMonths = Math.max(0, idx);
  const y = Math.floor(totalMonths / 12) + 2000;
  const m = (totalMonths % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/** Snap a month (1-12) to the start of its quarter: 1→1, 2→1, 3→1, 4→4, … */
function snapToQuarterStart(month: number): number {
  return Math.floor((month - 1) / 3) * 3 + 1;
}

/** Snap a month (1-12) to the end of its quarter: 1→3, 2→3, 3→3, 4→6, … */
function snapToQuarterEnd(month: number): number {
  return Math.ceil(month / 3) * 3;
}

@Component({
  selector: 'app-granularity-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="granularity-bar" aria-label="Granularity and period filter">

      <!-- Row 1 (mobile: row 1; desktop: inline) -->
      <div class="granularity-row-1">
        <label class="bar-label" for="granularity-select">View by</label>
        <select
          id="granularity-select"
          data-testid="granularity-select"
          class="granularity-select"
          [ngModel]="granularity()"
          (ngModelChange)="onGranularityChange($event)">
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <!-- Row 2: date range controls -->
      <div class="granularity-row-2">
        <!-- Start date input: month for monthly/quarterly, number for yearly -->
        @if (granularity() === 'yearly') {
          <input
            type="number"
            data-testid="period-start"
            class="date-input"
            [ngModel]="displayStart()"
            (ngModelChange)="onStartDateChange($event)"
            [min]="yearMin()"
            [max]="yearMax()"
            [step]="1"
            aria-label="Period start year">
        } @else {
          <input
            type="month"
            data-testid="period-start"
            class="date-input"
            [ngModel]="pendingStart()"
            (ngModelChange)="onStartDateChange($event)"
            [min]="availableDateMin()"
            [max]="pendingEnd()"
            aria-label="Period start">
        }

        <!-- Dual-handle range slider -->
        <div class="range-slider-wrapper" data-testid="period-range-slider" role="group" aria-label="Period range slider">
          <!-- Visual track fill -->
          <div class="slider-track">
            <div class="slider-fill"
                 [style.left]="sliderFillLeft()"
                 [style.right]="sliderFillRight()">
            </div>
          </div>
          <!-- Start handle -->
          <input
            type="range"
            class="range-input range-start"
            aria-label="Period start handle"
            [min]="sliderMin()"
            [max]="sliderMax()"
            [step]="sliderStep()"
            [value]="startSliderValue()"
            (input)="onStartSlider($event)">
          <!-- End handle -->
          <input
            type="range"
            class="range-input range-end"
            aria-label="Period end handle"
            [min]="sliderMin()"
            [max]="sliderMax()"
            [step]="sliderStep()"
            [value]="endSliderValue()"
            (input)="onEndSlider($event)">
        </div>

        <!-- End date input: month for monthly/quarterly, number for yearly -->
        @if (granularity() === 'yearly') {
          <input
            type="number"
            data-testid="period-end"
            class="date-input"
            [ngModel]="displayEnd()"
            (ngModelChange)="onEndDateChange($event)"
            [min]="yearMin()"
            [max]="yearMax()"
            [step]="1"
            aria-label="Period end year">
        } @else {
          <input
            type="month"
            data-testid="period-end"
            class="date-input"
            [ngModel]="pendingEnd()"
            (ngModelChange)="onEndDateChange($event)"
            [min]="pendingStart()"
            [max]="availableDateMax()"
            aria-label="Period end">
        }

        <!-- Apply button -->
        <button
          class="apply-btn"
          data-testid="apply-period-btn"
          (click)="onApply()"
          aria-label="Apply period">
          Apply
        </button>
      </div>

    </div>
  `,
  styles: [`
    .granularity-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .granularity-row-1 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .granularity-row-2 {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .bar-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }

    .granularity-select {
      padding: 0.35rem 0.6rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background: white;
      cursor: pointer;
      &:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.2); }
    }

    .date-input {
      padding: 0.35rem 0.6rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background: white;
      cursor: pointer;
      min-width: 130px;
      &:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.2); }
    }

    /* ── Dual-handle range slider ────────────────────────────────────────── */
    .range-slider-wrapper {
      position: relative;
      height: 36px;
      flex: 1;
      min-width: 120px;
    }

    .slider-track {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      pointer-events: none;
    }

    .slider-fill {
      position: absolute;
      height: 100%;
      background: #667eea;
      border-radius: 2px;
    }

    .range-input {
      position: absolute;
      width: 100%;
      height: 4px;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      pointer-events: none;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;

      &::-webkit-slider-thumb {
        pointer-events: all;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        &:hover { background: #5568d3; }
      }

      &::-moz-range-thumb {
        pointer-events: all;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      }

      &:focus { outline: none; }
    }

    /* ── Apply button ──────────────────────────────────────────────────────── */
    .apply-btn {
      padding: 0.4rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
      &:hover { background: #5568d3; }
      &:focus { outline: none; box-shadow: 0 0 0 2px rgba(102,126,234,0.4); }
    }

    /* ── Responsive ────────────────────────────────────────────────────────── */
    @media (max-width: 767px) {
      .granularity-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      .granularity-row-1 { justify-content: center; }
      .granularity-row-2 { flex-wrap: wrap; gap: 8px; }
      .date-input { flex: 1; min-width: 120px; }
      .range-slider-wrapper { flex-basis: 100%; order: -1; }
    }
  `],
})
export class GranularityBarComponent {
  private state = inject(DashboardStateService);

  readonly granularity    = this.state.granularity;
  readonly pendingStart   = this.state.pendingPeriodStart;
  readonly pendingEnd     = this.state.pendingPeriodEnd;
  readonly availableDateMin = this.state.availableDateMin;
  readonly availableDateMax = this.state.availableDateMax;

  // ── Year-only computed values (for yearly granularity) ───────────────────

  readonly displayStart = computed(() => {
    const val = this.state.pendingPeriodStart();
    return val && val.length >= 4 ? val.substring(0, 4) : val;
  });

  readonly displayEnd = computed(() => {
    const val = this.state.pendingPeriodEnd();
    return val && val.length >= 4 ? val.substring(0, 4) : val;
  });

  readonly yearMin = computed(() => {
    const min = this.state.availableDateMin();
    return min && min.length >= 4 ? min.substring(0, 4) : min;
  });

  readonly yearMax = computed(() => {
    const max = this.state.availableDateMax();
    return max && max.length >= 4 ? max.substring(0, 4) : max;
  });

  // ── Slider computed values ───────────────────────────────────────────────

  readonly sliderMin = computed(() => dateToMonthIndex(this.state.availableDateMin()));
  readonly sliderMax = computed(() => dateToMonthIndex(this.state.availableDateMax()));

  readonly sliderStep = computed(() => {
    const g = this.state.granularity();
    if (g === 'yearly') return 12;
    if (g === 'quarterly') return 3;
    return 1;
  });

  readonly startSliderValue = computed(() => dateToMonthIndex(this.state.pendingPeriodStart()));
  readonly endSliderValue   = computed(() => dateToMonthIndex(this.state.pendingPeriodEnd()));

  readonly sliderFillLeft = computed(() => {
    const min = this.sliderMin(), max = this.sliderMax();
    const start = this.startSliderValue();
    const range = max - min || 1;
    return `${Math.max(0, ((start - min) / range) * 100)}%`;
  });

  readonly sliderFillRight = computed(() => {
    const min = this.sliderMin(), max = this.sliderMax();
    const end = this.endSliderValue();
    const range = max - min || 1;
    return `${Math.max(0, ((max - end) / range) * 100)}%`;
  });

  // ── Event handlers ────────────────────────────────────────────────────────

  onApply(): void {
    this.state.applyPeriod();
  }

  onGranularityChange(value: Granularity): void {
    this.state.granularity.set(value);
    this.state.resetPendingToFullRange();

    if (value === 'quarterly') {
      // Snap start to beginning of its quarter, end to end of its quarter
      const startYM = this.state.pendingPeriodStart();
      const endYM   = this.state.pendingPeriodEnd();
      if (startYM && startYM.length >= 7) {
        const sy = startYM.substring(0, 4);
        const sm = parseInt(startYM.substring(5, 7), 10);
        const snappedStartM = snapToQuarterStart(sm);
        this.state.pendingPeriodStart.set(`${sy}-${String(snappedStartM).padStart(2, '0')}`);
      }
      if (endYM && endYM.length >= 7) {
        const ey = endYM.substring(0, 4);
        const em = parseInt(endYM.substring(5, 7), 10);
        const snappedEndM = snapToQuarterEnd(em);
        this.state.pendingPeriodEnd.set(`${ey}-${String(snappedEndM).padStart(2, '0')}`);
      }
    } else if (value === 'yearly') {
      // Snap start to Jan, end to Dec
      const startYM = this.state.pendingPeriodStart();
      const endYM   = this.state.pendingPeriodEnd();
      if (startYM && startYM.length >= 4) {
        this.state.pendingPeriodStart.set(`${startYM.substring(0, 4)}-01`);
      }
      if (endYM && endYM.length >= 4) {
        this.state.pendingPeriodEnd.set(`${endYM.substring(0, 4)}-12`);
      }
    }
  }

  onStartSlider(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const clamped = Math.min(raw, this.endSliderValue());
    this.state.pendingPeriodStart.set(monthIndexToDate(clamped));
  }

  onEndSlider(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(raw, this.startSliderValue());
    this.state.pendingPeriodEnd.set(monthIndexToDate(clamped));
  }

  onStartDateChange(value: string): void {
    if (!value) return;
    if (this.granularity() === 'yearly') {
      const year = parseInt(String(value), 10);
      if (!isNaN(year)) {
        this.state.pendingPeriodStart.set(`${year}-01`);
      }
      return;
    }
    const clamped = value <= this.pendingEnd() ? value : this.pendingEnd();
    this.state.pendingPeriodStart.set(clamped);
  }

  onEndDateChange(value: string): void {
    if (!value) return;
    if (this.granularity() === 'yearly') {
      const year = parseInt(String(value), 10);
      if (!isNaN(year)) {
        this.state.pendingPeriodEnd.set(`${year}-12`);
      }
      return;
    }
    const clamped = value >= this.pendingStart() ? value : this.pendingStart();
    this.state.pendingPeriodEnd.set(clamped);
  }
}
