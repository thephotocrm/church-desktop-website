# First Pentecostal Church of Dallas - Website

## Overview
A comprehensive, visually stunning church website for First Pentecostal Church of Dallas featuring 9 pages with Spirit-filled content, dynamic animations, and a rich navy/gold design theme.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Framer Motion + Shadcn UI
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **Routing**: Wouter (client-side)
- **Data Fetching**: TanStack React Query
- **Styling**: Custom navy/gold theme with Playfair Display headings + Open Sans body text

## Pages
- `/` - Home (Hero, Service Times, Welcome, Pastor Section, Featured Events, CTA)
- `/about` - About Us (Story, Vision & Mission, Core Values)
- `/beliefs` - Statement of Faith (8 core doctrines)
- `/leadership` - Church Leadership Team (dynamic from DB)
- `/connect` - Contact Form + Church Info (form submits to API)
- `/live` - Live Stream (YouTube/Facebook links, schedule)
- `/give` - Online Giving (ways to give, impact breakdown)
- `/events` - Upcoming Events (dynamic from DB)
- `/ministries` - Church Ministries (dynamic from DB)

## API Endpoints
- `GET /api/events` - All events
- `GET /api/leaders` - All leaders (ordered by orderIndex)
- `GET /api/ministries` - All ministries
- `POST /api/contact` - Submit contact form

## Database Tables
- `users`, `contact_submissions`, `events`, `leaders`, `ministries`

## Design Theme
- Primary: Deep navy (#1a2744)
- Accent: Warm gold (#d4a017)
- Fonts: Playfair Display (headings), Open Sans (body)
- Dark mode support with class-based toggling

## Key Design Patterns
- Transparent navbar on home hero, solid on scroll/other pages
- Dark wash gradients over hero images for text readability
- Framer Motion scroll-triggered animations on all sections
- Per-page SEO meta tags via useSEO hook
- Seed data auto-loads on first server start
