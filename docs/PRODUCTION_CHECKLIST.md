# Production Readiness Checklist

Before deploying to production, ensure all items on this checklist are completed.

## Infrastructure

- [ ] Set up production database with appropriate sizing
- [ ] Configure database backups and test restoration process
- [ ] Set up monitoring and alerting
- [ ] Configure logging and log retention policy
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN if applicable

## Security

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Rotate all API keys and secrets
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Set up security headers (CSP, HSTS, etc.)
- [ ] Disable debug mode in production
- [ ] Ensure all dependencies are up to date
- [ ] Run security audit: `npm audit`
- [ ] Set up WAF (Web Application Firewall)

## Performance

- [ ] Enable compression (Gzip/Brotli)
- [ ] Configure caching headers
- [ ] Optimize images and assets
- [ ] Implement code splitting
- [ ] Set up database indexes
- [ ] Configure CDN caching
- [ ] Run performance tests
- [ ] Optimize database queries

## Testing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified

## Monitoring & Analytics

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured
- [ ] Analytics integration (e.g., Google Analytics)
- [ ] Set up alerting for critical issues
- [ ] Log aggregation configured

## Documentation

- [ ] API documentation updated
- [ ] Deployment guide written
- [ ] Runbook for common operations
- [ ] Rollback procedures documented
- [ ] Contact information for support

## Deployment

- [ ] Deployment checklist completed
- [ ] Rollback plan tested
- [ ] Database migrations tested
- [ ] Environment variables verified
- [ ] Backup procedures tested
- [ ] DNS records updated
- [ ] SSL certificates installed and tested

## Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitoring dashboards verified
- [ ] Alerts configured and tested
- [ ] Performance benchmarks recorded
- [ ] Team notified of deployment
- [ ] Deployment documented

## Maintenance

- [ ] Schedule regular security audits
- [ ] Set up dependency updates (e.g., Dependabot)
- [ ] Regular backup testing
- [ ] Performance monitoring in place
- [ ] Update documentation as needed

## Compliance

- [ ] GDPR/CCPA compliance verified
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented
- [ ] Data retention policy implemented

## Disaster Recovery

- [ ] Backup procedures documented
- [ ] Disaster recovery plan in place
- [ ] Regular backup testing
- [ ] Failover procedures tested
- [ ] Incident response plan documented

## Checklist for Each Deployment

### Before Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Changelog updated
- [ ] Database backups completed
- [ ] Team notified of maintenance window

### During Deployment
- [ ] Deploy to staging first
- [ ] Verify staging deployment
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Verify production deployment

### After Deployment
- [ ] Run smoke tests
- [ ] Verify monitoring
- [ ] Update documentation
- [ ] Notify team of successful deployment
- [ ] Archive deployment artifacts
