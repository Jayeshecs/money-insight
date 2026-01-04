# MoneyInsight Angular Client

Privacy-first personal finance tracker frontend built with Angular 18 (standalone components).

## Prerequisites

- Node.js 18+ 
- npm 9+
- Angular CLI 18

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

- **Angular 18** - Standalone components, signals
- **TypeScript 5.4** - Type safety
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
npm install -g @angular/cli@18
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
