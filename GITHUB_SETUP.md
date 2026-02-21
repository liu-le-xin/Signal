# Uploading to GitHub - Step by Step Guide

## Option 1: Using GitHub CLI (Recommended)

### Prerequisites
- Install GitHub CLI: `brew install gh` (on macOS)
- Authenticate: `gh auth login`

### Steps
```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Signal dashboard with Workers AI"

# 4. Create repository on GitHub and push
gh repo create my-first-worker --public --source=. --remote=origin --push
```

## Option 2: Using GitHub Website

### Step 1: Create Repository on GitHub
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Repository name: `my-first-worker` (or your preferred name)
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Initialize Git and Push
Run these commands in your terminal:

```bash
# Navigate to your project directory
cd /Users/Atorvastatin/my-first-worker

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Signal dashboard with Workers AI"

# Add GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/my-first-worker.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Option 3: Using GitHub Desktop

1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Sign in with your GitHub account
3. Click **File** → **Add Local Repository**
4. Browse to `/Users/Atorvastatin/my-first-worker`
5. Click **Publish repository** button
6. Choose repository name and visibility
7. Click **Publish Repository**

## Important Notes

### Before Pushing:
- Make sure your `.gitignore` file is set up (already done ✅)
- **DO NOT** commit sensitive files like:
  - `.env` files with secrets
  - `node_modules/` (already in .gitignore)
  - `.wrangler/` directory (already in .gitignore)
  - Database IDs or API keys

### Files That Will Be Uploaded:
- ✅ Source code (`src/`)
- ✅ Configuration files (`package.json`, `wrangler.jsonc`, etc.)
- ✅ Documentation (`README.md`, `D1_SETUP.md`, etc.)
- ✅ Scripts (`scripts/`)
- ✅ Schema files (`schema.sql`)

### Files That Will NOT Be Uploaded (in .gitignore):
- ❌ `node_modules/`
- ❌ `.wrangler/` (local development files)
- ❌ `.env` files
- ❌ `dist/` (build output)

## After Uploading

### Update README
Consider adding:
- Setup instructions
- Environment variables needed
- How to configure D1 database
- Deployment instructions

### Next Steps
1. Add a license file (if needed)
2. Set up GitHub Actions for CI/CD (optional)
3. Add collaborators (if working in a team)
4. Create issues and project boards for tracking

## Troubleshooting

### Authentication Issues
If you get authentication errors:
```bash
# Use GitHub Personal Access Token instead of password
# Or set up SSH keys:
ssh-keygen -t ed25519 -C "your_email@example.com"
# Then add the public key to GitHub Settings → SSH Keys
```

### Large Files
If you have large files:
```bash
# Check repository size
du -sh .

# If node_modules is accidentally included:
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"
```

