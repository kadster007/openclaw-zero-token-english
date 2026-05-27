# Installation Guide

## 📋 Prerequisites

### Required Software

1. **Node.js** (v22.12 or higher)

   ```bash
   node --version
   # Should show v22.12.x or higher
   ```

2. **npm** (usually installed with Node.js)

   ```bash
   npm --version
   # Should show 8.x.x or higher
   ```

3. **pnpm** (for building Web UI)

   ```bash
   pnpm --version
   # If not installed, run:
   # corepack enable
   # corepack prepare pnpm@latest --activate
   ```

4. **Google Chrome** (for debug browser)
   - macOS: Already installed
   - Linux: `sudo apt install google-chrome-stable`
   - Windows: Download and install

### Shell Environment Notes (Windows Users Must Read)

- `onboard.sh` / `server.sh` / `start-chrome-debug.sh` must be run in a **Bash environment**.
- Windows: **WSL** is recommended (preferred) or **Git Bash**.
- Plain `cmd.exe` / native PowerShell cannot execute `.sh` scripts directly.

### Optional Software

- **Git** (for cloning code)
  ```bash
  git --version
  ```

---

## 🚀 Installation Steps

### Step 1: Clone or Download Code

**Using Git**:

```bash
git clone <repository-url>
cd openclaw-zero-token
```

**Or download directly**:

- Download the ZIP file
- Extract to a directory
- Enter the directory

---

### Step 2: Install Dependencies

```bash
npm install
```

**Expected output**:

```
added 500+ packages in 30s
```

**If you encounter errors**:

```bash
# Clear cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Step 3: Compile Code

```bash
npm run build
pnpm ui:build   # Build Web UI, required when visiting http://127.0.0.1:3001
```

**Expected output**:

```
✔ Build complete in 7919ms
✓ built in 1.13s   # ui:build
```

**Verify compilation succeeded**:

```bash
ls dist/index.mjs
ls dist/control-ui/index.html   # Web UI resources
# Should see the file exists
```

---

### Step 4: Verify Installation

```bash
# Check compiled files
ls -lh dist/index.mjs

# Should see output similar to:
# -rw-r--r--  1 user  staff   2.5M Feb 27 10:00 dist/index.mjs
```

---

## 🔧 Configure Environment

### Create Configuration Directory

The configuration directory is created automatically on first run (recommended, no need to create manually):

```bash
./onboard.sh webauth
```

### Check Configuration Files

```bash
# View config file (if exists)
cat .openclaw-zero-state/openclaw.json

# View auth config (if exists)
cat .openclaw-zero-state/agents/main/agent/auth-profiles.json
```

> Key rule: Only the platforms configured in `./onboard.sh webauth` will be written into `openclaw.json` and appear in the final `/models` list.

---

## ✅ Installation Completion Checklist

- [ ] Node.js installed (v22.12+)
- [ ] npm installed
- [ ] pnpm installed
- [ ] Dependencies installed (`npm install`)
- [ ] Code compiled (`npm run build`)
- [ ] `dist/index.mjs` file exists
- [ ] Google Chrome installed

---

## 🎯 Next Steps

After installation, continue reading:

1. **START_HERE.md** - Quick Start Guide
2. **TEST_STEPS.md** - Detailed Test Steps

---

## 🔧 Frequently Asked Questions

### Q1: npm install fails

**A**: Try the following:

```bash
# Use domestic mirror (if in China)
npm config set registry https://registry.npmmirror.com

# Reinstall
npm install
```

### Q2: npm run build fails

**A**: Check Node.js version:

```bash
node --version
# Must be v22.12 or higher

# If version is too low, upgrade Node.js
```

### Q3: Permission errors

**A**: Do not use sudo:

```bash
# Wrong: sudo npm install
# Correct: npm install
```

### Q4: Insufficient disk space

**A**: Check disk space:

```bash
df -h

# node_modules requires approximately 500MB
# dist requires approximately 10MB
```

---

## 📚 Related Commands

```bash
# Install dependencies
npm install

# Build code
npm run build

# Clean build artifacts
rm -rf dist

# Rebuild
npm run build

# View npm scripts
npm run

# Check dependency versions
npm list --depth=0
```

---

## 🎉 Installation Complete!

Now you can start testing. Continue reading **START_HERE.md** to begin the testing process.
