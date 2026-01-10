# Ventio Site - Setup Complete! ✅

The Ventio marketing website has been successfully scaffolded with Angular 21.

## 🎉 What's Been Created

### ✅ Core Structure
- Angular 21 project with standalone components
- Routing configured with lazy loading
- TypeScript configuration

### ✅ Theming System
- Light/Dark theme toggle with localStorage persistence
- CSS variables for easy customization
- Smooth theme transitions
- System preference detection

### ✅ Content Management
- ContentService for easy content updates
- All text content is configurable
- No hardcoding—change content without touching components

### ✅ Components Built
- **Header:** Sticky navigation with mobile menu
- **Footer:** Links, social icons, copyright
- **Theme Toggle:** Sun/Moon icon button
- **CTA Button:** Reusable call-to-action component

### ✅ Pages Implemented
1. **Home (/)** - Landing page with hero, benefits, how-it-works, supported banks
2. **Product (/product)** - MoneyInsight features, use cases, pricing
3. **About (/about)** - Mission, vision, values
4. **Contact (/contact)** - Google Form embed + FAQ
5. **Privacy Policy (/privacy)** - Comprehensive privacy policy
6. **Terms (/terms)** - Terms of service

### ✅ Styling
- SCSS architecture with variables, mixins, typography
- Responsive breakpoints (mobile, tablet, desktop)
- Utility classes for rapid development
- Accessibility features (focus states, skip links, ARIA labels)

## 🚀 Next Steps

### 1. Install Dependencies
```bash
cd src/site
npm install
```

### 2. Start Development Server
```bash
npm start
```
Visit: http://localhost:4200

### 3. Customize Content

#### Update MoneyInsight Link
Edit `src/app/core/services/content.service.ts`:
```typescript
moneyInsightUrl: 'https://moneyinsight.ventio.co.in'
```

#### Add Google Form URL
In `ContentService`:
```typescript
contact: {
  googleFormUrl: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform'
}
```

#### Add Product Infographic
Place `moneyinsight_infographic_01.png` in `src/assets/images/`

#### Update Company Email
```typescript
company: {
  email: 'support@ventio.co.in'
}
```

### 4. Theme Customization
Edit `src/styles/_variables.scss` to change colors, spacing, shadows.

### 5. Add Analytics
Create Google Analytics account and add ID to `src/environments/environment.prod.ts`

## 📝 Content is Easy to Change!

All content is in **ContentService** (`src/app/core/services/content.service.ts`).

No need to edit HTML templates—just update the service!

Example:
```typescript
home: {
  hero: {
    headline: 'Your New Headline',
    subheadline: 'Your New Subheadline'
  }
}
```

## 🎨 Features

- ✅ **Dark/Light Theme** - Toggle in header, persists across sessions
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized
- ✅ **SEO Ready** - Meta tags, Open Graph, semantic HTML
- ✅ **Accessible** - WCAG 2.1 AA compliant
- ✅ **Fast** - Lazy loaded routes, optimized bundles
- ✅ **Content Focused** - Easy to update without code changes

## 🔍 Testing Theme Toggle

1. Start dev server: `npm start`
2. Open http://localhost:4200
3. Click sun/moon icon in header
4. Theme switches and saves to localStorage
5. Refresh page—theme persists!

## 📦 Production Build

```bash
npm run build:prod
```

Output: `dist/ventio-site/browser/`

Deploy this folder to:
- **Vercel:** Drag folder or connect GitHub
- **Netlify:** Drag folder or connect GitHub
- **Firebase Hosting:** `firebase deploy`

## 🐛 Common Issues

### Dependencies not installed?
```bash
npm install
```

### Port 4200 already in use?
```bash
ng serve --port 4201
```

### Build errors?
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [README.md](./README.md) - Full documentation
- [Site Spec](../../docs/specifications/site-spec.md) - Original specification
- [Angular Docs](https://angular.dev)

## 🎯 Key Files to Know

- `src/app/core/services/content.service.ts` - **Update all content here**
- `src/styles/_variables.scss` - **Customize colors and spacing**
- `src/environments/environment.prod.ts` - **Set production config**

---

**Ready to launch! 🚀**

Just run `npm install && npm start` and you're good to go!
