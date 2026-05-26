# Production Deployment

This directory is the **production-ready clone** of `eventvenue-new`. The
original `C:\Projects\eventvenue-new` stays untouched for client review;
all deployment work happens here on the `production` branch.

## Layout

```
C:\Projects\eventvenue-new           # client review (do not modify)
C:\Projects\eventvenue-production    # this folder, branch: production
```

## One-time setup (already done)

1. `git clone C:\Projects\eventvenue-new C:\Projects\eventvenue-production`
2. Remote `origin` re-pointed to `https://github.com/HaikalTDM/eventvenue.asia.git`
3. New branch `production` checked out
4. `.env` copied over (gitignored, not in clone by default)
5. `next.config.js` hardened (strict mode, security headers, R2 CDN host)
6. `.env.production.example` added as template for prod secrets
7. `Dockerfile` + `.dockerignore` added for container deploys

## Before deploying

1. Create `.env.production.local` from `.env.production.example` and fill in
   real production secrets (Supabase prod, R2 prod bucket, Pusher prod app,
   rotated JWT secrets, etc.). **Do not reuse dev secrets.**
2. Install deps: `npm ci`
3. Build: `npm run build`
4. Smoke test: `npm run start` then hit `http://localhost:3000`

## Deploy options

### Vercel
```
vercel link
vercel env pull .env.production.local
vercel --prod
```

### Docker
```
docker build -t eventvenue:prod .
docker run --env-file .env.production.local -p 3000:3000 eventvenue:prod
```

### Self-hosted Node
```
npm ci --omit=dev=false
npm run build
NODE_ENV=production npm run start
```

## Pushing the production branch

```
git push -u origin production
```

Open a PR from `production` -> `master` only after the deploy is verified.

## Keeping in sync with client review

When `eventvenue-new` (master) gets new client-approved changes:

```
# in eventvenue-production
git fetch origin
git checkout production
git merge origin/master       # or: git rebase origin/master
```

Resolve conflicts in production-only files (`next.config.js`, env templates,
`Dockerfile`) keeping the production version.
