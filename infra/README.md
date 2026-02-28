# Infrastructure — TinkerWithTech Blog

Static Next.js site deployed to Google Cloud Storage on every push to `main`.

```
GitHub repo (main)
      │
      │  push
      ▼
GitHub Actions (.github/workflows/deploy.yml)
      │
      │  npm run build  →  out/
      │
      │  google-github-actions/auth (Workload Identity — keyless)
      │
      │  google-github-actions/upload-cloud-storage
      ▼
GCS Bucket (blog.tinkerwithtech.io)
      │
      │  static website hosting
      ▼
https://blog.tinkerwithtech.io
```

---

## GCP project

| Field | Value |
|-------|-------|
| Project | `tinkerwithtech-214914` |
| Project number | `49439141503` |
| Bucket | `blog.tinkerwithtech.io` |
| Region | `US` (multi-region) |

---

## One-time GCP setup

Run these once to configure the project. Already applied — documented here for
disaster recovery.

### 1. Enable required APIs

```bash
gcloud config set project tinkerwithtech-214914

gcloud services enable \
  storage.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

### 2. Create the GCS bucket

```bash
export BUCKET=blog.tinkerwithtech.io
export PROJECT=tinkerwithtech-214914

gcloud storage buckets create gs://$BUCKET \
  --location=US \
  --uniform-bucket-level-access

# Public read for website serving
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member=allUsers \
  --role=roles/storage.objectViewer

# Static website config
gcloud storage buckets update gs://$BUCKET \
  --web-main-page-suffix=index.html \
  --web-error-page=404/index.html
```

### 3. Bucket hardening

```bash
# Uniform bucket-level access (prevents per-object ACL overrides)
gcloud storage buckets update gs://$BUCKET --uniform-bucket-level-access

# CORS — only allow requests from the blog domain
cat > /tmp/cors.json << 'EOF'
[{
  "origin": ["https://blog.tinkerwithtech.io"],
  "method": ["GET", "HEAD"],
  "responseHeader": ["Content-Type", "Cache-Control", "ETag"],
  "maxAgeSeconds": 3600
}]
EOF
gcloud storage buckets update gs://$BUCKET --cors-file=/tmp/cors.json

# Lifecycle — delete noncurrent object versions after 30 days
cat > /tmp/lifecycle.json << 'EOF'
{"rule":[{"action":{"type":"Delete"},"condition":{"daysSinceNoncurrentTime":30}}]}
EOF
gcloud storage buckets update gs://$BUCKET --lifecycle-file=/tmp/lifecycle.json
```

### 4. Deploy service account

```bash
# Create
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Actions deploy" \
  --project=$PROJECT

# Grant bucket-level write (NOT project-level — least privilege)
gcloud storage buckets add-iam-policy-binding gs://$BUCKET \
  --member="serviceAccount:github-deploy@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectUser"
```

### 5. Workload Identity Federation (keyless GitHub auth)

No JSON key files. GitHub Actions authenticates via OIDC token exchange.

```bash
# Create pool
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions pool" \
  --project=$PROJECT

# Create OIDC provider scoped to this repo only
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='chruzie/tinkerwithtech-blog'" \
  --project=$PROJECT

# Allow GitHub Actions to impersonate the deploy SA
export POOL_ID=$(gcloud iam workload-identity-pools describe github-pool \
  --location=global --project=$PROJECT --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding \
  github-deploy@$PROJECT.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/chruzie/tinkerwithtech-blog"
```

### 6. DNS

Point your domain at GCS:

```
CNAME  blog.tinkerwithtech.io  →  c.storage.googleapis.com
```

For HTTPS on a custom domain, add a GCP Load Balancer or proxy through Cloudflare.

---

## GitHub secrets and variables

Go to: `github.com/chruzie/tinkerwithtech-blog → Settings → Secrets and variables → Actions`

| Type | Name | Value |
|------|------|-------|
| Secret | `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/49439141503/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| Secret | `GCP_SERVICE_ACCOUNT` | `github-deploy@tinkerwithtech-214914.iam.gserviceaccount.com` |
| Variable | `GCS_BUCKET_NAME` | `blog.tinkerwithtech.io` |

---

## Cache strategy

The deploy workflow uploads in three passes with different cache headers:

| Files | Cache-Control | Reason |
|-------|--------------|--------|
| `**/*.html` | `no-cache, must-revalidate` | New deploys reflected immediately |
| `_next/static/**` | `public, max-age=31536000, immutable` | Content-hashed by Next.js — safe to cache forever |
| Everything else | `public, max-age=3600` | Fonts, images, favicon — 1 hour TTL |

---

## Security posture

| Control | Status | Notes |
|---------|--------|-------|
| Uniform bucket-level access | ✅ Enabled | No per-object ACL overrides possible |
| CORS | ✅ Configured | `GET/HEAD` from `blog.tinkerwithtech.io` only |
| Lifecycle | ✅ Configured | Noncurrent objects deleted after 30 days |
| Service account scope | ✅ Bucket-level | `objectUser` on this bucket only — not project-wide |
| Auth method | ✅ Keyless OIDC | No JSON keys — Workload Identity Federation |
| Repo scope | ✅ Restricted | Provider `attribute-condition` locks to `chruzie/tinkerwithtech-blog` |
| Public access | ✅ Read-only | `allUsers: objectViewer` — read only, no write |
