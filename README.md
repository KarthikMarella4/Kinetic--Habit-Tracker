# KINETIC - Habit Tracker ⚡

A high-performance, precision-engineered habit tracking Progressive Web App (PWA) built with **Next.js 16**, **Tailwind CSS**, and **Prisma SQLite**.

![KINETIC Banner](/public/icon-512.jpg)

## Features

- **Precision Dashboard:** Daily protocol tracking, streak calculation, and interactive completion rings.
- **Weekly Timeline:** Seamless navigation between previous/next weeks with automatic date synchronization.
- **Weekly Velocity Chart:** Real-time 7-day performance analytics and consistency scoring.
- **Consistency Matrix:** Comprehensive Mon–Sun habit breakdown with quick cell toggling.
- **Light & Dark Themes:** Dual aesthetic with precision blueprint grid pattern.
- **Offline & Local Storage:** Embedded SQLite engine powered by Prisma with instant local persistence.
- **PWA Ready:** Installable on iOS, Android, and Desktop with custom app icon.
- **Customizable Preferences:** Editable user profile name, sample data restoration, and clean-slate resets.

## Tech Stack

- **Framework:** [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **Styling:** Vanilla CSS + Tailwind CSS v4
- **Database & ORM:** SQLite + [Prisma ORM](https://www.prisma.io/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Fonts:** Plus Jakarta Sans & JetBrains Mono

## Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/KarthikMarella4/Kinetic--Habit-Tracker.git
cd Kinetic--Habit-Tracker

# Install dependencies
npm install

# Run database migrations
npx prisma db push
npx prisma generate

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Netlify

1. Link your GitHub repository in [Netlify](https://app.netlify.com).
2. Netlify will automatically detect `netlify.toml` and Next.js settings:
   - **Build Command:** `npm run build` (runs `prisma generate && next build`)
   - **Publish Directory:** `.next`
3. Click **Deploy**.
