import { z } from 'zod'

// Cleanup configuration schema with Zod validation
export const CleanupConfigSchema = z.object({
  filePatterns: z.object({
    remove: z.array(z.string()),
    preserve: z.array(z.string()),
    nextjsSpecific: z.array(z.string()),
  }),
  codePatterns: z.object({
    consoleStatements: z.array(z.string()),
    mockDataPatterns: z.array(z.string()),
    debugComments: z.array(z.string()),
    hardcodedCredentials: z.array(z.string()),
    developmentOnlyCode: z.array(z.string()),
  }),
  emptyStates: z.array(z.object({
    id: z.string(),
    component: z.string(),
    header: z.object({
      media: z.object({
        variant: z.enum(['default', 'icon']),
        icon: z.string().optional(),
        customElement: z.string().optional(),
      }),
      title: z.string(),
      description: z.string(),
    }),
    content: z.object({
      actions: z.array(z.object({
        label: z.string(),
        variant: z.enum(['default', 'outline', 'link']),
        size: z.enum(['sm', 'default', 'lg']).optional(),
        href: z.string().optional(),
        onClick: z.string().optional(),
      })),
    }).optional(),
    learnMore: z.object({
      text: z.string(),
      href: z.string(),
      external: z.boolean().optional(),
    }).optional(),
    className: z.string().optional(),
  })),
  errorHandling: z.object({
    errorBoundaryConfig: z.object({
      fallbackComponent: z.string(),
      onError: z.string().optional(),
      isolateErrorBoundaries: z.boolean(),
    }),
    apiErrorConfig: z.object({
      supabaseErrors: z.record(z.string(), z.string()),
      httpErrors: z.record(z.string(), z.string()),
      networkErrors: z.record(z.string(), z.string()),
    }),
  }),
  performance: z.object({
    bundleOptimization: z.boolean(),
    codesplitting: z.boolean(),
    imageLazyLoading: z.boolean(),
    fontOptimization: z.boolean(),
    serverComponentValidation: z.boolean(),
  }),
  security: z.object({
    environmentVariables: z.object({
      requiredPublicVars: z.array(z.string()),
      requiredPrivateVars: z.array(z.string()),
      forbiddenPatterns: z.array(z.string()),
    }),
    supabaseSecrets: z.object({
      validateRLSPolicies: z.boolean(),
      checkServiceRoleUsage: z.boolean(),
      auditPublicKeyExposure: z.boolean(),
    }),
    contentSecurityPolicy: z.boolean(),
  }),
})

export type CleanupConfig = z.infer<typeof CleanupConfigSchema>

// Default production cleanup configuration
export const defaultCleanupConfig: CleanupConfig = {
  filePatterns: {
    remove: [
      '**/*_SUMMARY.md',
      '**/*_GUIDE.md',
      '**/CONV.txt',
      '**/GEMINI.md',
      '**/PRODUCTION_*.md',
      '**/QUESTION.txt',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/__tests__/**',
      '**/e2e/**',
      '**/test-results/**',
      '**/coverage/**',
      '**/.playwright/**',
      '**/.temp/**',
      '**/tmp/**',
      '**/*.log',
      '**/*.cache',
      '**/debug.log',
      '**/error.log',
    ],
    preserve: [
      'README.md',
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      '.env.example',
      '.gitignore',
    ],
    nextjsSpecific: [
      '.next/**',
      '.turbo/**',
      '.vercel/**',
      'frontend/.next/**',
      'frontend/.turbo/**',
      'frontend/.vercel/**',
      'backend/.temp/**',
      'supabase/.temp/**',
      '**/*.tsbuildinfo',
      '**/.eslintcache',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.DS_Store',
      '**/Thumbs.db',
    ],
  },
  codePatterns: {
    consoleStatements: [
      'console\\.log\\(',
      'console\\.warn\\(',
      'console\\.error\\(',
      'console\\.debug\\(',
      'console\\.info\\(',
    ],
    mockDataPatterns: [
      '// Mock data',
      '// TODO: Replace with real data',
      'const mockData = ',
      'const MOCK_',
    ],
    debugComments: [
      '// TODO:',
      '// FIXME:',
      '// DEBUG:',
      '// HACK:',
      '// XXX:',
    ],
    hardcodedCredentials: [
      'sk_live_',
      'sk_test_',
      'pk_live_',
      'pk_test_',
      'password.*=.*["\']',
      'secret.*=.*["\']',
      'key.*=.*["\']',
    ],
    developmentOnlyCode: [
      'if.*process\\.env\\.NODE_ENV.*development',
      '__DEV__',
      'development.*only',
    ],
  },
  emptyStates: [
    {
      id: 'no-leave-requests',
      component: 'LeaveRequestsList',
      header: {
        media: {
          variant: 'icon',
          icon: 'Calendar',
        },
        title: 'No Leave Requests Yet',
        description: 'You haven\'t submitted any leave requests yet. Get started by creating your first request.',
      },
      content: {
        actions: [
          {
            label: 'Create Leave Request',
            variant: 'default',
          },
        ],
      },
    },
    {
      id: 'no-team-members',
      component: 'TeamMembersList',
      header: {
        media: {
          variant: 'icon',
          icon: 'Users',
        },
        title: 'No Team Members',
        description: 'No team members have been added yet. Invite team members to get started.',
      },
      content: {
        actions: [
          {
            label: 'Invite Team Member',
            variant: 'default',
          },
        ],
      },
    },
    {
      id: 'no-notifications',
      component: 'NotificationsList',
      header: {
        media: {
          variant: 'icon',
          icon: 'Bell',
        },
        title: 'No Notifications',
        description: 'You\'re all caught up! No new notifications at this time.',
      },
    },
  ],
  errorHandling: {
    errorBoundaryConfig: {
      fallbackComponent: 'ErrorFallback',
      isolateErrorBoundaries: true,
    },
    apiErrorConfig: {
      supabaseErrors: {
        'PGRST116': 'no-rows-returned',
        'PGRST301': 'permission-denied',
        '23505': 'duplicate-key-error',
      },
      httpErrors: {
        '401': 'redirect-to-login',
        '403': 'access-denied-with-role-context',
        '422': 'field-validation-errors',
        '500': 'generic-retry-with-support-contact',
      },
      networkErrors: {
        'timeout': 'retry-with-exponential-backoff',
        'offline': 'offline-mode-message',
        'cors': 'configuration-error-message',
      },
    },
  },
  performance: {
    bundleOptimization: true,
    codesplitting: true,
    imageLazyLoading: true,
    fontOptimization: true,
    serverComponentValidation: true,
  },
  security: {
    environmentVariables: {
      requiredPublicVars: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_APP_NAME',
        'NEXT_PUBLIC_VERSION',
      ],
      requiredPrivateVars: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
      ],
      forbiddenPatterns: [
        'sk_live_[a-zA-Z0-9]+',
        'sk_test_[a-zA-Z0-9]+',
        'password.*=.*["\'][^"\']+["\']',
        'secret.*=.*["\'][^"\']+["\']',
      ],
    },
    supabaseSecrets: {
      validateRLSPolicies: true,
      checkServiceRoleUsage: true,
      auditPublicKeyExposure: true,
    },
    contentSecurityPolicy: true,
  },
}