# BC-270: Search-First UX Redesign

## Problem

The current app uses a routing-first model: two search inputs (start + end) are always visible, and the user must fill both before anything happens. This doesn't match how people actually use maps — you search for a place first, then decide whether you want directions.

The current panel also takes too much screen space on mobile, pushing the map (the primary element) into the background.

## Design

### UI States

The app has three view states (managed as `uiState` in App.tsx):

```
  SEARCH ──→ PLACE DETAIL ──→ ROUTING
    ↑              │                │
    └──────────────←────────────────┘
```

**SEARCH** (initial): Compact search bar. Map is the primary focus. On focus, the bar expands to show Home/School shortcuts (when empty) or autocomplete results (when typing). Selecting a shortcut jumps directly to ROUTING. Selecting a search result transitions to PLACE DETAIL.

**PLACE DETAIL**: Map zooms to selected place with a marker. A compact card shows the place name, address, and a "Directions" button. Tapping "Directions" transitions to ROUTING with current location as start and the selected place as end. A back/clear action returns to SEARCH.

**ROUTING**: Start and end inputs shown at top (editable, pre-filled). Route displayed on map. Compact summary at bottom with distance, duration, quality bar, and collapsible turn-by-turn. Clearing all returns to SEARCH.

The search focus/expanded state is temporary local UI — not a top-level state. It expands the search interface while the user is actively typing, then recedes on blur or selection.

### Mobile Layout

Map is always the dominant element. No persistent bottom panel or drawer.

**SEARCH (collapsed):**
- ~44px floating search bar near top of screen
- Map fills nearly the entire screen

**SEARCH (focused):**
- Search bar expands
- Shortcuts or autocomplete results appear below as a dropdown
- Map remains visible behind (possibly dimmed)

**PLACE DETAIL:**
- Map zoomed to place with marker
- ~100px bottom card: place name, district/city, "Directions" button

**ROUTING:**
- ~90px top area with start/end inputs + swap button
- Map with route fills the middle
- Compact bottom summary with route stats

### Desktop Layout

Same three states. The panel is a floating card (top-left, ~320px wide) rather than a fixed sidebar. It only grows as large as its content requires.

- SEARCH: floating search input, top-left
- SEARCH (focused): dropdown below input, overlay style
- PLACE DETAIL: floating card with place info + Directions button
- ROUTING: floating card with start/end inputs, route summary, turn-by-turn

The current 340px fixed sidebar is removed.

### Component Architecture

**State management (App.tsx):**
```typescript
type UiState = 'search' | 'place-detail' | 'routing'
```

Replaces the current `panelOpen` boolean.

**Components:**

| Component | Status | Purpose |
|-----------|--------|---------|
| `SearchBar.tsx` | Modified | Add city in suggestions, reuse for all search inputs |
| `PlaceCard.tsx` | New | Place name + address + "Directions" button |
| `RoutingHeader.tsx` | New | Start/end inputs with swap, shortcuts on clear |
| `DirectionsPanel.tsx` | Modified | Route summary + turn-by-turn only (no search inputs) |
| `App.tsx` | Modified | `uiState` replaces `panelOpen`, orchestrates transitions |
| `App.css` | Major rework | Floating card layout replaces sidebar/bottom-sheet |

**Removed concepts:**
- `panelOpen` / `panelClosed` toggle
- Collapsed search strip
- Fixed sidebar on desktop
- Panel handle / drag

### Transitions

| From | Trigger | To | Side effects |
|------|---------|-----|--------------|
| search | Select autocomplete result | place-detail | Map flyTo place, add marker |
| search | Click Home shortcut | routing | Start = current location, end = Home |
| search | Click School shortcut | routing | Start = current location, end = School |
| place-detail | Click "Directions" | routing | Start = current location, end = place |
| place-detail | Click back / clear | search | Remove marker, reset map |
| routing | Clear all | search | Remove route, reset map |

### Autocomplete

- Show city/district in each suggestion (from Nominatim `address.city` or `address.suburb`)
- Bias results toward user's current geolocation when in search state
- Existing Nominatim integration, no new APIs needed

### Current Location Resolution

When shortcuts or "Directions" trigger routing with current location as start:
- Use existing `useGeolocation` hook + `reverseGeocode`
- If geolocation unavailable: leave start field empty for manual entry

### Terminology

- **Travel mode**: toddler / trailer / training ride (rider profile selection)
- **UI state**: search / place-detail / routing (view the user is in)

These are independent. Travel mode persists across UI state changes.
