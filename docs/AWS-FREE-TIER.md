# AWS Free Tier — deploy RIDGE

Run RIDGE on a **$0 EC2 instance** for your first **12 months** (AWS Free Tier). Good alternative if Oracle or GCP signup is blocked.

## What you get (free tier, new accounts)

| Resource | Free allowance |
|----------|----------------|
| **EC2 t2.micro** (or t3.micro in some regions) | 750 hours/month for 12 months |
| **EBS storage** | 30 GB |
| **Data transfer** | 15 GB outbound/month |

**RAM warning:** t2.micro has **1 GB RAM**. Add **4 GB swap** before deploy (script included). First boot is slow (5–10 min) but works for demos.

---

## Step 1 — Create an AWS account

1. Go to [aws.amazon.com/free](https://aws.amazon.com/free/)
2. Click **Create a Free Account**
3. Complete signup (email, card for verification — free tier charges $0 if you stay within limits)
4. Sign in to the [AWS Console](https://console.aws.amazon.com/)

---

## Step 2 — Launch an EC2 instance

1. Search **EC2** → **Launch instance**

| Setting | Value |
|---------|-------|
| **Name** | `ridge-server` |
| **AMI** | **Ubuntu Server 24.04 LTS** (64-bit x86) |
| **Instance type** | **t2.micro** — Free tier eligible |
| **Key pair** | **Create new** → name `ridge-key` → download `.pem` file |
| **Network settings** | ✅ Allow SSH (22), ✅ Allow HTTP (80), ✅ Allow HTTPS (443) from `0.0.0.0/0` |
| **Storage** | **30 GiB** gp3 (free tier) |

2. Click **Launch instance**
3. Wait until **Instance state** = **Running**
4. Copy the **Public IPv4 address** (e.g. `3.110.xx.xx`)

---

## Step 3 — SSH into the instance

On your laptop:

```bash
chmod 400 ~/Downloads/ridge-key.pem
ssh -i ~/Downloads/ridge-key.pem ubuntu@<PUBLIC_IP>
```

> Ubuntu AMIs use user `ubuntu`. Amazon Linux uses `ec2-user` — stick with Ubuntu for this guide.

---

## Step 4 — Deploy RIDGE

On the EC2 instance:

```bash
git clone https://github.com/arvinalmeida192/RIDGE.git
cd RIDGE

# Required on t2.micro (1 GB RAM)
sudo bash scripts/aws-prepare-vm.sh

# Install Docker + start stack
sudo bash scripts/deploy-vm.sh
```

When finished:

```
Dashboard: http://<PUBLIC_IP>/
```

### Demo login (no Firebase)

| Portal | URL | User | Password |
|--------|-----|------|----------|
| Operations | `http://<IP>/login` | `admin` | `admin` |
| Citizen | `http://<IP>/citizen/login` | `user` | `user` |

---

## Step 5 — Security group (if port 80 is blocked)

1. EC2 → **Instances** → select `ridge-server` → **Security** tab → security group link
2. **Edit inbound rules** → **Add rule**:

| Type | Port | Source |
|------|------|--------|
| HTTP | 80 | `0.0.0.0/0` |
| HTTPS | 443 | `0.0.0.0/0` |
| SSH | 22 | **My IP** (recommended) |

3. **Save rules**

---

## Step 6 — Firebase (optional)

From your laptop:

```bash
scp -i ~/Downloads/ridge-key.pem serviceAccountKey.json ubuntu@<PUBLIC_IP>:~/RIDGE/
```

On the EC2 instance:

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

```bash
cd ~/RIDGE
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate server
```

Add your public IP or domain in **Firebase Console → Authentication → Authorized domains**.

---

## Step 7 — HTTPS with a domain (optional)

1. Point domain **A record** → EC2 public IP
2. On the instance:

```bash
cd ~/RIDGE
sudo DOMAIN=ridge.yourdomain.com bash scripts/setup-https.sh
```

---

## Stay within free tier

| Do | Don't |
|----|-------|
| Use **t2.micro** only | Don't launch `t2.small` or larger |
| **30 GB** disk | Don't add extra EBS volumes |
| **Stop** instance when not demoing | Don't leave unused Elastic IPs attached |
| Set a **billing alarm** at $1 | Don't ignore AWS billing emails |

**Stop instance:** EC2 → select → **Instance state → Stop**  
**Start again:** **Start** — public IP may change (use Elastic IP only if you understand free-tier limits).

### Billing alarm (recommended)

1. **Billing** → **Budgets** → **Create budget**
2. Cost budget → $1 → email alert

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| SSH timeout | Security group must allow port 22 from your IP |
| Build killed / OOM | `sudo bash scripts/aws-prepare-vm.sh` then redeploy |
| Port 80 refused | Add HTTP inbound rule on security group |
| ML slow / unhealthy | Wait 5 min; `sudo docker compose -f docker-compose.prod.yml logs ml-service` |
| Permission denied (.pem) | `chmod 400 ridge-key.pem` |

---

## Useful commands

```bash
cd ~/RIDGE

sudo docker compose -f docker-compose.prod.yml logs -f server
sudo docker compose -f docker-compose.prod.yml ps

git pull origin main
sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

Back to [DEPLOYMENT.md](../DEPLOYMENT.md) · [README.md](../README.md)
