# MoneyInsight Design Documentation Index

## Overview

This folder contains comprehensive design documentation for the MoneyInsight platform. These documents define the architecture, data models, component designs, and implementation specifications for the entire system.

## Document Catalog

### 1. [Architecture Design](01_ARCHITECTURE.md)
**Scope:** System-level architecture and component design
**Key Topics:**
- Three-tier architecture (Frontend → WASM → Data)
- Component responsibilities and interfaces
- Data flow diagrams (upload, sync, dashboard)
- Integration points (OAuth, Google Sheets, WASM)
- Offline-first and scalability approach
- Plugin architecture for bank parsers
- Performance optimization strategies
- Error handling and resilience patterns

**Audience:** Tech leads, architects, system designers
**When to Use:** Understanding overall system design, planning new features, troubleshooting system issues

---

### 2. [Data Model Design](02_DATA_MODEL.md)
**Scope:** Database schemas for IndexedDB and Google Sheets
**Key Topics:**
- IndexedDB schema (transactions, rules, models, sync_queue, settings)
- Google Sheets structure (Transactions, Rules, Dashboard_Data, Models)
- Data relationships and constraints
- Category taxonomy (primary and sub-categories)
- Indexes and performance optimization
- Data validation rules
- Transaction lifecycle

**Audience:** Backend developers, data engineers, database designers
**When to Use:** Planning database operations, designing queries, understanding data relationships

---

### 3. [WASM Engine Design](03_WASM_ENGINE.md)
**Scope:** Rust WASM module architecture and implementation
**Key Topics:**
- Plugin trait definition (`BankParser`)
- Plugin registry and auto-detection
- Data structures (Transaction, CategorizedTransaction)
- JavaScript API exports
- HDFC Savings and Credit Card parser implementations
- ML categorizer and incremental training
- Error handling strategies
- Performance benchmarks
- Build process and deployment
- How to add new bank parsers

**Audience:** Rust developers, ML engineers, parser implementers
**When to Use:** Implementing new parsers, debugging parsing issues, optimizing performance

---

### 4. [UI/UX Implementation Design](04_UI_UX.md)
**Scope:** Screen layouts, component specifications, and user interactions
**Key Topics:**
- Dashboard screen (desktop and mobile layouts)
- Import & processing screen with progress indicator
- Transaction review screen (table and card views)
- Confidence indicator design and filtering
- Sync & Train action flow
- Navigation design (sidebar and bottom nav)
- Responsive breakpoints and mobile-first approach
- Theme and color palette
- Accessibility features
- Loading and error states

**Audience:** Frontend developers, UI developers, product managers
**When to Use:** Building screens, implementing components, designing user flows

---

### 5. [Google Sheets Sync & Integration](05_GOOGLE_SHEETS_SYNC.md)
**Scope:** OAuth authentication, Google Sheets API integration, and data synchronization
**Key Topics:**
- OAuth 2.0 authentication flow
- Google Sheets API integration (create, append, fetch)
- Sync strategy and conflict resolution
- Sync queue implementation with retry logic
- Background sync service and service workers
- Data mapping and normalization
- Error handling (auth, network, quota errors)
- Security considerations (token storage, encryption)
- Data reconciliation and audit trails
- Rate limiting and API best practices

**Audience:** Backend developers, API integrators, security engineers
**When to Use:** Implementing sync features, debugging sync issues, handling authentication

---

### 6. [Ad Strategy & Monetization](06_AD_STRATEGY.md)
**Scope:** Ad placements, monetization strategy, and implementation
**Key Topics:**
- High-value placement locations and CPM tiers
- Import processing screen (captive audience, 300x250)
- Sidebar skyscraper (160x600) for desktop
- Dashboard native banners (728x90)
- In-feed mobile ads (context-aware)
- Mobile sticky footer ad (320x50)
- Angular AdSense component implementation
- Ad performance metrics and KPIs
- AdSense configuration and compliance
- Seasonal targeting and revenue optimization
- Future monetization opportunities (affiliate, premium, data insights)

**Audience:** Product managers, frontend developers, monetization specialists
**When to Use:** Implementing ads, optimizing ad placement, tracking performance

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Angular 21 SPA                             │
│  (Dashboard, Import, Transactions, Settings)                 │
│  (UI Components, Routes, Services, State Management)         │
└────────────┬──────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
┌────────────▼──────────────┐                ┌────────────────▼─────┐
│   Rust WASM Engine        │                │  IndexedDB (Cache)   │
│                           │                │                      │
│ • Plugin Registry         │◄──────────────►│ • Transactions       │
│ • Bank Parsers            │                │ • Rules              │
│ • ML Categorizer          │                │ • Models             │
│ • Transaction Processing  │                │ • Sync Queue         │
│                           │                │ • Settings           │
└───────────┬───────────────┘                └─────────┬────────────┘
            │                                          │
            └──────────────────────┬───────────────────┘
                                   │
                          ┌────────▼──────────┐
                          │  Google Sheets    │
                          │  (Persistent)     │
                          │                   │
                          │ • Transactions    │
                          │ • Rules           │
                          │ • Dashboard_Data  │
                          │ • Models          │
                          └───────────────────┘
```

---

## Design Decision Matrix

| Aspect | Decision | Rationale | Reference |
|--------|----------|-----------|-----------|
| **Parsing Location** | Client-side WASM | Privacy-first, no server involvement | 01_ARCHITECTURE.md |
| **Data Storage** | IndexedDB + Google Sheets | Offline-first + cloud backup | 02_DATA_MODEL.md |
| **Plugin Architecture** | Rust trait-based | Extensible, type-safe, easy to add banks | 03_WASM_ENGINE.md |
| **Sync Model** | One-way (IDB → Sheets) | Simplicity, conflict reduction | 05_GOOGLE_SHEETS_SYNC.md |
| **Frontend Framework** | Angular 21 | Mature, scalable, strong typing | 04_UI_UX.md |
| **Mobile Strategy** | Responsive design | Single codebase, mobile-first layouts | 04_UI_UX.md |
| **Monetization** | AdSense at decision moments | Non-intrusive, high engagement | 06_AD_STRATEGY.md |
| **Auth** | Google OAuth | User-owned data, minimal permissions | 05_GOOGLE_SHEETS_SYNC.md |

---

## Implementation Roadmap

### Phase 1: MVP (Sprint 1-2)
- WASM proof of concept (HDFC parsers)
- IndexedDB data layer
- Basic dashboard widgets
- Google Sheets sync (transactions)

**Documents:** 01_ARCHITECTURE, 02_DATA_MODEL, 03_WASM_ENGINE

### Phase 2: Core Features (Sprint 3-4)
- Full dashboard with all widgets
- Transaction review and categorization
- ML-based feedback loop
- Confidence indicators

**Documents:** 04_UI_UX, 06_AD_STRATEGY

### Phase 3: Production Ready (Sprint 5-6)
- Error handling and edge cases
- Performance optimization
- Security hardening
- AdSense integration

**Documents:** 05_GOOGLE_SHEETS_SYNC, 06_AD_STRATEGY

### Phase 4: Scale & Extend (Sprint 7+)
- New bank parsers (SBI, ICICI, etc.)
- Advanced analytics
- Mobile app (React Native)
- Premium features

**Documents:** 03_WASM_ENGINE (extensibility section)

---

## Key Constraints & Requirements

### Technical Constraints
- **Privacy:** All parsing must happen in-browser (WASM)
- **Formats:** Only Excel (.xlsx/.xls) and CSV supported
- **Data Ownership:** User owns all data (stored in their Google Drive)
- **Scalability:** Plugin architecture for new bank parsers

### Non-Functional Requirements
- **Performance:** Parse 500-transaction statement in < 3 seconds
- **Offline:** Full functionality without internet (IndexedDB)
- **Sync:** Reliable sync with conflict resolution
- **Monetization:** Strategic ad placements without degrading UX
- **Accessibility:** WCAG AA compliance

### User Flow Constraints
- **Import:** User upload → Auto-detect → Parse → Categorize (< 15s)
- **Review:** Show low-confidence items first for quick approval
- **Sync:** Background sync on-demand, retry with exponential backoff
- **Dashboard:** Real-time widget updates using signals/RxJS

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Angular 21 | SPA framework, UI components |
| State Management | Angular Signals / RxJS | Reactive data flow |
| WASM Engine | Rust | Privacy-preserving parsing, ML |
| Caching | IndexedDB | Offline-first data access |
| Persistent Storage | Google Sheets | User-owned cloud backup |
| Authentication | Google OAuth 2.0 | Secure user auth |
| Monetization | Google AdSense | Native ad placements |
| Styling | Tailwind CSS / Material | Responsive, accessible UI |
| Testing | Jest / Playwright | Unit and E2E tests |

---

## Document Update History

| Document | Last Updated | Version | Status |
|----------|--------------|---------|--------|
| 01_ARCHITECTURE | 2025-01-03 | 1.0 | ✓ Complete |
| 02_DATA_MODEL | 2025-01-03 | 1.0 | ✓ Complete |
| 03_WASM_ENGINE | 2025-01-03 | 1.0 | ✓ Complete |
| 04_UI_UX | 2025-01-03 | 1.0 | ✓ Complete |
| 05_GOOGLE_SHEETS_SYNC | 2025-01-03 | 1.0 | ✓ Complete |
| 06_AD_STRATEGY | 2025-01-03 | 1.0 | ✓ Complete |

---

## How to Use This Documentation

### For New Developers
1. Start with [01_ARCHITECTURE.md](01_ARCHITECTURE.md) to understand the overall system
2. Read [02_DATA_MODEL.md](02_DATA_MODEL.md) to understand data structures
3. Focus on your specific domain (WASM, Frontend, or Backend)

### For Feature Implementation
1. Check the **relevant design document** for the feature
2. Review **design decisions** in the Architecture doc
3. Follow the **component specifications** and **data flow diagrams**

### For Bug Fixing
1. Find the affected **component** in the Architecture
2. Review the **data model** for schema changes
3. Check **error handling** strategies in relevant docs

### For Performance Optimization
1. Review **performance benchmarks** in 03_WASM_ENGINE
2. Check **indexing strategy** in 02_DATA_MODEL
3. Refer to **optimization strategies** in 01_ARCHITECTURE

---

## Related Documentation

- **Specifications:** See [../specifications/](../specifications/) for FSD and UX design
- **Stories:** See [../stories/](../stories/) for user stories and acceptance criteria
- **Sprints:** See [../sprints/](../sprints/) for sprint planning and status

---

## Maintainers & Contacts

- **Architecture:** Tech Lead / Architect
- **Data Model:** Database Engineer
- **WASM Engine:** Rust Engineer / ML Engineer
- **Frontend:** Frontend Lead
- **Integration:** Backend Engineer / DevOps
- **Monetization:** Product Manager / Growth

---

## Version Control

These documents are version-controlled in Git. When making updates:
1. Edit the document
2. Commit with message: "Update [document_name]: [change description]"
3. Reference related story/task in commit message

Example:
```
git commit -m "Update 04_UI_UX.md: Add mobile sticky footer ad spec (refs story_006)"
```

---

**Last Updated:** January 3, 2025
**Version:** 1.0
**Status:** Complete ✓
