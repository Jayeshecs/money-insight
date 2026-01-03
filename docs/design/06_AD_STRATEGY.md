# MoneyInsight Ad Strategy & Monetization Design

## 1. Overview

MoneyInsight uses **AdSense** for revenue generation with strategic placements at **high-engagement moments**. The ad strategy balances revenue maximization with user experience.

## 2. Ad Placement Strategy

### 2.1 High-Value Placements

**High CPM Opportunities:**

| Placement | Format | Size | Context | CPM Tier | Impressions/Month |
|-----------|--------|------|---------|----------|------------------|
| Import Processing | Medium Rectangle | 300x250 | Finance/Credit Cards | ★★★ High | 50-100 |
| Sidebar (Desktop) | Skyscraper | 160x600 | Dashboard | ★★ Medium | 200-500 |
| Category Insights | Native | 300x250 | Financial Products | ★★★ High | 100-300 |
| In-Feed (Mobile) | Native Card | Responsive | Finance/Banking | ★★ Medium | 300-800 |

**Rationale:**

1. **Import Processing Screen (300x250)**
   - **Why:** User is "captive" watching 5-15 second progress bar
   - **Engagement:** Captive audience = higher click rate
   - **Relevance:** Show credit card, investment, or loan products
   - **CPM:** High ($15-50 depending on geography)

2. **Sidebar Skyscraper (160x600)**
   - **Why:** Always visible on desktop, premium ad slot
   - **Visibility:** High (stays in view during scrolling)
   - **Relevance:** Banking, investments, financial services
   - **CPM:** Medium ($8-20)

3. **Dashboard Native Banners (728x90)**
   - **Why:** Between data-heavy widgets (high engagement)
   - **Visibility:** Medium (requires scroll on mobile)
   - **Relevance:** Contextual to financial category
   - **CPM:** Medium-High ($10-30)

4. **In-Feed Transactions (Mobile)**
   - **Why:** Users reviewing and categorizing transactions
   - **Engagement:** Moment where financial decisions are made
   - **Relevance:** Category-specific products (e.g., dining for food category)
   - **CPM:** Medium ($8-20)

### 2.2 Placement Locations in Detail

#### Import Processing (Desktop & Mobile Modal)

```
┌─────────────────────────────────────────────┐
│ Import New Statement              [X]       │
├─────────────────────────────────────────────┤
│ Bank Selection  │ File Upload │ Password... │
│                                             │
│ Status: Loading... [████████░░░░] 45%      │
│ > Initializing WASM Engine                  │
│ > Loading ML Categorizer...                 │
│ > Parsing File...                           │
│                                             │
│ ╔═════════════════════════════════════════╗ │
│ ║         [AD PLACEMENT]                  ║ │  ← 300x250 Medium Rectangle
│ ║                                         ║ │     High-engagement moment
│ ║  "Best Credit Cards for HDFC Users"    ║ │     (User waiting)
│ ║  9.5% Cashback • ₹0 Annual Fee        ║ │     Suggested content:
│ ║          [Apply Now >]                 ║ │     - Credit cards
│ ║                                         ║ │     - Investment products
│ ╚═════════════════════════════════════════╝ │     - Insurance
│                                             │
└─────────────────────────────────────────────┘
```

**Targeting:** Financial products, credit cards, investment apps

#### Dashboard Sidebar (Desktop Only)

```
┌──────────┬────────────────────────────────┐
│ [Nav]    │  Dashboard                     │
│          ├────────────────────────────────┤
│ Dashboard│  Widgets (responsive grid)     │
│ Txn      │                                │
│ Import   │  ╔════════════════╗            │
│ Settings │  ║  [AD]          ║ 160x600    │
│          │  ║  Skyscraper    ║ Sidebar    │
│ ╔════════╗│  ║                ║           │
│ ║  [AD] ║│  ║  High-value    ║           │
│ ║ 160x  ║│  ║  Premium slot   ║           │
│ ║ 600   ║│  ║                ║           │
│ ║Skysc. ║│  ║  "Open HiFi    ║           │
│ ║       ║│  ║   Savings at    ║           │
│ ║ "Best ║│  ║   9% Interest"  ║           │
│ ║Savings║│  ║                ║           │
│ ║ 9.5%  ║│  ║  [Open Now >]  ║           │
│ ║Intere-║│  ║                ║           │
│ ║st"    ║│  ╚════════════════╝           │
│ ║       ║│                                │
│ ╚════════╝│                                │
│          │                                │
└──────────┴────────────────────────────────┘
```

**Targeting:** Savings accounts, investments, financial planning

#### Dashboard Native Banner (Between Widgets)

```
┌──────────────────────────────────────────┐
│  Income vs Expense │ Category Breakdown   │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  ╔════════════════════════════════════╗  │
│  ║ Native Ad Banner (728x90)          ║  │
│  ║                                    ║  │
│  ║ Image │ "Smart Budgeting App"     ║  │  ← Contextual to finance
│  ║        └─ Get free budget tracking ║  │     Low visual disruption
│  ║             [Learn More >]         ║  │     High visibility
│  ║                              by    ║  │
│  ║                             Google ║  │
│  ╚════════════════════════════════════╝  │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Recent Transactions                     │
└──────────────────────────────────────────┘
```

**Targeting:** Budgeting apps, financial tools, investment platforms

#### Transaction Review (In-Feed Mobile)

```
┌──────────────────────────────┐
│  Transaction Cards           │
│ ┌────────────────────────┐   │
│ │ SWIGGY - ₹450          │   │
│ │ Food | 01/10           │   │
│ │ [Food ▼] [Approve]     │   │
│ └────────────────────────┘   │
│ ┌────────────────────────┐   │
│ │ NEFT RENT - ₹15,000    │   │
│ │ Rent | 01/11           │   │
│ │ [Rent ▼] [Approve]     │   │
│ └────────────────────────┘   │
│ ╔════════════════════════╗   │
│ ║   [AD CARD]            ║   │  ← Native Ad Card
│ ║                        ║   │     After 5-10 txn cards
│ ║  Image │ "UPI Card"   ║   │     Category-specific
│ ║        └─ Cashback    ║   │     (e.g., dining for Food)
│ ║          on food      ║   │
│ ║         [Apply >]     ║   │
│ ║                    by ║   │
│ ║                  AdSense║  │
│ ╚════════════════════════╝   │
│ ┌────────────────────────┐   │
│ │ AMAZON - ₹599          │   │
│ │ Shopping | 01/12       │   │
│ │ [Select ▼] [Approve]   │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

**Targeting:** Category-specific products (dining cards for food, travel for transport, etc.)

### 2.3 Mobile-Specific Sticky Footer Ad

```
┌────────────────────────────────────────┐
│ Transactions | Transaction Details      │
│                                         │
│ [Scrollable Content]                    │
│ ...                                     │
│ ...                                     │
├────────────────────────────────────────┤
│ ╔════════════════════════════════════╗  │
│ ║  Sticky Footer Ad (320x50)         ║  │  ← Always visible at bottom
│ ║  [Ad Image] "Best Loans 5.5%" [X]  ║  │     Easy to dismiss
│ ╚════════════════════════════════════╝  │     Monetizes scroll behavior
└────────────────────────────────────────┘
```

**Behavior:**
- Sticky position at bottom of viewport
- Closes when user taps [X] button
- Reappears after 3 scrolls (gentle rehit)
- Mobile-optimized size (320x50)

## 3. Ad Placeholder Component Architecture

### 3.1 Angular Component

**File:** `src/client/src/app/shared/components/ad-placeholder.component.ts`

```typescript
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-ad-placeholder',
  template: `
    <div class="ad-container" [class]="'ad-' + format">
      <div class="ad-content" id="google-ad-{{ placement }}"></div>
    </div>
  `,
  styles: [`
    .ad-container { text-align: center; margin: 1rem 0; }
    .ad-medium-rectangle { width: 300px; height: 250px; }
    .ad-skyscraper { width: 160px; height: 600px; }
    .ad-banner { width: 728px; height: 90px; }
    .ad-mobile-banner { width: 320px; height: 50px; }
    .ad-native { max-width: 100%; margin: 1rem 0; }
  `]
})
export class AdPlaceholderComponent implements OnInit {
  @Input() placement!: string;  // e.g., 'import-processing', 'sidebar', 'dashboard-banner'
  @Input() format!: 'banner' | 'medium-rectangle' | 'skyscraper' | 'native' | 'mobile-banner';
  @Input() context?: string;  // e.g., 'finance', 'credit-cards', 'investments'
  @Output() adLoaded = new EventEmitter<void>();
  @Output() adClicked = new EventEmitter<void>();
  
  ngOnInit() {
    this.renderAd();
  }
  
  private renderAd(): void {
    // Load Google AdSense
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.onload = () => {
      this.pushAd();
    };
    document.head.appendChild(script);
  }
  
  private pushAd(): void {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'inline-block';
    ins.style.width = this.getWidth();
    ins.style.height = this.getHeight();
    ins.setAttribute('data-ad-client', environment.googleAdsenseClientId);
    ins.setAttribute('data-ad-slot', this.getAdSlot());
    ins.setAttribute('data-ad-format', this.format === 'native' ? 'autorelaxed' : 'auto');
    
    const container = document.getElementById(`google-ad-${this.placement}`);
    if (container) {
      container.appendChild(ins);
      
      // Push ad to AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      this.adLoaded.emit();
    }
  }
  
  private getWidth(): string {
    switch (this.format) {
      case 'skyscraper': return '160px';
      case 'banner': return '728px';
      case 'mobile-banner': return '320px';
      case 'medium-rectangle': return '300px';
      default: return '100%';
    }
  }
  
  private getHeight(): string {
    switch (this.format) {
      case 'skyscraper': return '600px';
      case 'banner': return '90px';
      case 'mobile-banner': return '50px';
      case 'medium-rectangle': return '250px';
      default: return 'auto';
    }
  }
  
  private getAdSlot(): string {
    // Map placement + format to AdSense slot ID
    // These are configured in AdSense account
    const slotMap: { [key: string]: string } = {
      'import-processing-medium-rectangle': '1234567890',
      'sidebar-skyscraper': '1234567891',
      'dashboard-banner': '1234567892',
      'transactions-native': '1234567893',
      'mobile-sticky-footer': '1234567894'
    };
    
    return slotMap[`${this.placement}-${this.format}`] || '0';
  }
}
```

### 3.2 Usage in Templates

**Dashboard Component:**

```typescript
// dashboard.component.html
<div class="dashboard-container">
  <!-- Sidebar with ad -->
  <aside class="sidebar">
    <nav>...</nav>
    <app-ad-placeholder
      placement="sidebar"
      format="skyscraper"
      context="finance"
      (adLoaded)="onAdLoaded()">
    </app-ad-placeholder>
  </aside>
  
  <!-- Main content -->
  <main class="main-content">
    <!-- Widgets -->
    <section class="widgets-grid">
      <app-total-flow-widget></app-total-flow-widget>
      <app-income-vs-expense-widget></app-income-vs-expense-widget>
      <app-category-breakdown-widget></app-category-breakdown-widget>
      
      <!-- Native banner between widgets -->
      <app-ad-placeholder
        placement="dashboard-banner"
        format="native"
        context="financial-products">
      </app-ad-placeholder>
      
      <app-recent-transactions-widget></app-recent-transactions-widget>
    </section>
  </main>
</div>
```

**Import Processing Component:**

```typescript
// import-processing.component.html
<div class="import-modal">
  <!-- Form sections: bank, file, password -->
  <div class="form-section">...</div>
  
  <!-- Progress section (shown during processing) -->
  <div class="progress-section" *ngIf="isProcessing">
    <div class="progress-bar">...</div>
    <div class="status-list">...</div>
    
    <!-- Ad placement during wait time -->
    <app-ad-placeholder
      placement="import-processing"
      format="medium-rectangle"
      context="credit-cards"
      (adLoaded)="onProcessingAdLoaded()"
      (adClicked)="trackAdClick('import-processing')">
    </app-ad-placeholder>
  </div>
</div>
```

## 4. Ad Performance Metrics

### 4.1 Tracking

```typescript
@Injectable({ providedIn: 'root' })
export class AdAnalyticsService {
  constructor(private gtag: any) {}  // Google Analytics
  
  trackAdImpression(placement: string, format: string): void {
    this.gtag.event('ad_impression', {
      placement,
      format,
      timestamp: new Date()
    });
  }
  
  trackAdClick(placement: string, format: string): void {
    this.gtag.event('ad_click', {
      placement,
      format,
      timestamp: new Date()
    });
  }
  
  trackAdClose(placement: string, format: string): void {
    this.gtag.event('ad_close', {
      placement,
      format,
      timestamp: new Date()
    });
  }
}
```

### 4.2 Target Metrics

**Monthly KPIs:**

| Metric | Target | Notes |
|--------|--------|-------|
| Total Ad Impressions | 10k-20k | Depends on user base |
| Click-Through Rate (CTR) | 1-3% | Higher for skyscraper/rectangle |
| Monthly Revenue | $500-$2k | Based on geography, seasonality |
| Cost Per Click (CPC) | $0.05-$0.30 | Varies by placement and context |

**Placement-Specific CTR:**

| Placement | Expected CTR | Notes |
|-----------|--------------|-------|
| Import Processing | 2-4% | Captive audience |
| Sidebar | 0.5-1% | Passive impression |
| Native Banner | 1-2% | Medium engagement |
| In-Feed Mobile | 1.5-3% | Context-aware placements |

## 5. AdSense Configuration

### 5.1 Account Setup

1. **Sign up for Google AdSense:** https://www.google.com/adsense/
2. **Create ad units** for each placement:
   - Import Processing: 300x250 (Medium Rectangle)
   - Sidebar: 160x600 (Skyscraper)
   - Dashboard Banner: 728x90 (Leaderboard)
   - Mobile Native: Auto (Responsive)
3. **Get Client ID & Slot IDs** for integration
4. **Configure targeting:**
   - Categories: Finance, Business, Banking, Credit Cards
   - Exclude competitors and irrelevant content

### 5.2 Policy Compliance

**AdSense Policies to Follow:**

- ✓ Ads serve on desktop and mobile
- ✓ No click inflation (genuine user interactions only)
- ✓ No deceptive placements (clear ad labels)
- ✓ No cookie-wall (ads visible without user registration)
- ✓ Content quality standards (non-adult, non-violent)

**Ad Labeling:**
- All ads include "Ad by Google" or "Sponsored" label
- Placement is not deceptive (not disguised as content)
- Clear visual distinction from organic content

## 6. Revenue Optimization

### 6.1 Seasonal Targeting

**High-CPM Seasons:**

- **Q4 (Oct-Dec):** Holiday spending, travel, gift buying → 30-50% higher CPM
- **Q1 (Jan-Mar):** New Year resolutions, financial planning → 20-30% higher CPM
- **Financial Year-End (Mar-Apr in India):** Tax planning → 40% higher CPM

**Strategy:** Increase ad density during high-CPM seasons (if UX permits)

### 6.2 Contextual Targeting

**By User Segment:**

| Segment | Ad Types | Est. CPM |
|---------|----------|---------|
| High-Income | Premium cards, investments | $20-50 |
| Students | Student loans, budgeting apps | $5-15 |
| Retirees | Insurance, pension products | $15-30 |
| Small Business | Business loans, tools | $10-25 |

**By Geography:**

| Region | Est. CPM | Notes |
|--------|----------|-------|
| India (Tier 1) | $3-8 | Metro users, higher intent |
| India (Tier 2-3) | $1-3 | Smaller user base |
| US/EU | $25-100 | Premium markets (if expanded) |

## 7. Future Monetization Opportunities

### 7.1 Affiliate Partnerships

- Partner with fintech platforms (Wallet, PayTM, PhonePe)
- Referral bonuses for account openings
- Commission on successful conversions

### 7.2 Premium Features

- "Ad-free" tier ($2-5/month)
- Advanced analytics & insights (paid tier)
- API access for third-party integrations

### 7.3 Data Insights (Privacy-First)

- Anonymized insights for banks (e.g., spending trends)
- Only with explicit user consent
- No raw transaction data shared

---

## References

- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
- UX Design: [../specifications/ux_design_1.0.md](../specifications/ux_design_1.0.md)
- UI/UX Implementation: [04_UI_UX.md](04_UI_UX.md)
- Google AdSense Policies: https://support.google.com/adsense/answer/23921
