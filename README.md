# Gator

Gator is a command-line RSS feed aggregator built with TypeScript, PostgreSQL, and Drizzle ORM.

## Requirements

Before running Gator, you need:

- Node.js
- npm
- PostgreSQL

## Installation

Clone the repository:

    git clone https://github.com/MohyeeSs/blog-aggregator.git
    cd blog-aggregator

Install dependencies:

    npm install

## Configuration

Gator uses a configuration file located at:

    ~/.gatorconfig.json

Create the file with:

    {
      "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
      "current_user_name": ""
    }

The `db_url` specifies the PostgreSQL database used by Gator.

The `current_user_name` stores the currently logged-in user.

Do not commit this file to GitHub because it contains database connection information.

## Database Setup

Make sure PostgreSQL is running and a database named `gator` exists.

Run the database migrations:

    npx drizzle-kit migrate

## Running Gator

Run Gator commands with:

    npm run start <command> [arguments]

## Commands

### Register

    npm run start register <username>

Example:

    npm run start register kahya

### Login

    npm run start login <username>

Example:

    npm run start login kahya

### Users

    npm run start users

### Add a Feed

    npm run start addfeed "<feed-name>" "<feed-url>"

Example:

    npm run start addfeed "Hacker News RSS" "https://hnrss.org/newest"

### List Feeds

    npm run start feeds

### Follow a Feed

    npm run start follow "<feed-url>"

Example:

    npm run start follow "https://hnrss.org/newest"

### Following

    npm run start following

### Unfollow

    npm run start unfollow "<feed-url>"

Example:

    npm run start unfollow "https://hnrss.org/newest"

### Aggregate Feeds

    npm run start agg <time_between_requests>

Example:

    npm run start agg 10s

Supported duration units:

- `ms` - milliseconds
- `s` - seconds
- `m` - minutes
- `h` - hours

Press `Ctrl+C` to stop the aggregator.

### Browse Posts

    npm run start browse

By default, 2 posts are displayed.

You can specify a custom limit:

    npm run start browse 10

## Typical Workflow

    npm run start register kahya
    npm run start login kahya

    npm run start addfeed "Hacker News RSS" "https://hnrss.org/newest"
    npm run start follow "https://hnrss.org/newest"

    npm run start agg 10s

Then, from another terminal:

    npm run start browse

## Tech Stack

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- Drizzle Kit
- fast-xml-parser
- tsx

## GitHub Repository

https://github.com/MohyeeSs/blog-aggregator
