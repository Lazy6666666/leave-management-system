# Leave Management System - Backend

This directory contains the backend services for the Leave Management System, built with Supabase and Node.js.

## Project Structure

```
backend/
├── src/                 # Backend source code
│   ├── functions/       # Supabase Edge Functions
│   └── types/           # TypeScript type definitions
└── supabase/            # Supabase configuration
    ├── migrations/      # Database migrations
    └── seed/            # Seed data for development
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)
- Docker (for local development)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Update the environment variables in `.env.local` with your Supabase credentials.

### Development

1. Start the Supabase local development environment:
   ```bash
   npx supabase start
   ```

2. In a separate terminal, start the development server:
   ```bash
   npm run dev
   ```

### Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Supabase:
   ```bash
   npx supabase functions deploy
   ```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project
- `npm run deploy` - Deploy to Supabase
- `npm run db:generate` - Generate TypeScript types from the database
- `npm run db:reset` - Reset the database
- `npm run db:push` - Push database changes

## Environment Variables

Create a `.env.local` file in the root of the backend directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
