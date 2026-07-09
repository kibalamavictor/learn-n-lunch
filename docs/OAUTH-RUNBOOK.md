# Decap OAuth Runbook (Free Tier)

## Primary

- Provider: Cloudflare Workers (free tier)
- Expected endpoint: `https://learn-n-lunch-auth.workers.dev/auth`

## Fallback trigger (Cloudflare -> Vercel)

Switch to Vercel OAuth proxy if either condition is met:

1. **Sustained load threshold**
   - Daily OAuth requests exceed **70,000/day** for **3 consecutive days**.
   - Why: this is 70% of Cloudflare free limit (100,000/day), leaving headroom for peaks.

2. **Spike threshold**
   - Any single day exceeds **85,000/day**.
   - Why: this is an early warning before hard limit and potential login outage.

Also switch immediately if Cloudflare returns auth limit errors (`Error 1027`) for admin login.

## Monitoring checklist

- Check Cloudflare Worker Analytics daily:
  - Requests (24h)
  - Error rate
  - CPU violations
- If threshold is hit, prepare Vercel fallback in the same day.

## Vercel fallback target

- Plan: Hobby (free)
- Constraints:
  - 1,000,000 function invocations/month
  - 100 GB transfer/month
  - Project may pause if limits are exceeded

## Rollback path

1. Deploy fallback OAuth function.
2. Update `admin/config.yml` backend `base_url`.
3. Re-run CMS login test with a non-admin account.
4. Keep Cloudflare Worker deployed for rollback.
