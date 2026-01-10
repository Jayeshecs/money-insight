# Ventio Marketing Website

This is the official marketing website for Ventio, showcasing MoneyInsight—our privacy-first personal finance management platform.

## 🚀 Technology Stack

- **Framework:** Angular 21 (Standalone Components)
- **Styling:** SCSS with CSS Variables for theming
- **Routing:** Angular Router with lazy loading
- **State Management:** Angular Signals + RxJS
- **Build Tool:** Angular CLI

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── theme.service.ts       # Dark/Light theme management
│   │       └── content.service.ts     # Content management (editable)
│   ├── shared/
│   │   └── components/
│   │       ├── header/                # Main navigation
│   │       ├── footer/                # Footer with links
│   │       ├── theme-toggle/          # Theme switcher button
│   │       └── cta-button/            # Reusable CTA component
│   ├── features/
│   │   ├── home/                      # Landing page
│   │   ├── product/                   # MoneyInsight details
│   │   ├── about/                     # Company info
│   │   ├── contact/                   # Contact form + FAQ
│   │   └── legal/                     # Privacy & Terms
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/                            # Images, icons, etc.
├── styles/
│   ├── _variables.scss                # Theme colors, spacing
│   ├── _mixins.scss                   # Responsive mixins
│   ├── _typography.scss               # Font styles
│   └── styles.scss                    # Global styles
└── environments/
```

## 🎨 Features

### ✅ Dark/Light Theme Toggle
- Automatic system preference detection
- localStorage persistence
- Smooth transitions between themes
- CSS variables for easy customization

### ✅ Content Management System
- All content stored in `ContentService`
- Easy to update without modifying components
- JSON-based structure for future CMS integration
- Reactive updates using RxJS

### ✅ Responsive Design
- Mobile-first approach
- Breakpoints: Mobile (640px), Tablet (768px), Desktop (1024px)
- Hamburger menu for mobile
- Touch-friendly interactions

### ✅ Accessibility (WCAG 2.1 AA)
- Semantic HTML
- Keyboard navigation support
- ARIA labels and roles
- Focus indicators
- Skip-to-content link

### ✅ SEO Optimized
- Meta tags for each page
- Open Graph tags for social sharing
- Semantic HTML structure
- Fast loading times

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation Steps

1. **Navigate to the site directory:**
   ```bash
   cd src/site
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:4200
   ```

## 📝 Development

### Running the Development Server
```bash
npm start
# or
ng serve
```

### Building for Production
```bash
npm run build:prod
# or
ng build --configuration production
```

Output will be in `dist/ventio-site/browser/`

### Testing Theme Toggle
- Click the sun/moon icon in the header
- Theme preference is saved to localStorage
- Try refreshing—your theme persists!

## 🎯 Content Updates

### Updating Site Content

All content is managed through `ContentService`. To update:

1. **Via Service (Runtime):**
   ```typescript
   constructor(private contentService: ContentService) {
     this.contentService.updateContent({
       home: {
         hero: {
           headline: 'New Headline',
           subheadline: 'New Subheadline'
         }
       }
     });
   }
   ```

2. **Via localStorage (Browser Console):**
   ```javascript
   const content = JSON.parse(localStorage.getItem('ventio-content'));
   content.home.hero.headline = 'Updated Headline';
   localStorage.setItem('ventio-content', JSON.stringify(content));
   location.reload();
   ```

3. **Direct Edit (for major changes):**
   Edit the `getDefaultContent()` method in `src/app/core/services/content.service.ts`

### Key Content Areas

- **Company Info:** `content.company.*`
- **Navigation Links:** `content.navigation.links`
- **Home Page:** `content.home.*`
- **Product Page:** `content.product.*`
- **About Page:** `content.about.*`
- **Contact Page:** `content.contact.*`

### Updating MoneyInsight URL

The MoneyInsight product link (`moneyinsight.ventio.co.in`) is stored in:
```typescript
content.product.moneyInsightUrl = 'https://moneyinsight.ventio.co.in'
```

Update this in `ContentService` to change the CTA button links.

### Adding Images

1. Place images in `src/assets/images/`
2. Reference in templates:
   ```html
   <img src="assets/images/your-image.png" alt="Description">
   ```

For the product infographic (`moneyinsight_infographic_01.png`), replace the placeholder in `home.component.html`.

## 🎨 Customizing Themes

### Color Schemes

Edit `src/styles/_variables.scss`:

```scss
:root[data-theme='light'] {
  --color-primary: #2563EB;    // Trust Blue
  --color-secondary: #10B981;  // Success Green
  --color-accent: #F59E0B;     // Warning Amber
  // ... other colors
}

:root[data-theme='dark'] {
  --color-primary: #60A5FA;    // Light Blue
  --color-secondary: #34D399;  // Vibrant Green
  --color-accent: #FBBF24;     // Warm Amber
  // ... other colors
}
```

### Typography

Edit `src/styles/_typography.scss` to change fonts, sizes, or weights.

### Spacing

Adjust spacing scale in `_variables.scss`:
```scss
$spacing-4: 16px;  // Base unit
$spacing-6: 24px;
// etc.
```

## 📦 Deployment

### Recommended Hosting: Vercel or Netlify

#### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd src/site
   vercel
   ```

3. Set build settings:
   - Build Command: `npm run build:prod`
   - Output Directory: `dist/ventio-site/browser`

#### Netlify Deployment

1. Build the project:
   ```bash
   npm run build:prod
   ```

2. Drag `dist/ventio-site/browser` folder to Netlify

Or connect your GitHub repo for automatic deployments.

### Custom Domain Setup

1. **Add DNS Records:**
   - A record: Point to hosting provider IP
   - CNAME: `www.ventio.co.in` → `ventio.co.in`

2. **Enable HTTPS:**
   - Both Vercel and Netlify provide automatic SSL certificates

## 🔧 Configuration

### Environment Variables

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  googleFormsUrl: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform',
  analyticsId: 'G-XXXXXXXXXX'  // Google Analytics ID
};
```

### Google Form Integration

1. Create a Google Form
2. Get the embed URL: `Share → Send → Embed HTML`
3. Update `googleFormsUrl` in `ContentService` or environment file
4. The form will appear in the Contact page

## 🐛 Troubleshooting

### Theme not persisting
- Check browser localStorage is enabled
- Clear cache and try again

### Google Form not loading
- Verify the form URL is correct
- Check if form has "Collect email addresses" disabled for embedded view
- Ensure form accepts responses

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Angular Documentation](https://angular.dev)
- [Site Specification](../../docs/specifications/site-spec.md)
- [FSD (Functional Spec)](../../docs/specifications/fsd_1.0.md)

## 📄 License

Copyright © 2026 Ventio. All rights reserved.

## 🤝 Support

For questions or issues:
- Email: support@ventio.co.in
- GitHub Issues: [Create an issue](../../issues)

---

**Built with ❤️ by the Ventio team**
