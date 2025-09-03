# JobTracker Pro

JobTracker Pro helps you organize and monitor your job applications. The app is built with Next.js and uses Supabase for authentication and data storage.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root and add your Supabase credentials:

```bash
SUPABASE_URL=<your-project-url>
SUPABASE_ANON_KEY=<your-anon-key>
```

3. Start the development server:

```bash
npm run dev
```

4. To build and run in production:

```bash
npm run build
npm start
```

## Features

- Track job applications and their statuses
- Store notes for each application
- Supabase-powered authentication and database
- Responsive Next.js UI

