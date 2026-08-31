# Deploying RIDGE

## No VM? Use a free tunnel (fastest)

If Oracle Cloud (or other VPS signup) is blocked, expose your **local Docker** stack publicly with Cloudflare — **$0, no account required** for quick demos:

```bash
docker compose up -d          # if not already running
bash scripts/tunnel-cloudflare.sh
```

Copy the `https://….trycloudflare.com` URL it prints. Share that link with anyone.

| Pros | Cons |
|------|------|
| Works in 30 seconds | URL changes each restart (unless you set up a named tunnel) |
| No cloud signup | Your PC must stay on + Docker running |
| Free HTTPS | Not for 24/7 production |

**Firebase:** add the tunnel hostname to Firebase Console → Authentication → Settings → **Authorized domains** (e.g. `spine-eat-expressed-tongue.trycloudflare.com`).

---

## Free / cheap VM alternatives (24/7 hosting)

| Provider | Cost | Notes |
|----------|------|-------|
| **Google Cloud** e2-micro | $0 always-free | 1 GB RAM — tight; use swap. [cloud.google.com/free](https://cloud.google.com/free) |
| **AWS** EC2 t2.micro | $0 first 12 months | Same RAM limits as GCP |
| **Azure** | $200 credits / 30 days | Good for a month-long demo |
| **Hetzner** CX22 | ~€4/mo | Easiest paid option — signup rarely blocked |
| **DigitalOcean** | $6/mo or student credits | GitHub Student Pack gives $200 credit |
| **Railway / Render** | Limited free credits | Hard to run full stack (Postgres + Redis + ML) on free tier |

Use the same one-command deploy on any Ubuntu VM:

```bash
git clone https://github.com/arvinalmeida192/RIDGE.git && cd RIDGE
sudo bash scripts/deploy-vm.sh
```

---

## VM deployment (Oracle / GCP / Hetzner / etc.)

This deploys the full RIDGE stack (Postgres + PostGIS, Redis, ML service, API/dashboard, nginx) on a **single Linux VM**.

## What you need

| Item | Notes |
|------|-------|
| Linux VM | Ubuntu 22.04 or 24.04, **4 GB RAM** minimum (ARM Ampere is fine) |
| Public IP | Ports **22**, **80**, **443** open |
| Firebase project | For real user login (optional for demo — legacy login works without it) |
| Domain (optional) | For HTTPS; IP-only works for testing |

## Option A — One-command deploy (fastest)

SSH into your VM as `ubuntu` or `opc`, then run:

```bash
curl -fsSL https://raw.githubusercontent.com/arvinalmeida192/RIDGE/main/scripts/deploy-vm.sh -o deploy-vm.sh
sudo bash deploy-vm.sh
```

Or clone first and run locally on the VM:

```bash
git clone https://github.com/arvinalmeida192/RIDGE.git
cd RIDGE
sudo bash scripts/deploy-vm.sh
```

The script will:

1. Install Docker + Compose
2. Clone/update the repo to `~/RIDGE`
3. Create `.env` with random `DB_PASSWORD` and `JWT_SECRET`
4. Build and start `docker-compose.prod.yml`
5. Print your public URL when healthy

Open `http://<VM-PUBLIC-IP>/` in a browser.

### Demo login (no Firebase)

If `FIREBASE_PROJECT_ID` is empty in `.env`:

| Portal | Path | User | Password |
|--------|------|------|----------|
| Operations | `/login` | `admin` | `admin` |
| Citizen | `/citizen/login` | `user` | `user` |

---

## Option B — Oracle Cloud Always Free (step by step)

### 1. Create an account

1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Sign up (credit card required for verification; Always Free resources stay $0)
3. Choose your home region (cannot be changed later)

### 2. Create a VM

1. **Compute → Instances → Create instance**
2. Name: `ridge-server`
3. Image: **Ubuntu 24.04** (or 22.04)
4. Shape: **Ampere** → `VM.Standard.A1.Flex` → **2 OCPUs, 12 GB RAM** (or 4 OCPUs / 24 GB if available)
5. Networking: assign a **public IPv4**
6. SSH keys: download the private key (`.key` file)
7. Create

### 3. Open firewall ports

**Oracle VCN security list** (Networking → Virtual cloud networks → your VCN → Security lists):

| Direction | Protocol | Port | Source |
|-----------|----------|------|--------|
| Ingress | TCP | 22 | Your IP (or `0.0.0.0/0` for any) |
| Ingress | TCP | 80 | `0.0.0.0/0` |
| Ingress | TCP | 443 | `0.0.0.0/0` |

**Ubuntu firewall** on the VM (the deploy script handles this if `ufw` is active):

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
```

### 4. SSH and deploy

```bash
chmod 600 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@<PUBLIC_IP>

sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/arvinalmeida192/RIDGE/main/scripts/deploy-vm.sh)"
```

### 5. Configure Firebase (production auth)

On the VM:

```bash
cd ~/RIDGE
nano .env
```

Set:

```env
FIREBASE_PROJECT_ID=ridge-4970a
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=ridge-4970a.firebaseapp.com
FIREBASE_BOOTSTRAP_ADMIN_EMAILS=you@example.com
LEGACY_LOGIN_ENABLED=false
```

Upload your service account key:

```bash
# From your laptop:
scp -i ssh-key.key serviceAccountKey.json ubuntu@<PUBLIC_IP>:~/RIDGE/
```

Restart:

```bash
cd ~/RIDGE
docker compose -f docker-compose.prod.yml up -d --force-recreate server
```

In **Firebase Console → Authentication → Settings → Authorized domains**, add:

- Your VM public IP (as a custom domain won't work for IP — use a real domain for Firebase Google login)
- Your domain name once configured (e.g. `ridge.example.com`)

> **Note:** Google Sign-In requires a proper domain with HTTPS for production. Use email/password auth for IP-only testing, or set up HTTPS below.

---

## HTTPS (recommended)

Point a domain's **A record** to your VM's public IP, then on the VM:

```bash
cd ~/RIDGE
sudo DOMAIN=ridge.yourdomain.com bash scripts/setup-https.sh
```

Caddy obtains a Let's Encrypt certificate automatically.

Add the domain to Firebase **Authorized domains**.

---

## Manual operations

```bash
cd ~/RIDGE

# View logs
docker compose -f docker-compose.prod.yml logs -f server

# Restart after .env changes
docker compose -f docker-compose.prod.yml up -d --force-recreate server

# Stop everything
docker compose -f docker-compose.prod.yml down

# Update to latest code
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

## Backup database

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U ridge ridge > ridge-backup-$(date +%F).sql
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection refused` on port 80 | Check Oracle security list + `docker compose ps` |
| ML service unhealthy | Wait 2–3 min on first boot; check `docker compose logs ml-service` |
| Firebase login fails | Verify `serviceAccountKey.json`, `.env` values, authorized domains |
| Out of memory | Use a larger VM shape or set `SCORING_ENABLED=false` temporarily |

## Cost summary

| Service | Cost |
|---------|------|
| Oracle Always Free VM | $0 |
| Firebase Auth | $0 (within free tier) |
| Open-Meteo API | $0 |
| Domain (optional) | ~$10/year |
| SMS (MSG91) | Pay per message |

## Other providers

The same `deploy-vm.sh` script works on:

- Google Cloud e2-micro (free tier)
- AWS EC2 t2.micro (12-month free trial)
- DigitalOcean / Hetzner ($4–6/month — not free but simpler)

---

See also: [README.md](README.md) for local development setup.
