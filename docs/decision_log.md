# Log of Design Decisions & Concepts

This document tracks key architectural and design decisions to ensure context is preserved throughout the development process.

## 1. General Strategy
- **Refactoring First:** Clean up legacy code before adding new features or polishing design.
- **Section Audit:** Review each section top-to-bottom for clarity, purpose, and visual noise.
- **Visual Style:** Move towards a cleaner, more premium look. Remove clutter first, add polish later.

## 2. Section-Specific Decisions

### Hero Section
- **Status:** Optimizing.
- **Decision:** Simplified text to a single clear offer ("Theatre and Film Studio..."). Removed redundant CTA buttons.

### Tracks (Directions)
- **Status:** Optimizing.
- **Decision:** Removed "Highlights" list and "Toggle" switch to reduce noise. Simplified cards to clear actionable items ("Watch plays" vs "Start learning").

### Abonements (Studio Memberships)
- **Status:** KEEP & POLISH.
- **Decision:** The "Calculator / Picker" feature is **CRITICAL**.
- **Reasoning:** It automates administrative work by helping parents choose the right group without calling. It must be preserved and working perfectly.

### Afisha (Schedule)
- **Status:** Done.
- **Decision:** Simplified cards (Netflix-style). Removed crew details from preview, click on card opens modal. Added "Buy Tickets" button.

### Snow Queen
- **Status:** Done.
- **Decision:** Removed artificial 3s delay. Hidden redundant toggle switch on desktop.

### Reviews
- **Status:** Done.
- **Decision:** Added "Play" icon overlay to video reviews for better affordance. Fixed z-index conflict with CTA dock.

### Gallery
- **Status:** Done.
- **Decision:** Verified image assets. Confirmed "film strip" style is good.

### FAQ
- **Status:** Done.
- **Decision:** Fixed bug where accordion wouldn't open (CSS/JS class mismatch).


## 3. Architecture Change: Multi-Page Application (MPA)
- **Status:** COMPLETED.
- **Decision:** Split the single-page application into 4 distinct pages: `Index` (Home), `Afisha`, `Studio`, `About`.
- **Reasoning:**
    - **SEO:** Allows unique `<title>` and `<meta name="description">` for key areas (Events, School).
    - **Performance:** Reduces initial payload size.
    - **UX:** Clearer navigation paths and less scrolling. "About" content no longer buried at bottom.
- **Structure:**
    - `index.html`: Showcase/Landing only.
    - `afisha.html`: Events & Tickets.
    - `studio.html`: Education details.
    - `about.html`: Trust, Team, History.
