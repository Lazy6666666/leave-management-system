#!/bin/bash
# Supabase Deployment Script
# This script deploys migrations and edge functions to Supabase

set -e

echo "🚀 Starting Supabase Deployment..."
echo "=================================="

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Navigate to backend directory
cd backend

# Check if linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Not linked to a Supabase project."
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📊 Applying database migrations..."
supabase db push

echo "✅ Migrations applied successfully!"

echo ""
echo "🔧 Deploying Edge Functions..."
echo "=================================="

# Deploy all edge functions
echo "Deploying approve-leave..."
supabase functions deploy approve-leave

echo "Deploying create-leave-request..."
supabase functions deploy create-leave-request

echo "Deploying check-document-expiry..."
supabase functions deploy check-document-expiry

echo "Deploying initialize-leave-balances..."
supabase functions deploy initialize-leave-balances

echo "✅ All Edge Functions deployed successfully!"

echo ""
echo "📝 Generating TypeScript types..."
supabase gen types typescript --linked > ../lib/database.types.ts
echo "✅ Types generated successfully!"

echo ""
echo "🎉 Supabase deployment complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Set up storage buckets in Supabase dashboard"
echo "2. Configure email templates"
echo "3. Create test users using seed script"
echo ""
