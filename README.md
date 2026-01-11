This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prerequisites

- Node.js 20.x or later
- Docker Desktop (for local PostgreSQL database)
- npm, yarn, pnpm, or bun

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Set Up Local Database

The project includes automated database setup scripts. Simply run:

```bash
npm run dev
```

This will automatically:
- Check if Docker is installed
- Start a PostgreSQL container if it doesn't exist
- Wait for the database to be ready
- Run database migrations
- Generate Prisma Client
- Start the development server

**Manual Database Setup** (if needed):

```bash
# Set up database (creates container, runs migrations)
npm run setup:db

# Or manage the database manually:
npm run db:start      # Start PostgreSQL container
npm run db:stop       # Stop PostgreSQL container
npm run db:restart    # Restart PostgreSQL container
npm run db:migrate    # Run migrations only
npm run db:generate   # Generate Prisma Client only
npm run db:studio     # Open Prisma Studio (database GUI)
npm run db:reset      # Reset database (WARNING: deletes all data)
```

### 3. Environment Variables

The setup script will automatically create a `.env` file with the following default values:

```
DATABASE_URL="postgresql://nutrition_user:nutrition_password@localhost:5432/nutrition_tracker?schema=public"
DIRECT_URL="postgresql://nutrition_user:nutrition_password@localhost:5432/nutrition_tracker?schema=public"
```

If you need to customize these values, edit the `.env` file after it's created.

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The database setup runs automatically before the dev server starts (via `predev` hook).

## Database Management

- **Container Name**: `nutrition-tracker-db`
- **Port**: `5432`
- **Database**: `nutrition_tracker`
- **User**: `nutrition_user`
- **Password**: `nutrition_password`

You can check the container status with:
```bash
docker ps --filter "name=nutrition-tracker-db"
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
