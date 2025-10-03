# Environment Setup Guide

This guide will help you set up your development environment for the Leave Management System.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git
- Docker (for local Supabase development)
- Supabase CLI (`npm install -g supabase`)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd leave-management-system
```

### 2. Set Up Frontend

1. Navigate to the project root:
   ```bash
   cd leave-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your configuration.

### 3. Set Up Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your Supabase configuration.

## Development

### Running the Application

1. Start the frontend development server (from project root):
   ```bash
   npm run dev
   ```

2. Start the Supabase local development environment (from backend directory):
   ```bash
   npx supabase start
   ```

3. The application will be available at: http://localhost:3000

### Database Migrations

1. To create a new migration:
   ```bash
   cd backend
   npx supabase migration new migration_name
   ```

2. To apply migrations:
   ```bash
   npx supabase db reset
   ```

## Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Backend (`.env.local`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

## Testing

### Running Tests

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`
- Test coverage: `npm run test:coverage`

## Production Deployment

### Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

### Deployment to Vercel/Netlify

1. Connect your repository to Vercel/Netlify
2. Set up the environment variables
3. Deploy!

## Troubleshooting

- If you encounter database connection issues, ensure Supabase is running locally
- Check the browser console for frontend errors
- Check the terminal output for backend errors
- Ensure all environment variables are properly set
