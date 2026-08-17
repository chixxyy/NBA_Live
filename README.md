# NBA Live Draft & Trade Simulator

A real-time NBA player drafting and trading simulation game powered by Vue.js, TailwindCSS, and Supabase.

## Overview
This application allows users to experience managing an NBA roster in real-time. Players are randomly drafted into a 5-man starting lineup and a 5-man bench. You must manage your team's salary cap, trade players up and down the tiers based on strict trade logic, and react to live simulation changes.

## Features
- **Real-time Live Stats:** A backend Node.js worker continuously simulates live games and updates player stats (PTS, REB, AST, etc.), causing their OVR (Overall Rating) to dynamically fluctuate in real time!
- **Dynamic Salary Cap:** Players' prices are tied to their performance. As they hit hot streaks and rise in tiers (e.g. A to S), their value increases. 
- **Tier System:** 
  - **S Tier:** Top 10 players
  - **A Tier:** Rank 11 - 30
  - **B Tier:** Rank 31 - 60
  - **C Tier:** Rank 61 - 80
  - **D Tier:** Rank 81 - 100
- **Trade Logic:** You can only trade a player for another player of the **same or lower tier**. Upgrading to higher tiers directly is restricted, forcing you to capitalize on undervalued players who are on the rise!
- **Sleek UI:** Smooth, dark-mode focused UI with interactive glassmorphism, micro-animations, and drag-and-drop roster management.

## Tech Stack
- **Frontend:** Vue 3, Vite, TailwindCSS
- **Backend:** Node.js (worker process)
- **Database / Real-time:** Supabase

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
2. Configure Supabase:
   - Create a `.env` file in the root directory (and `/server` if needed) containing:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_key
     ```
   - Ensure you never commit your `.env` files.
3. Start the application:
   - Run the frontend:
     ```bash
     npm run dev
     ```
   - Run the backend simulation worker:
     ```bash
     cd server && node worker.js
     ```

## Security
- **WARNING:** The `.env` files contain sensitive API keys. They have been added to `.gitignore`. **Never commit these files.**
