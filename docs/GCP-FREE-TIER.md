# Google Cloud Free Tier — deploy RIDGE

Run RIDGE on a **$0/month** Google Cloud `e2-micro` VM. Signup is usually easier than Oracle Cloud.

## What you get (always free)

| Resource | Free allowance |
|----------|----------------|
| **e2-micro VM** | 1 instance/month in `us-west1`, `us-central1`, or `us-east1` |
| **Boot disk** | 30 GB standard persistent disk |
| **Egress** | 1 GB/month from North America (enough for light demo traffic) |

**RAM warning:** e2-micro has only **1 GB RAM**. RIDGE needs Postgres, Redis, ML, and Node — we add **4 GB swap** before deploy. It will be **slow on first boot** (2–5 min) but works for demos.

---

## Step 1 — Create a Google Cloud account

1. Go to [cloud.google.com/free](https://cloud.google.com/free)
2. Sign in with your Google account
3. Complete signup (card may be required for verification; e2-micro stays in always-free tier)
4. Open the [Cloud Console](https://console.cloud.google.com/)

---

## Step 2 — Create a project

1. Top bar → **Select a project** → **New Project**
2. Name: `ridge-deploy`
3. Click **Create**, then select that project

---

## Step 3 — Enable Compute Engine

1. Menu → **Compute Engine** → **VM instances**
2. Click **Enable** if prompted (takes ~1 minute)

---

## Step 4 — Create the VM

Click **Create Instance** and use these settings:

| Setting | Value |
|---------|-------|
| **Name** | `ridge-server` |
| **Region** | `us-central1` (Iowa) — **must be a free-tier region** |
| **Zone** | Any in that region (e.g. `us-central1-a`) |
| **Machine type** | **E2** → `e2-micro` (0.25–2 vCPU, 1 GB memory) |
| **Boot disk** | **Change** → Ubuntu 24.04 LTS, **Standard persistent disk**, **30 GB** |
| **Firewall** | ✅ Allow HTTP traffic, ✅ Allow HTTPS traffic |
| **SSH Keys** | Leave default (Google manages login) |

Click **Create**. Wait until the VM shows a green checkmark.

Note the **External IP** (e.g. `34.123.45.67`).

---

## Step 5 — Open firewall (if HTTP doesn’t work)

Google’s “Allow HTTP/HTTPS” checkboxes usually suffice. If port 80 is blocked, create a rule:

1. **VPC network** → **Firewall** → **Create firewall rule**
2. Name: `allow-ridge-http`
3. Targets: **All instances in the network**
4. Source IPv4: `0.0.0.0/0`
5. Protocols: **tcp:80,443**
6. **Create**

---

## Step 6 — SSH into the VM

### Option A — Browser SSH (easiest)

1. **Compute Engine** → **VM instances**
2. Click **SSH** next to `ridge-server`
3. A terminal opens in your browser

### Option B — From your laptop

```bash
gcloud compute ssh ridge-server --zone=us-central1-a --project=ridge-deploy
```

(Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and run `gcloud auth login` first.)

---

## Step 7 — Deploy RIDGE

In the VM terminal:

```bash
git clone https://github.com/arvinalmeida192/RIDGE.git
cd RIDGE

# Required on e2-micro — adds 4 GB swap
sudo bash scripts/gcp-prepare-vm.sh

# Install Docker + start full stack
sudo bash scripts/deploy-vm.sh
```

First build takes **5–10 minutes** on e2-micro. When done you’ll see:

```
Dashboard: http://<EXTERNAL-IP>/
```

Open that URL in your browser.

### Demo login (no Firebase)

| Portal | URL | User | Password |
|--------|-----|------|----------|
| Operations | `http://<IP>/login` | `admin` | `admin` |
| Citizen | `http://<IP>/citizen/login` | `user` | `user` |

---

## Step 8 — Firebase (optional)

From your laptop, upload your Firebase key:

```bash
gcloud compute scp serviceAccountKey.json ridge-server:~/RIDGE/ \
  --zone=us-central1-a --project=ridge-deploy
```

On the VM, edit `~/RIDGE/.env`:

```bash
nano ~/RIDGE/.env
```

```env
FIREBASE_PROJECT_ID=ridge-4970a
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=ridge-4970a.firebaseapp.com
FIREBASE_BOOTSTRAP_ADMIN_EMAILS=arvinalmeida192@gmail.com
LEGACY_LOGIN_ENABLED=false
```

Restart:

```bash
cd ~/RIDGE
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate server
```

In **Firebase Console → Authentication → Authorized domains**, add your VM’s external IP or domain.

> Google Sign-In works best with a real domain + HTTPS. For IP-only testing, use email/password auth.

---

## Step 9 — HTTPS with a domain (optional)

1. Buy/use a domain and set an **A record** → your VM external IP
2. On the VM:

```bash
cd ~/RIDGE
sudo DOMAIN=ridge.yourdomain.com bash scripts/setup-https.sh
```

3. Add `ridge.yourdomain.com` to Firebase authorized domains

---

## Staying within free tier

| Do | Don’t |
|----|-------|
| Use **e2-micro** in **us-central1 / us-east1 / us-west1** | Don’t pick `e2-small` or other regions — they cost money |
| Use **30 GB standard** boot disk | Don’t add extra disks or static IPs you don’t need |
| Stop the VM when not demoing (saves egress) | Don’t run heavy load tests on free tier |

**Stop VM:** Compute Engine → select instance → **Stop**  
**Start again:** **Start** — external IP may change unless you reserve a static IP (static IPs outside use may incur cost).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build killed / OOM | Run `sudo bash scripts/gcp-prepare-vm.sh` again, `free -h` should show ~4G swap |
| `Connection refused` on :80 | Enable HTTP firewall on VM + check `sudo docker compose -f docker-compose.prod.yml ps` |
| ML service slow to start | Wait 5 min; `sudo docker compose -f docker-compose.prod.yml logs ml-service` |
| SSH “Permission denied” | Use browser SSH from Console |
| Bill surprise | Billing → Budgets → create alert at $1 |

---

## Useful commands

```bash
cd ~/RIDGE

# Logs
sudo docker compose -f docker-compose.prod.yml logs -f server

# Restart after .env change
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate server

# Update app
git pull origin main
sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

Back to [DEPLOYMENT.md](../DEPLOYMENT.md) · [README.md](../README.md)
