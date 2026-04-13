## Sprint 4 Status

**Sprint Goal:** Deliver the Dashboard v2.0 redesign — replacing the chart-based dashboard with a four-section analytical layout featuring a granularity bar, overall summary bar, category/sub-category tree-table widgets, and an integrated transactions panel. Update ad placements to suit the new layout. Extend with Bootstrap 5.3 responsive layout and full drilldown transactions panel.  
**Sprint Start:** 2026-04-13  
**Sprint End:** TBD  
**Focus Area:** Dashboard v2.0 redesign · Analytical widgets · Integrated transactions panel · Ad placement update · Bootstrap responsive layout · Drilldown transactions panel  
**Sprint Status:** ✅ Done

### Story Status

| # | Story | Status | Owner | Tests |
|---|-------|--------|-------|-------|
| 017 | [Dashboard v2.0 — Granularity Bar & Overall Summary Bar](../stories/story_017_Dashboard_v2_Granularity_and_Summary_Bar.md) | ✅ QA Verified | Angular Dev | 17 passed, 0 failed |
| 018 | [Dashboard v2.0 — Analytical Tree-Table Widgets](../stories/story_018_Dashboard_v2_Analytical_Tree_Widgets.md) | ✅ QA Verified | Angular Dev | 6 passed, 0 failed |
| 019 | [Dashboard v2.0 — Integrated Transactions Panel](../stories/story_019_Dashboard_v2_Transactions_Panel.md) | ✅ QA Verified | Angular Dev | 14 passed, 0 failed |
| 020 | [Dashboard v2.0 — Ad Placement Updates](../stories/story_020_Dashboard_v2_Ad_Placement_Updates.md) | ✅ QA Verified | Angular Dev | 4 passed, 0 failed |
| 021 | [Ad Visibility Setting — Show / Hide Ad Placeholders](../stories/story_021_Ad_Visibility_Setting.md) | ✅ QA Verified | Angular Dev | 8 passed, 0 failed |
| 022 | [Dashboard Responsive Layout Redesign](../stories/story_022_Dashboard_Responsive_Layout_Redesign.md) | ✅ Done | Angular Dev | 18 tests written |
| 023 | [Dashboard Drilldown Transactions Panel Enhancement](../stories/story_023_Dashboard_Drilldown_Transactions_Panel_Enhancement.md) | ✅ Done | Angular Dev | 21 tests written |

---

### Dependencies

- Story 017 is the foundation; Stories 018, 019, 020 all depend on `DashboardStateService` signals introduced in 017
- Story 018 depends on Story 017 (`activePeriodStart`, `activePeriodEnd`, `selectedAccounts`)
- Story 019 depends on Stories 017 and 018 (`activeWidgetSelection`, `activeAutoWidget`)
- Story 020 depends on Stories 017–019 (all new section components must exist before ad containers are repositioned)
- Story 022 depends on Stories 017–021 being stable; it adds the Bootstrap header and removes the sidebar without touching component internals
- Story 023 depends on Story 022 (Bootstrap must be installed) and Story 019 (`TransactionsPanelComponent` must exist) — enhances the panel with sorting, inline search, mobile cards, and Auto-toggle drilldown behaviour
- No WASM changes required for any Sprint 4 story; all aggregation is Angular-side
- Stories 007, 010 remain intact (QA Verified) and must not regress

### Pre-Sprint Analysis Status

| Item | Status | Notes |
|------|--------|-------|
| Stories 017–020 written | ✅ Done | 2026-04-13 |
| Story 021 written | ✅ Done | 2026-04-13 |
| Story 022 written | ✅ Done | 2026-04-13 |
| Story 023 written | ✅ Done | 2026-04-13 |
| UI/UX design spec updated (04_UI_UX.md) | ✅ Done | 2026-04-13 |
| Architect tech design review | ✅ Done | 2026-04-13 |
| Angular Dev pre-analysis | ✅ Done | 2026-04-13 |
| WASM Dev pre-analysis | ✅ N/A | No WASM changes in Sprint 4 |
| PO Clarifications | ✅ Done | Embedded in each story file |
| Test cases (017–020) | ✅ Done | 32 tests pass, 31 skipped (future ACs) |
| Test cases (021) | ✅ Done | 8 tests pass, 0 skipped |
| Test cases (022) | ✅ Done | 18 test cases written and implemented |
| Test cases (023) | ✅ Done | 21 test cases written and implemented |

---

### Notes
- Dashboard v2.0 is a full replacement of the chart-based layout; `ng2-charts` / `chart.js` dependencies can be removed once Story 018 is complete and Story 007 tests pass
- Story 020 requires Story 010's E2E tests to be updated (remove `sidebar-skyscraper` assertion) — tester owns this
- Story 022 deletes the sidebar entirely; Story 010's E2E assertion for `sidebar-skyscraper` must be updated to assert its **absence** (as part of Story 022 acceptance)
- Story 023 enhances `TransactionsPanelComponent` from Story 019; the developer must NOT break the 14 passing tests from Story 019 during Story 023 implementation
- The `/transactions` route (Story 008) is NOT affected; only the inline dashboard panel (Stories 019, 023) changes
- Mobile sticky footer ad (Story 011) is NOT changed by Sprint 4

---

### Release Information
- **Release Version:** 2.0.0
- **Release Date:** TBD
- **Release Owner:** Product Owner
- **Release Notes:**
  - Dashboard v2.0: four-section analytical layout (granularity bar, summary totals, tree-table widgets, transactions panel)
  - Replaced bar chart / pie chart with category/sub-category tree tables per transaction type
  - Integrated transactions panel with dynamic title, inline search, and widget drill-down
  - Updated ad placements: two 728×90 banners between sections (retired sidebar skyscraper)
  - Bootstrap 5.3 responsive layout: blue app header navbar, hamburger menu on mobile, full-width container, no sidebar
  - Enhanced drilldown transactions panel: sortable columns (desktop), card layout (mobile), auto-refresh toggle, inline search, record count
