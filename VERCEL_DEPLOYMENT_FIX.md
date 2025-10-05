# Vercel Deployment Configuration for Leave Management System

## Root Cause of Static Assets Issue

The issue was that Vercel didn't know how to handle the monorepo structure where the Next.js frontend is in a `frontend/` subdirectory instead of the root.

## Solution Applied

### 1. Created `vercel.json` in project root with monorepo configuration:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm ci && npm run build",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "npm ci && cd frontend && npm ci",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ]
}
```

### 2. Key Configuration Elements:

- **buildCommand**: Explicitly tells Vercel to build the frontend subdirectory
- **outputDirectory**: Points to the correct Next.js build output location
- **installCommand**: Ensures dependencies are installed in both root and frontend
- **framework**: Tells Vercel this is a Next.js project
- **rewrites**: Routes all requests to the frontend directory

## Deployment Steps

### For New Deployment:
1. Commit the new `vercel.json` file
2. Push to your repository
3. In Vercel dashboard, reimport or redeploy the project
4. Vercel should now correctly detect and build the frontend

### For Existing Deployment:
1. Go to your Vercel project settings
2. Under "Build & Output Settings":
   - Build Command: `cd frontend && npm ci && npm run build`
   - Output Directory: `frontend/.next`
   - Install Command: `npm ci && cd frontend && npm ci`
3. Redeploy the project

## Verification

After deployment, your static assets should be accessible at:
- `https://your-app.vercel.app/_next/static/chunks/...`
- `https://your-app.vercel.app/_next/static/css/...`

## Alternative Solutions (if needed)

If the above doesn't work, you can also try:

1. **Move frontend to root**: Move all files from `frontend/` to root directory
2. **Use Vercel CLI with explicit config**: Deploy using `vercel --prod` with explicit configuration
3. **Separate projects**: Deploy frontend and backend as separate Vercel projects

## Build Verification

The build is working correctly locally as evidenced by:
- ✓ Compiled successfully in 3.9s
- ✓ Static assets generated in `frontend/.next/static/`
- ✓ All pages building properly (19/19 generated)

The issue was purely a deployment configuration problem, not a build problem.