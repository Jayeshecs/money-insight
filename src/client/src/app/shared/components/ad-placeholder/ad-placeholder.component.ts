import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AdFormat = 'banner' | 'medium-rectangle' | 'skyscraper' | 'native' | 'mobile-banner';

interface AdDimensions {
  width: string;
  height: string;
}

const AD_DIMENSIONS: Record<AdFormat, AdDimensions> = {
  'medium-rectangle': { width: '300px', height: '250px' },
  'skyscraper':       { width: '160px', height: '600px' },
  'banner':           { width: '728px', height: '90px' },
  'mobile-banner':    { width: '320px', height: '50px' },
  'native':           { width: '100%', height: 'auto' },
};

/**
 * Ad Placeholder Component
 *
 * Renders a correctly-sized ad container for Google AdSense.
 * During development (no AdSense loaded) it displays a branded placeholder
 * so that layout can be verified visually and tested via Playwright.
 *
 * @example
 * <app-ad-placeholder
 *   placement="import-processing"
 *   format="medium-rectangle"
 *   context="credit-cards"
 *   (adLoaded)="onAdLoaded()"
 *   (adClicked)="trackAdClick('import-processing')">
 * </app-ad-placeholder>
 */
@Component({
  selector: 'app-ad-placeholder',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="ad-container ad-{{ format }}"
      [attr.data-testid]="'ad-placeholder'"
      [attr.data-placement]="placement"
      [attr.data-format]="format"
      [attr.data-context]="context || null"
      [style.width]="dimensions.width"
      [style.minWidth]="dimensions.width"
      [style.height]="dimensions.height"
      [style.minHeight]="dimensions.height"
      role="complementary"
      aria-label="Advertisement"
      tabindex="-1">

      <!-- Google AdSense injection target -->
      <div [id]="adContainerId" class="ad-inner" aria-hidden="true">
        <!-- Placeholder shown until AdSense fills the slot -->
        <div class="ad-dev-placeholder" aria-hidden="true">
          <span class="ad-label">Advertisement</span>
          <span class="ad-size-hint">{{ dimensions.width }} × {{ dimensions.height }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .ad-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1rem auto;
      overflow: hidden;
      box-sizing: border-box;
    }

    .ad-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Dev/placeholder styling — replaced by real AdSense in production */
    .ad-dev-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
      border: 2px dashed #c7d2fe;
      border-radius: 8px;
      gap: 0.5rem;
    }

    .ad-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .ad-size-hint {
      font-size: 0.65rem;
      color: #a5b4fc;
    }

    /* Format-specific overrides */
    .ad-native {
      width: 100%;
      height: auto;
      min-height: 90px;
    }

    .ad-mobile-banner {
      max-width: 320px;
    }
  `]
})
export class AdPlaceholderComponent implements OnInit, OnDestroy {
  /** Unique identifier for this placement (maps to an AdSense slot) */
  @Input({ required: true }) placement!: string;

  /** Ad format / size variant */
  @Input({ required: true }) format!: AdFormat;

  /** Contextual targeting hint (e.g. 'credit-cards', 'finance') */
  @Input() context?: string;

  /** Emitted when the AdSense slot is filled and visible */
  @Output() adLoaded = new EventEmitter<void>();

  /** Emitted when the user clicks on the ad */
  @Output() adClicked = new EventEmitter<void>();

  get adContainerId(): string {
    return `google-ad-${this.placement}`;
  }

  get dimensions(): AdDimensions {
    return AD_DIMENSIONS[this.format] ?? { width: '100%', height: 'auto' };
  }

  ngOnInit(): void {
    this.initAdSense();
  }

  ngOnDestroy(): void {
    // No persistent listeners to clean up
  }

  private initAdSense(): void {
    // Guard: only run in a real browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Load AdSense script only once per page
    if (!document.querySelector('script[data-adsense]')) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-adsense', 'true');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.onload = () => this.pushAd();
      document.head.appendChild(script);
    } else {
      this.pushAd();
    }
  }

  private pushAd(): void {
    const container = document.getElementById(this.adContainerId);
    if (!container) {
      return;
    }

    const dims = this.dimensions;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'inline-block';
    ins.style.width = dims.width;
    ins.style.height = dims.height;

    // These data attributes would use real AdSense IDs in production
    // ins.setAttribute('data-ad-client', environment.googleAdsenseClientId);
    // ins.setAttribute('data-ad-slot', this.resolveSlot());

    container.appendChild(ins);

    // DEF-006-003 fix: only emit adLoaded when the real AdSense SDK is present.
    // In dev/CI, adsbygoogle is a plain Array and .loaded is undefined — do not
    // emit a false impression signal.
    const adsbyGoogle = (window as any).adsbygoogle;
    const sdkPresent = adsbyGoogle && typeof adsbyGoogle.loaded !== 'undefined';
    if (!sdkPresent) {
      // Dev/test environment: placeholder UI remains; no false impression emitted.
      return;
    }

    try {
      adsbyGoogle.push({});
      this.adLoaded.emit();
    } catch {
      // SDK present but push failed — do not emit adLoaded.
    }
  }
}
