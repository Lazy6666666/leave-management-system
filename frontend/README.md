# Leave Management System

A comprehensive, production-ready leave management system built with Next.js, React, TypeScript, and Supabase.

## Project Structure

```
leave-management-system/
├── backend/               # Backend services and functions
│   ├── src/               # Backend source code
│   └── supabase/          # Supabase configuration and migrations
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
├── pages/                 # Next.js pages
├── public/                # Static assets
├── styles/                # Global styles
├── types/                 # TypeScript type definitions
├── ui/                    # UI component library
├── .env.local             # Environment variables
├── next.config.js         # Next.js configuration
├── package.json           # Frontend dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Features

- **Authentication & User Management**: Secure authentication with role-based access control
- **Leave Request Management**: Submit, track, and manage leave requests with approval workflows
- **Document Management**: Upload and manage company documents with expiry tracking
- **Team Calendar**: Visual team availability and leave scheduling
- **Admin Dashboard**: Comprehensive administrative tools and reporting
- **Real-time Notifications**: Instant updates for leave status changes
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Beautiful dark theme as default with light mode option

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage, Edge Functions)
- **PostgreSQL** - Primary database
- **Row Level Security** - Database-level security policies

### DevOps & Monitoring
- **Vercel/Netlify** - Deployment platforms
- **GitHub Actions** - CI/CD pipelines
- **Sentry** - Error tracking and monitoring
## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### Project Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase database**
   ```bash
   # Generate types from your Supabase schema
   npm run db:generate

   # Push schema changes
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main application pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and configurations
│   └── types/                # TypeScript type definitions
├── design/                   # Design specifications
├── docs/                     # Documentation
└── middleware.ts             # Next.js middleware
```

## Key Features Explained

### Authentication System
- Email/password authentication via Supabase Auth
- Role-based access control (Employee, Manager, Admin, HR)
- Protected routes and middleware
- Session management

### Leave Management
- Multiple leave types (Annual, Sick, Personal, etc.)
- Automatic balance calculation and validation
- Approval workflows with comments
- Leave calendar integration

### Document Management
- Secure file upload to Supabase Storage
- Document categorization and metadata
- Expiry date tracking with automated notifications
- Access control and audit logging

### Real-time Features
- Live updates for leave request status changes
- Real-time notifications
- Team calendar synchronization

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate types from Supabase schema
- `npm run db:reset` - Reset local database
- `npm run db:push` - Push schema changes to Supabase

### Code Quality

- **ESLint** - Code linting with Next.js and TypeScript rules
- **Prettier** - Code formatting
- **TypeScript Strict Mode** - Comprehensive type checking
- **Husky** - Git hooks for pre-commit quality checks

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with roles and departments
- **leaves** - Leave requests with status tracking
- **leave_types** - Configurable leave types and rules
- **company_documents** - Document storage and metadata
- **document_notifiers** - Automated notification scheduling
- **notification_logs** - Notification delivery tracking

## API Reference

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Leave Management
- `GET /api/leaves` - Get user's leave requests
- `POST /api/leaves` - Create leave request
- `POST /api/leaves/{id}/approve` - Approve/reject leave request

### Document Management
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `DELETE /api/documents/{id}` - Delete document

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- **Row Level Security (RLS)** policies on all database tables
- **Input validation** and sanitization
- **Rate limiting** on API endpoints
- **Secure headers** and CSP policies
- **Regular security audits** and dependency updates

## Monitoring

- **Sentry** integration for error tracking
- **Performance monitoring** with Core Web Vitals
- **Database query performance** tracking
- **User analytics** and engagement metrics

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.

---

Built with ❤️ using Next.js, React, TypeScript, and Supabase.
