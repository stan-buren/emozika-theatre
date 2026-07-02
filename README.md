# 🎭 Emozika Theatre — Data-Driven Theatre Platform

> **A modern, data-driven web platform for a children's theatre in Saint Petersburg, featuring automated VK social media integration, ETL pipelines, and a component-based architecture.**

![Astro](https://img.shields.io/badge/Astro-5.16-FF5D01?logo=astro&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Testing-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)

---

## 🚀 About

<img width="1470" height="923" alt="Screenshot 2026-07-02 at 09 37 35" src="https://github.com/user-attachments/assets/1c4cae9e-6658-4f1a-8a9a-0c796167ec8d" />


**Emozika Theatre** is a full-stack web platform that automates content management for a children's theatre by **extracting data from VK social media API**, transforming it via a SQLite-backed ETL pipeline, and rendering a performant, SEO-optimized static site. It eliminates the need for manual content updates while providing a premium user experience for parents browsing theatre programs, film projects, and educational offerings.

---

## 💡 The Problem

Children's theatres and creative studios face a common challenge: **content fragmentation**. 

- **Photos, videos, awards, and news** are scattered across social media (VK, Instagram)
- **Manual website updates** are time-consuming and error-prone
- There's **no single source of truth** for repertoire, cast, and schedules
- Small teams lack resources for dedicated web content management

**Result:** Outdated websites, missed engagement opportunities, and operational overhead that takes time away from artistic work.

---

## 🏗️ The Solution: Target Architecture

This project implements a **fully automated content pipeline** that treats VK as the primary CMS:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EMOZIKA DATA PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐       │
│   │   VK API    │───▶│   sync-db    │───▶│    vk_cache.db      │       │
│   │ (Photos,    │    │  (ETL Layer) │    │    (SQLite 39MB)    │       │
│   │  Videos,    │    │              │    │                     │       │
│   │  Posts,     │    │  • Rate      │    │ • posts             │       │
│   │  Topics)    │    │    Limiting  │    │ • photos            │       │
│   └─────────────┘    │  • Incremen- │    │ • videos            │       │
│                      │    tal Sync  │    │ • topics            │       │
│                      │  • Upsert    │    │ • comments          │       │
│                      └──────────────┘    └──────────┬──────────┘       │
│                                                      │                  │
│                                                      ▼                  │
│                      ┌──────────────┐    ┌─────────────────────┐       │
│                      │ generate-    │───▶│    JSON Data Files  │       │
│                      │ data.js      │    │                     │       │
│                      │              │    │ • vk_gallery.json   │       │
│                      │  • Filter    │    │ • vk_films.json     │       │
│                      │  • Transform │    │ • vk_awards.json    │       │
│                      │  • Aggregate │    │ • vk_news.json      │       │
│                      └──────────────┘    │ • vk_clips.json     │       │
│                                          └──────────┬──────────┘       │
│                                                      │                  │
│                                                      ▼                  │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     ASTRO SSG BUILD                              │  │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │  │
│   │  │   Hub     │  │  Studio   │  │  Cinema   │  │  Theatre  │     │  │
│   │  │ (Landing) │  │(Education)│  │ (Films)   │  │ (Shows)   │     │  │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │  │
│   │                                                                  │  │
│   │  47+ Astro Components • SCSS Design System • Responsive         │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Steps (Fully Automated)

1. **Extract** — `sync-db.js` connects to VK API, fetching photos (albums), wall posts, videos, and discussion topics with built-in rate-limiting and retry logic
2. **Load** — Data is upserted into SQLite (`vk_cache.db`) using prepared statements with `ON CONFLICT` handling for idempotent operations  
3. **Transform** — `generate-data.js` queries the SQLite cache, applies business logic (duration filtering, tag extraction, award parsing), and outputs structured JSON
4. **Build** — Astro SSG consumes JSON files at build time, generating a fully static, CDN-ready website
5. **Deploy** — Static assets deployed to `emozika.ru` (production)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Astro 5.16 | Static Site Generation with island architecture |
| **Database** | SQLite (better-sqlite3) | Local cache for VK content (39MB+) |
| **ETL Scripts** | Node.js (ES Modules) | Data extraction, transformation, loading |
| **Styling** | SCSS/Sass 1.69 | Component-scoped styles with design tokens |
| **Testing** | Playwright | Cross-browser E2E testing (Chrome, Firefox, Safari) |
| **API Integration** | VK API v5.199 | Primary content source |
| **Build Tool** | Vite 5 | Fast dev server and optimized builds |
| **TypeScript** | TS 5.9 | Type checking (astro-check) |
| **SEO** | @astrojs/sitemap | Automatic sitemap generation |

---

## ✅ Current Status & Roadmap

### Core Infrastructure
- [x] **ETL Pipeline** — VK → SQLite → JSON workflow fully operational
- [x] **Incremental Sync** — Only fetches new content since last sync
- [x] **Database Schema** — 5 tables (posts, photos, videos, topics, comments)
- [x] **Upsert Logic** — Idempotent data insertion with conflict resolution
- [x] **Rate Limiting** — Built-in retry logic for VK API (error code 6)

### Frontend
- [x] **Multi-Section Architecture** — Hub, Studio, Cinema, Theatre pages
- [x] **47+ Reusable Components** — Modular Astro component library
- [x] **Responsive Design** — Mobile-first CSS with breakpoints
- [x] **News Ticker** — Dynamic news component on homepage
- [x] **Hero with Particles** — Interactive particle background animation

### Content Coverage
- [x] **Films Catalog** — 26+ student films with metadata
- [x] **Awards System** — Parsing from VK discussion topics
- [x] **Photo Gallery** — Automatic sync from VK albums
- [x] **Branches/Locations** — 15 studio branches data
- [x] **People/Team** — Teacher and staff profiles

### Testing & Quality
- [x] **Playwright Setup** — Cross-browser test configuration
- [x] **Navigation Tests** — E2E navigation verification
- [x] **Style Tests** — Visual regression baseline
- [ ] **CI/CD Pipeline** — Automated deployment (planned)

### Planned Enhancements
- [ ] **Ticket Integration** — Yandex.Afisha widget for bookings
- [ ] **Admin Dashboard** — Content management UI
- [ ] **Telegram Notifications** — Sync status alerts
- [ ] **Media Analytics** — View counts and engagement metrics
- [ ] **Search Functionality** — Full-text search across content

---

## ⭐ Key Features

### 🔄 Smart Incremental Sync
```javascript
// Only fetches content newer than last sync
if (!FORCE_REFRESH) {
    const row = db.prepare('SELECT MAX(date) as d FROM posts').get();
    if (row && row.d) lastSyncedDate = row.d;
}
```
The sync system tracks the most recent timestamp per table, dramatically reducing API calls on subsequent runs.

### 🏷️ Automatic Content Tagging
```javascript
if (textLower.includes('#награда') || textLower.includes('диплом')) 
    tags.push('award');
```
Posts are automatically tagged based on keyword detection (awards, plays, events), enabling smart content filtering.

### 📸 Intelligent Photo Resolution
```javascript
// Selects highest quality image from VK size variants
const typePriority = { 'w': 10, 'z': 9, 'y': 8, 'x': 7 };
```
The pipeline automatically selects the highest resolution image from VK's multi-size format.

### 🎬 Video Duration Classification
```sql
-- Films (>5 min)
SELECT * FROM videos WHERE duration > 300 ORDER BY date DESC LIMIT 6
-- Clips (≤1 min)  
SELECT * FROM videos WHERE duration <= 60 ORDER BY date DESC LIMIT 8
```
Videos are automatically categorized into films vs. clips based on duration.

### 🧪 Cross-Browser Testing
```typescript
projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```
Playwright configured for comprehensive browser coverage with HTML reporting.

---

## 📁 Project Structure

```
emozika-theatre/
├── src/
│   ├── components/          # 47+ Astro components
│   │   ├── cinema/          # Film-related UI
│   │   ├── studio/          # Education section
│   │   ├── theatre/         # Show listings
│   │   ├── hub/             # Landing page
│   │   └── common/          # Shared components
│   ├── data/                # JSON data files (19 files)
│   │   ├── films.json       # 26+ films catalog
│   │   ├── people.json      # Team profiles
│   │   ├── vk_*.json        # Auto-generated from VK
│   │   └── ...
│   ├── db/
│   │   └── vk_cache.db      # SQLite cache (39MB)
│   ├── scripts/             # ETL & utility scripts
│   │   ├── sync-db.js       # VK → SQLite
│   │   ├── generate-data.js # SQLite → JSON
│   │   └── db.js            # Database schema & helpers
│   ├── pages/               # Astro page routes
│   └── layouts/             # Page layouts
├── tests_integration/       # Playwright E2E tests
├── public/                  # Static assets
├── playwright.config.ts     # Test configuration
├── astro.config.mjs         # Astro configuration
└── package.json
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run VK sync (requires API tokens in .env)
npm run sync:vk

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

```env
VK_SERVICE_TOKEN=your_service_token
VK_USER_TOKEN=your_user_token    # Optional: for video access
VK_GROUP_ID=your_group_id
```

---

## 📊 Technical Highlights for Recruiters

| Skill Area | Demonstrated Capability |
|------------|------------------------|
| **Data Engineering** | ETL pipeline design, incremental sync, SQLite optimization |
| **API Integration** | VK API pagination, rate limiting, error handling |
| **Database Design** | Schema design, prepared statements, upsert patterns |
| **Backend Logic** | Node.js scripting, async/await, transaction handling |
| **Frontend** | Component-based architecture, SSG, SEO optimization |
| **Testing** | Cross-browser E2E testing, Playwright configuration |
| **DevOps** | npm scripts, environment configuration, build pipelines |

---

## 📜 License

This project is private and developed for Emozika Theatre Studio in Saint Petersburg, Russia.

---

**Built with ❤️ by [Stanislav Burundukov](https://github.com/burundu4ok2000)**
