# MoneyInsight Angular Client

Privacy-first personal finance tracker frontend built with Angular 21 (standalone components).

## Prerequisites

- Node.js 18+ 
- npm 9+
- Angular CLI 21

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy WASM Package

After building the WASM engine, copy it to the client:

```bash
# From project root
cd src/engine
wasm-pack build --target web --release
cp -r pkg/ ../client/src/app/wasm/

# Or on Windows
xcopy pkg ..\client\src\app\wasm\ /E /I /Y
```

### 3. Start Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/          # Core services (file upload, parsing)
│   ├── features/
│   │   └── dashboard/         # Feature modules (import, transactions)
│   ├── wasm/                  # WASM package (copied from engine/pkg)
│   ├── app.component.ts       # Root component
│   └── app.routes.ts          # Route configuration
├── index.html                 # Main HTML file
├── main.ts                    # Application entry point
└── styles.scss                # Global styles
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode

## Features

### Import Component
- Drag & drop file upload
- File validation (Excel/CSV only)
- Encryption detection
- Real-time progress tracking
- WASM-based parsing

### Transactions Component
- Display parsed transactions
- Credit/Debit indication
- Parser information
- Responsive design

## Key Technologies

- **Angular 21** - Standalone components, signals
- **TypeScript 5.9** - Type safety
- **SCSS** - Styling
- **RxJS 7.8** - Reactive programming
- **WebAssembly** - High-performance parsing

## Development

### Adding New Features

1. Create component in `src/app/features/`
2. Add route to `app.routes.ts`
3. Create service in `src/app/core/services/` if needed

### Styling

Global styles: `src/styles.scss`
Component styles: Inline in component or separate `.scss` file

### Testing

```bash
# Run tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode
ng test --browsers=ChromeHeadless --watch=false
```

## Build for Production

```bash
ng build --configuration production
```

Output will be in `dist/moneyinsight-client/`

## 📦 Deployment

### Recommended Hosting: Firebase, Vercel or Netlify

#### Firebase Hosting Deployment

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project:**
   ```bash
   cd src/client
   firebase init hosting
   ```

   Select the following options:
   - **Existing project:** Choose your Firebase project or create a new one
   - **Public directory:** `dist/moneyinsight-client/browser`
   - **Configure as a single-page app:** Yes
   - **Set up automatic builds with GitHub:** Optional
   - **Overwrite index.html:** No

4. **Build the project:**
   ```bash
   ng build --configuration production
   ```

5. **Deploy to Firebase:**
   ```bash
   firebase deploy --only hosting
   ```

6. **Deploy to specific channel (preview):**
   ```bash
   firebase hosting:channel:deploy preview
   ```

#### Firebase Configuration

Create `firebase.json` in `src/client/` if not exists:

```json
{
  "hosting": {
    "site": "moneyinsight",
    "public": "dist/moneyinsight-client/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.wasm",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/wasm"
          },
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "require-corp"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          }
        ]
      }
    ]
  }
}
```

**Important for WASM:**
- The `Content-Type: application/wasm` header is required for WebAssembly modules
- CORS headers may be needed depending on your WASM loading strategy

#### Firebase Custom Domain Setup

1. **Add Custom Domain in Firebase Console:**
   - Go to Hosting → Add custom domain
   - Enter `moneyinsight.ventio.co.in`
   - Follow DNS verification steps

2. **Add DNS Records:**
   - A record: `moneyinsight.ventio.co.in` → Firebase IP (provided in console)
   - A record: `moneyinsight.ventio.co.in` → Firebase secondary IP (if provided)
   - CNAME: `www.moneyinsight.ventio.co.in` → Firebase domain

3. **SSL Certificate:**
   - Firebase automatically provisions SSL certificates
   - May take 24-48 hours for DNS propagation

#### Firebase CI/CD with GitHub Actions

Create `.github/workflows/firebase-hosting-client.yml`:

```yaml
name: Deploy MoneyInsight Client to Firebase

on:
  push:
    branches:
      - main
    paths:
      - 'src/client/**'
      - 'src/engine/**'

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          target: wasm32-unknown-unknown
      
      - name: Install wasm-pack
        run: cargo install wasm-pack
      
      - name: Build WASM Engine
        run: |
          cd src/engine
          wasm-pack build --target web --release
      
      - name: Copy WASM to Client
        run: |
          cp -r src/engine/pkg src/client/src/app/wasm/
      
      - name: Install Client Dependencies
        run: |
          cd src/client
          npm ci
      
      - name: Build Client
        run: |
          cd src/client
          ng build --configuration production
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
          entryPoint: src/client
```

#### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client directory
cd src/client
vercel

# Set build settings:
# - Build Command: ng build --configuration production
# - Output Directory: dist/moneyinsight-client/browser
```

#### Netlify Deployment

```bash
# Build the project
ng build --configuration production

# Deploy via Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist/moneyinsight-client/browser
```

**Note:** Ensure WASM files are included in deployment and proper MIME types are configured.

## Troubleshooting

### WASM Module Not Found

**Error**: `Cannot find module '@moneyinsight/wasm'`

**Solution**:
```bash
# Build WASM first
cd ../engine
wasm-pack build --target web --release

# Copy to Angular
cp -r pkg/ ../client/src/app/wasm/
```

### Angular CLI Not Found

**Error**: `ng: command not found`

**Solution**:
```bash
npm install -g @angular/cli@21
```

### Port Already in Use

**Error**: `Port 4200 is already in use`

**Solution**:
```bash
ng serve --port 4201
```

### Build Errors

```bash
# Clear Angular cache
rm -rf .angular/cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Edge (last 2 versions)
- Safari (last 2 versions)

## Environment Configuration

The app runs entirely client-side with no backend server required. All processing happens in the browser using WebAssembly.

## Contributing

1. Follow Angular style guide
2. Use standalone components
3. Prefer signals over observables where appropriate
4. Write tests for new features
5. Follow TypeScript strict mode

## License

See LICENSE file in project root.
