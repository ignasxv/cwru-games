# CWRU Wordle Game

A Wordle-inspired game built for Case Western Reserve University, featuring user accounts, statistics tracking, and global leaderboards.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Classic Wordle Gameplay**: Guess the 5-letter word in 6 tries with color-coded feedback.
- **User Accounts**: Sign up and login to save your progress across devices.
- **Detailed Statistics**: Track your games played, win rate, current streak, max streak, and guess distribution.
- **Global Leaderboard**: See how you stack up against other players in the rankings.
- **Admin Dashboard**: Administrators can manage the daily words and game settings.
- **Responsive Design**: Fully optimized for both desktop and mobile play.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Authentication**: JWT-based custom auth

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or later)
- PostgreSQL database

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ignasxv/cwru-games.git
    cd cwru-games
    ```

2.  **Install dependencies**
    ```bash
    bun install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root directory. You can use a `.env.example` as a reference if available, or ensure you have the following variables (example):
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/cwru_games
    JWT_SECRET=your_super_secret_jwt_key
    ```

4.  **Initialize the database**
    Generate migrations and push them to your database:
    ```bash
    bun db:generate
    bun db:migrate
    ```

5.  **Run the development server**
    ```bash
    bun dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `bun dev`: Runs the development server.
- `bun build`: Builds the application for production.
- `bun start`: Starts the production server.
- `bun db:generate`: Generates Drizzle migrations based on schema changes.
- `bun db:migrate`: Applies migrations to the database.
- `bun db:studio`: Opens Drizzle Studio for visual database management.

## License

This project is licensed under the MIT License.