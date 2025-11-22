# ShopOS Deployment Guide

## 🚀 GitHub Deployment Steps

### 1. Initial Setup (Already Done)
```bash
# Git has been initialized
# README.md has been created
# .gitignore is already configured
```

### 2. Configure Git (If  not done)
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 3. Add Files to Git
```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ShopOS v1.0.0 - Complete POS System"
```

### 4. Connect to GitHub Repository
```bash
# Add remote repository
git remote add origin https://github.com/deepmindfx/shopos.git

# Verify remote
git remote -v
```

### 5. Push to GitHub
```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## 📦 Additional Deployment Options

### Deploy to GitHub Pages

1. Update `vite.config.js` to add base path:
```javascript
export default defineConfig({
  base: '/shopos/',  // Add this line
  plugins: [...]
})
```

2. Install gh-pages:
```bash
npm install -D gh-pages
```

3. Add deploy script to `package.json`:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: gh-pages branch
   - Your app will be at: `https://deepmindfx.github.io/shopos/`

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts and your app will be live!

### Deploy to Netlify

1. Build the app:
```bash
npm run build
```

2. Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

OR use Netlify CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod
```

## 🔄 Updating the Repository

After making changes:

```bash
# Check status
git status

# Add changed files
git add .

# Commit with meaningful message
git commit -m "Description of changes"

# Push to GitHub
git push
```

## 📋 Pre-Deployment Checklist

- [x] README.md created with comprehensive documentation
- [x] .gitignore configured to exclude node_modules, dist, etc.
- [x] package.json updated with project metadata
- [x] Git repository initialized
- [ ] Test build: `npm run build`
- [ ] Test production preview: `npm run preview`
- [ ] All features working correctly
- [ ] PWA functionality verified

## 🎯 Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Git
git add .           # Stage all changes
git commit -m "msg" # Commit with message
git push            # Push to GitHub

# Deploy to GitHub Pages
npm run deploy      # (After adding deploy script)
```

## 🌐 Accessing Your Deployed App

After deployment:
- **GitHub Pages**: `https://deepmindfx.github.io/shopos/`
- **Vercel**: Custom URL provided after deployment
- **Netlify**: Custom URL provided after deployment

**Note**: Make sure to update the `base` path in `vite.config.js` if deploying to GitHub Pages!
