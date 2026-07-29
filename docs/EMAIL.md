# Email — Namecheap shared hosting + Propa3 SMTP

**DNS:** domain at DomainKing; **MX** points to Namecheap; **A records** for `propa3.com` stay on **AWS EC2**.

## System mail (NestJS)

Configure on EC2 in `.env` (never commit real passwords):

```env
SMTP_HOST=server360.web-hosting.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@propa3.com
SMTP_PASS=your-mailbox-password
SMTP_FROM="Propa3" <info@propa3.com>
```

SSL/TLS (recommended): outgoing `server360.web-hosting.com:465`.  
Non-SSL alternative: `mail.propa3.com:587` (not recommended).

If SMTP vars are missing, the API logs a warning and skips send (in-app notifications still work).

## Staff / demo mailboxes

Create on Namecheap cPanel — one mailbox per row in [demo-users-list.md](../demo-users-list.md), **same password** as the app.

| Address | Purpose |
|---------|---------|
| `info@propa3.com` | App SMTP sender only |
| `ceo@propa3.com` … `client@propa3.com` | Human mail + matching Propa3 login |

## After changing users

```bash
npm run db:seed
```

Updates emails from legacy `@triplea.ng` to `@propa3.com` and password hashes.
