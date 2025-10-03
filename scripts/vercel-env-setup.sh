#!/bin/bash

# Vercel Environment Variables Setup Script
# This script adds all required environment variables to Vercel

echo "Setting up Vercel environment variables..."

# Production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes <<< "https://ofkcmmwibufljpemmdde.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODM1NTUsImV4cCI6MjA3NDk1OTU1NX0._piBD4oQ9ymXOkvY0Cs-HCAbDXu-Yi9aT4fKtT5wvVs"
vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzU1NSwiZXhwIjoyMDc0OTU5NTU1fQ.-nuLV6b4dqIiqX-9RL84c4x4GNHjJoEgGQZJUC0pxbM"
vercel env add NEXT_PUBLIC_APP_URL production --yes <<< "https://leave-management-system.vercel.app"
vercel env add NEXT_PUBLIC_VERSION production --yes <<< "1.0.0"

# Preview environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL preview --yes <<< "https://ofkcmmwibufljpemmdde.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODM1NTUsImV4cCI6MjA3NDk1OTU1NX0._piBD4oQ9ymXOkvY0Cs-HCAbDXu-Yi9aT4fKtT5wvVs"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview --yes <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzU1NSwiZXhwIjoyMDc0OTU5NTU1fQ.-nuLV6b4dqIiqX-9RL84c4x4GNHjJoEgGQZJUC0pxbM"

echo "Environment variables configured successfully!"
