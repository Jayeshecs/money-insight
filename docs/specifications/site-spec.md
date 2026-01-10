# Website Specification Document – Ventio.co.in

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Technology Stack:** Angular 21 + HTML5 + CSS3

---

## 1. Business Context

**Company:** Ventio  
**Domain:** ventio.co.in  
**Tagline:** "Smart Financial Solutions, Online & Offline"

Ventio provides innovative online and offline solutions for financial services, empowering retail banking users to manage their personal finances effortlessly.

### 1.1 First Product: MoneyInsight

MoneyInsight is a privacy-first, serverless personal finance platform that:
- Auto-categorizes bank transactions using AI
- Visualizes financial health with interactive dashboards
- Stores data securely in user's own Google Drive
- Works offline-first using browser-based storage
- Processes all data client-side (Rust WASM engine)

**Key Differentiators:**
- Zero server storage of financial data (privacy-first)
- AI-powered categorization with user feedback loop
- Supports HDFC, SBI, ICICI, and other major Indian banks
- Works entirely in the browser (no app installation)

---

## 2. Website Objectives

### 2.1 Primary Goals
1. **Product Showcase:** Present MoneyInsight features, benefits, and privacy advantages
2. **Lead Generation:** Capture user enquiries and feedback via embedded Google Forms
3. **Trust Building:** Emphasize privacy, security, and offline-first approach
4. **User Education:** Explain how MoneyInsight simplifies personal finance management

### 2.2 Success Metrics
- Form submissions (enquiries/feedback)
- Time on site and engagement with product demo/infographic
- Click-through rate to "Try MoneyInsight" CTA
- Dark/Light theme preference adoption

---

## 3. Target Audience

**Primary Persona:**  
**Rajesh, 32** – Salaried professional with savings and credit card accounts, struggles with manual expense tracking in Excel, values privacy, tech-savvy.

**Secondary Persona:**  
**Priya, 28** – Freelancer with multiple income streams, needs automated categorization, wants offline access to financial data.

**Pain Points:**
- Manual expense categorization is time-consuming
- Concerns about sharing bank data with third-party servers
- Existing tools lack Indian bank support
- Need offline access during travel

---

## 4. Site Structure & Navigation

### 4.1 Pages

#### 4.1.1 Home Page (Landing)
- **Hero Section:** Headline + Subheadline + Primary CTA ("Try MoneyInsight Free")
  - Headline: "Your Finances, Your Privacy, Your Control"
  - Subheadline: "AI-powered personal finance management that never leaves your browser"
- **Product Infographic:** Embed or display moneyinsight_infographic_01.png
- **Key Benefits:** 3-column layout
  1. Privacy-First (Client-side processing, Google Drive storage)
  2. AI-Powered (Auto-categorization, ML feedback loop)
  3. Offline-First (IndexedDB caching, works without internet)
- **How It Works:** 4-step visual flow
  1. Upload bank statement
  2. AI categorizes transactions
  3. Review & correct on dashboard
  4. Data syncs to your Google Sheets
- **Supported Banks:** Logo grid (HDFC, SBI, ICICI, + more coming)
- **Testimonials/Social Proof:** Placeholder for beta user quotes
- **CTA Section:** "Ready to take control?" + Secondary CTA ("Request Early Access")

#### 4.1.2 Product Page (MoneyInsight Deep Dive)
- **Overview:** Detailed feature breakdown with screenshots/wireframes
- **Features Section:**
  - **Smart Import:** Drag-and-drop Excel/CSV upload
  - **AI Categorization:** ML-powered transaction tagging with confidence indicators
  - **Visual Dashboard:** Net flow, income vs expense, category breakdown
  - **Privacy Guaranteed:** Rust WASM engine, zero server storage
  - **Google Sheets Sync:** Seamless integration with user's own Drive
  - **Offline Access:** IndexedDB caching for instant access
- **Technical Highlights:** (For tech-savvy users)
  - Rust WASM engine for performance
  - Angular 21 SPA for responsive UI
  - Plugin architecture for extensible bank support
- **Use Cases:**
  - Track monthly expenses
  - Prepare tax returns
  - Analyze spending patterns
  - Budget planning
- **Pricing:** Free during beta, future pricing tiers TBD

#### 4.1.3 About Ventio
- **Mission Statement:** "Empowering financial independence through privacy-first technology"
- **Team:** Founders/key team members (placeholder for bios + photos)
- **Vision:** Roadmap for future products (investment tracking, bill reminders, etc.)
- **Values:** Privacy, Transparency, Innovation, User-Centricity

#### 4.1.4 Contact / Feedback
- **Embedded Google Form:** Capture enquiries, feedback, and early access requests
  - Fields: Name, Email, Phone (optional), Message Type (Enquiry/Feedback/Early Access), Message
- **Contact Info:** Email (support@ventio.co.in), Social links (LinkedIn, Twitter)
- **FAQ Section:** Common questions about privacy, supported banks, data storage

#### 4.1.5 Privacy Policy
- Data handling practices (emphasis on zero-server storage)
- Google OAuth scopes and permissions
- Cookie policy
- GDPR/data protection compliance

#### 4.1.6 Terms of Service
- Usage terms
- Beta program conditions
- Liability disclaimers

### 4.2 Navigation Structure

**Desktop Header (Sticky):**
```
[Ventio Logo] [Home] [Product] [About] [Contact] | [Theme Toggle] [Try MoneyInsight CTA Button]
```

**Mobile Navigation (Hamburger Menu):**
```
☰ Menu
- Home
- Product (MoneyInsight)
- About Ventio
- Contact / Feedback
- [Try MoneyInsight CTA]
```

**Footer (All Pages):**
```
[Ventio Logo + Tagline]
Quick Links: Home | Product | About | Contact | Privacy Policy | Terms
Social: LinkedIn | Twitter | GitHub
© 2026 Ventio. All rights reserved.
```

---

## 5. Design Requirements

### 5.1 Color Schemes

#### Light Theme (Default)
- **Primary Brand Color:** Trust Blue (#2563EB) – Finance industry standard
- **Secondary Color:** Success Green (#10B981) – Positive financial indicators
- **Accent:** Warning Amber (#F59E0B) – Call attention, CTAs
- **Background:** Clean White (#FFFFFF) / Off-White (#F9FAFB)
- **Text:** Dark Gray (#1F2937) / Medium Gray (#6B7280)
- **Surface:** Light Gray (#F3F4F6) for cards/sections

#### Dark Theme
- **Primary Brand Color:** Light Blue (#60A5FA) – Adapted for dark backgrounds
- **Secondary Color:** Success Green (#34D399) – Vibrant on dark
- **Accent:** Warm Amber (#FBBF24)
- **Background:** Rich Black (#111827) / Dark Gray (#1F2937)
- **Text:** Off-White (#F9FAFB) / Light Gray (#D1D5DB)
- **Surface:** Slate Gray (#374151) for cards/sections

### 5.2 Typography
- **Headings:** Inter (Bold) – Modern, clean, excellent readability
- **Body:** Inter (Regular/Medium) – Same family for consistency
- **Code/Technical:** Fira Code (Monospace) – For technical highlights

**Scale:**
- H1: 3rem (48px) – Hero headlines
- H2: 2.25rem (36px) – Section headers
- H3: 1.5rem (24px) – Subsections
- Body: 1rem (16px) – Standard text
- Small: 0.875rem (14px) – Captions, labels

### 5.3 Layout & Spacing
- **Max Content Width:** 1280px (centered)
- **Grid System:** 12-column responsive grid
- **Spacing Scale:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64, 96px)
- **Border Radius:** 8px (cards), 4px (buttons, inputs)
- **Shadows:**
  - Light: `0 1px 3px rgba(0,0,0,0.1)`
  - Medium: `0 4px 6px rgba(0,0,0,0.1)`
  - Heavy: `0 10px 25px rgba(0,0,0,0.15)`

### 5.4 UI Components

#### Buttons
- **Primary CTA:** Trust Blue bg, white text, medium shadow, hover lift effect
- **Secondary CTA:** Transparent bg, Trust Blue border/text, hover fill
- **Sizes:** Small (32px), Medium (40px), Large (48px)

#### Cards
- **Product Feature Cards:** White/Slate bg, medium shadow, 8px radius, hover scale
- **Benefit Cards:** Icon + Heading + Description, 3-column grid (desktop), stacked (mobile)

#### Forms
- **Google Form Embed:** Seamless iframe integration, styled to match site theme
- **Custom Styling:** Override Google Form defaults to match Ventio color scheme

#### Theme Toggle
- **Icon Button:** Sun (light) / Moon (dark) icon in header
- **Behavior:** Persists preference in localStorage, smooth CSS transition

---

## 6. Content Guidelines

### 6.1 Tone of Voice
- **Professional yet Approachable:** Finance is serious, but we're here to help
- **Privacy-Focused:** Emphasize security and user control
- **Empowering:** "You own your data," "Take control of your finances"
- **Transparent:** Clear explanations of how the system works

### 6.2 Copywriting Principles
- Use short, punchy sentences
- Lead with benefits, not features ("Save 10 hours/month" vs "AI categorization")
- Address privacy concerns proactively
- Use Indian context (INR, HDFC/SBI banks, NEFT/UPI terms)

### 6.3 Visual Assets
- **Hero Image/Video:** Animation showing statement upload → AI processing → dashboard
- **Product Infographic:** moneyinsight_infographic_01.png (responsive scaling)
- **Screenshots:** Dashboard, transaction review, Google Sheets sync
- **Icons:** Feather Icons or Heroicons (consistent set)

---

## 7. Technical Implementation (Angular + HTML5 + CSS3)

### 7.1 Angular Architecture

**Project Structure:**
```
src/
├── app/
│   ├── core/                  # Singleton services, guards
│   │   ├── services/
│   │   │   └── theme.service.ts   # Dark/Light theme management
│   │   └── guards/
│   ├── shared/                # Reusable components, directives, pipes
│   │   ├── components/
│   │   │   ├── header/
│   │   │   ├── footer/
│   │   │   ├── theme-toggle/
│   │   │   └── cta-button/
│   │   └── directives/
│   ├── features/              # Feature modules
│   │   ├── home/
│   │   ├── product/
│   │   ├── about/
│   │   ├── contact/
│   │   └── legal/             # Privacy, Terms
│   ├── app.component.ts
│   ├── app.routes.ts          # Angular 21 standalone routing
│   └── app.config.ts
├── assets/
│   ├── images/
│   │   ├── moneyinsight_infographic_01.png
│   │   ├── logo.svg
│   │   └── screenshots/
│   └── icons/
├── styles/
│   ├── _variables.scss        # Theme colors, spacing
│   ├── _mixins.scss           # Reusable SCSS mixins
│   ├── _typography.scss       # Font definitions
│   ├── themes/
│   │   ├── _light.scss
│   │   └── _dark.scss
│   └── styles.scss            # Global styles
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

### 7.2 Routing Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Ventio – Smart Financial Solutions' },
  { path: 'product', component: ProductComponent, title: 'MoneyInsight – Personal Finance Management' },
  { path: 'about', component: AboutComponent, title: 'About Ventio' },
  { path: 'contact', component: ContactComponent, title: 'Contact Us' },
  { path: 'privacy', component: PrivacyPolicyComponent, title: 'Privacy Policy' },
  { path: 'terms', component: TermsComponent, title: 'Terms of Service' },
  { path: '**', redirectTo: '' }
];
```

### 7.3 Theme Management

**ThemeService (core/services/theme.service.ts):**
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'ventio-theme';
  currentTheme = signal<'light' | 'dark'>('light');

  constructor() {
    this.loadTheme();
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    this.applyTheme(newTheme);
    localStorage.setItem(this.THEME_KEY, newTheme);
  }

  private loadTheme(): void {
    const saved = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark';
    const theme = saved || this.detectPreference();
    this.currentTheme.set(theme);
    this.applyTheme(theme);
  }

  private detectPreference(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
```

### 7.4 CSS Architecture

**_variables.scss:**
```scss
// Light theme
:root[data-theme='light'] {
  --color-primary: #2563EB;
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-bg: #FFFFFF;
  --color-surface: #F3F4F6;
  --color-text: #1F2937;
  --color-text-muted: #6B7280;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
}

// Dark theme
:root[data-theme='dark'] {
  --color-primary: #60A5FA;
  --color-secondary: #34D399;
  --color-accent: #FBBF24;
  --color-bg: #111827;
  --color-surface: #374151;
  --color-text: #F9FAFB;
  --color-text-muted: #D1D5DB;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.5);
}

// Spacing scale
$spacing-1: 4px;
$spacing-2: 8px;
$spacing-3: 12px;
$spacing-4: 16px;
$spacing-6: 24px;
$spacing-8: 32px;
$spacing-12: 48px;
$spacing-16: 64px;
$spacing-24: 96px;
```

### 7.5 Responsive Breakpoints

```scss
$breakpoint-mobile: 640px;   // sm
$breakpoint-tablet: 768px;   // md
$breakpoint-desktop: 1024px; // lg
$breakpoint-wide: 1280px;    // xl

@mixin mobile {
  @media (max-width: #{$breakpoint-mobile}) { @content; }
}

@mixin tablet {
  @media (min-width: #{$breakpoint-mobile + 1}) and (max-width: #{$breakpoint-desktop}) { @content; }
}

@mixin desktop {
  @media (min-width: #{$breakpoint-desktop + 1}) { @content; }
}
```

---

## 8. Google Forms Integration

### 8.1 Embed Configuration

**Contact Page Component:**
```html
<!-- contact.component.html -->
<section class="contact-section">
  <div class="container">
    <h1>Get in Touch</h1>
    <p class="subtitle">Have questions? Want early access? We'd love to hear from you.</p>
    
    <div class="form-container">
      <iframe 
        src="https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true"
        width="100%" 
        height="800" 
        frameborder="0" 
        marginheight="0" 
        marginwidth="0"
        [attr.data-theme]="themeService.currentTheme()">
        Loading…
      </iframe>
    </div>
  </div>
</section>
```

### 8.2 Form Styling Override

```scss
// Wrap Google Form in a styled container
.form-container {
  background: var(--color-surface);
  border-radius: 8px;
  padding: $spacing-6;
  box-shadow: var(--shadow-md);
  
  iframe {
    border: none;
    display: block;
  }
}

// Use CSS to match form colors to theme (limited override capability)
// Note: Google Forms styling is restricted; coordinate form theme in Google Forms settings
```

### 8.3 Form Fields (Configure in Google Forms)

**Recommended Fields:**
1. **Name** (Short answer, required)
2. **Email** (Email validation, required)
3. **Phone** (Short answer, optional)
4. **Enquiry Type** (Multiple choice: General Enquiry, Feedback, Early Access Request, Technical Support)
5. **Message** (Paragraph, required)

---

## 9. SEO & Performance

### 9.1 Meta Tags

**Home Page:**
```html
<title>Ventio – Privacy-First Personal Finance Solutions</title>
<meta name="description" content="MoneyInsight: AI-powered personal finance management that never leaves your browser. Auto-categorize transactions, visualize spending, and keep data in your Google Drive.">
<meta name="keywords" content="personal finance, expense tracking, AI categorization, privacy-first, HDFC, SBI, ICICI, Google Sheets, offline finance app">
```

**Open Graph (Social Sharing):**
```html
<meta property="og:title" content="Ventio – Smart Financial Solutions">
<meta property="og:description" content="MoneyInsight: Your finances, your privacy, your control">
<meta property="og:image" content="https://ventio.co.in/assets/images/og-moneyinsight.png">
<meta property="og:url" content="https://ventio.co.in">
```

### 9.2 Performance Optimization

- **Lazy Loading:** Use Angular lazy-loaded routes for feature modules
- **Image Optimization:** Serve WebP with PNG fallback, responsive srcset
- **Critical CSS:** Inline above-the-fold styles
- **Bundle Optimization:** Use Angular production build with AOT compilation
- **Caching Strategy:** Service Worker for static assets (optional PWA)

### 9.3 Analytics

**Google Analytics 4 Integration:**
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideAnalytics(), // Custom analytics service
  ]
};
```

**Track Key Events:**
- Page views
- CTA button clicks ("Try MoneyInsight")
- Form submissions
- Theme toggle usage
- Time on Product page

---

## 10. Accessibility (WCAG 2.1 AA)

### 10.1 Requirements

- **Keyboard Navigation:** All interactive elements accessible via Tab, Enter, Space
- **Screen Readers:** Semantic HTML, ARIA labels where needed
- **Color Contrast:**
  - Light theme: 4.5:1 minimum (text on background)
  - Dark theme: 4.5:1 minimum (text on background)
- **Focus Indicators:** Visible focus outlines on all interactive elements
- **Alt Text:** Descriptive alt attributes for all images (infographic, screenshots)
- **Form Labels:** Proper label-input associations

### 10.2 Implementation

```html
<!-- Example: Theme toggle with accessibility -->
<button 
  (click)="themeService.toggleTheme()"
  [attr.aria-label]="'Switch to ' + (themeService.currentTheme() === 'light' ? 'dark' : 'light') + ' theme'"
  class="theme-toggle">
  <i [class]="themeService.currentTheme() === 'light' ? 'icon-moon' : 'icon-sun'"></i>
</button>
```

---

## 11. Deployment & Hosting

### 11.1 Hosting Options

**Recommended: Vercel / Netlify**
- Angular SSR support
- Automatic HTTPS
- Global CDN
- GitHub integration for CI/CD

**Build Command:**
```bash
npm run build -- --configuration production
```

**Output Directory:** `dist/ventio-site/browser`

### 11.2 Environment Variables

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  googleFormsUrl: 'https://docs.google.com/forms/d/e/FORM_ID/viewform',
  analyticsId: 'G-XXXXXXXXXX'
};
```

### 11.3 Domain Configuration

**DNS Records for ventio.co.in:**
- A record: Point to hosting provider IP
- CNAME (www): Point www.ventio.co.in to ventio.co.in

---

## 12. Content Roadmap

### Phase 1 (Launch)
- ✅ Home page with hero, benefits, how-it-works
- ✅ Product page with detailed features
- ✅ Contact page with Google Form
- ✅ About page (basic)
- ✅ Privacy Policy & Terms (legal templates)

### Phase 2 (Post-Launch)
- 📹 Demo video (screencast of MoneyInsight in action)
- 💬 Customer testimonials (collect from beta users)
- 📊 Interactive dashboard preview (embedded or GIF)
- 📝 Blog section (finance tips, privacy guides, product updates)

### Phase 3 (Growth)
- 🎓 Tutorials & guides (how to use MoneyInsight)
- 🔗 Integrations page (supported banks, future partnerships)
- 🌐 Multi-language support (Hindi, regional languages)

---

## 13. Ad Placement Strategy (Future Monetization)

While the Ventio website itself is a marketing/lead-gen site (no ads), the **MoneyInsight product** (SPA) will include strategic ad placements:

### MoneyInsight Product Ad Locations
1. **Import Processing Screen:** 300x250 ad during WASM engine initialization (high engagement)
2. **Dashboard Sidebar:** 160x600 skyscraper ad (desktop only)
3. **Between Widgets:** 728x90 native banner between dashboard widgets
4. **Transaction List:** Native in-feed ad every 20 rows (desktop), sticky 320x50 bottom banner (mobile)

**Note:** The Ventio.co.in website will remain ad-free to maintain professional appearance and build trust.

---

## 14. ML Feedback Loop UI (Product Feature Highlight)

For the **Product Page**, showcase the ML feedback loop as a key differentiator:

### Visual Flow Diagram
```
[Transaction with Low Confidence (Yellow Dot)]
       ↓
[User Corrects Category: "Groceries" → "Dining"]
       ↓
[Clicks "Sync & Train"]
       ↓
[Rule Saved to Google Sheets "Rules" Tab]
       ↓
[ML Model Retrains with New Rule]
       ↓
[Future Similar Transactions Auto-Categorized Correctly (Green Dot)]
```

### Animated Mockup
- Show confidence indicator (green/yellow/red dot) next to transaction
- Highlight dropdown to change category
- FAB button with "Sync & Train" action
- Toast notification: "✓ Rule saved! 23 similar transactions updated."

---

## 15. Development Checklist

### Setup
- [ ] Initialize Angular 21 project (`ng new ventio-site --standalone`)
- [ ] Install dependencies (SCSS, Angular Router, Google Fonts)
- [ ] Configure SCSS theme architecture (_variables.scss, _light.scss, _dark.scss)
- [ ] Set up routing with lazy loading

### Components
- [ ] Header (logo, navigation, theme toggle, CTA)
- [ ] Footer (links, social icons, copyright)
- [ ] Theme toggle button with localStorage persistence
- [ ] CTA button component (reusable)
- [ ] Feature card component (icon + title + description)
- [ ] Benefit card component (for 3-column layout)

### Pages
- [ ] Home page (hero, infographic, benefits, how-it-works, CTAs)
- [ ] Product page (features, screenshots, use cases, pricing)
- [ ] About page (mission, team, vision)
- [ ] Contact page (Google Form embed, FAQ)
- [ ] Privacy Policy page
- [ ] Terms of Service page

### Styling
- [ ] Global styles (reset, typography, utilities)
- [ ] Light theme variables and styles
- [ ] Dark theme variables and styles
- [ ] Responsive breakpoints and mobile styles
- [ ] Button styles (primary, secondary)
- [ ] Card styles (feature, benefit)
- [ ] Form container styles (Google Form embed)

### Integrations
- [ ] Google Forms embed configuration
- [ ] Google Analytics 4 setup
- [ ] Social media meta tags (Open Graph, Twitter Card)

### Testing & QA
- [ ] Test theme toggle (light/dark, localStorage persistence)
- [ ] Test responsive layouts (mobile, tablet, desktop)
- [ ] Test keyboard navigation and accessibility
- [ ] Test form submission (Google Forms)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Lighthouse audit (Performance, Accessibility, SEO)

### Deployment
- [ ] Production build (`ng build --configuration production`)
- [ ] Deploy to hosting (Vercel/Netlify)
- [ ] Configure custom domain (ventio.co.in)
- [ ] Set up SSL certificate (auto via hosting)
- [ ] Configure analytics and tracking

---

## 16. Key Deliverables Summary

1. **Responsive Angular 21 SPA** with standalone components
2. **Dark/Light theme toggle** with localStorage persistence
3. **6 pages:** Home, Product, About, Contact, Privacy, Terms
4. **Google Forms integration** for lead capture
5. **SEO-optimized** meta tags and content
6. **WCAG 2.1 AA compliant** accessibility
7. **Production-ready build** deployed on ventio.co.in

---

## 17. References

- **Product Details:** See [fsd_1.0.md](./fsd_1.0.md) for MoneyInsight functional specification
- **UX Design:** See [ux_design_1.0.md](./ux_design_1.0.md) for detailed wireframes and UI patterns
- **Angular Docs:** https://angular.dev
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

**End of Specification Document**

*This document is the single source of truth for building the Ventio website. All implementation decisions should reference this spec.*
