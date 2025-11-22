# Netlify Deployment Guide for ShopOS

## 🚀 Quick Deploy to Netlify

### Method 1: Drag & Drop (Fastest)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag and drop the `dist` folder
   - Done! Your app is live instantly

### Method 2: Connect GitHub Repository (Recommended)

1. **Go to Netlify**:
   - Visit [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub**:
   - Choose "GitHub"
   - Select your repository: `deepmindfx/shopos`

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - (These are already configured in `netlify.toml`)

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy
   - You'll get a URL like: `https://shopos-abc123.netlify.app`

### Method 3: Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**:
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Follow the prompts

4. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## 📋 Configuration Files Included

### `netlify.toml`
- Build command and publish directory
- **SPA redirect rules** (all routes → index.html)
- Security headers
- Cache control for assets
- Service worker configuration

### `public/_redirects`
- Fallback redirect for SPA routing
- Ensures all routes work correctly

## 🔧 Netlify Features Configured

✅ **Single Page Application (SPA) Routing**
- All routes redirect to index.html with 200 status
- Client-side routing works perfectly

✅ **Security Headers**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

✅ **Performance Optimization**
- Static assets cached for 1 year
- Service worker properly configured
- Immutable cache for versioned assets

✅ **PWA Support**
- Manifest properly served
- Service worker cache control

## 🌐 Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to site settings on Netlify
2. Click "Set up a custom domain"
3. Add your domain
4. Configure DNS settings as instructed

## 🔄 Auto-Deploy

Once connected to GitHub:
- Every push to `main` branch auto-deploys
- Pull requests get preview deployments
- Rollback to any previous deploy anytime

## 🎯 Environment Variables (If Needed)

If you add environment variables later:

1. Go to Site settings → Build & deploy → Environment
2. Add variables
3. They'll be available as `import.meta.env.VITE_*`

## ✅ Deployment Checklist

- [x] `netlify.toml` created
- [x] `public/_redirects` created
- [x] Build tested locally (`npm run build`)
- [x] Production preview tested (`npm run preview`)
- [ ] Netlify account created
- [ ] Site deployed
- [ ] Custom domain configured (optional)

## 🚨 Troubleshooting

### Routes not working (404 errors)
- ✅ Already fixed with redirect rules in `netlify.toml` and `_redirects`

### Service Worker issues
- Clear browser cache
- Hard reload (Ctrl+Shift+R)
- Check service worker registration in DevTools

### Build fails
- Check Node version (should be 16+)
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check build logs on Netlify dashboard

## 📱 Testing After Deployment

1. **Test all features**:
   - POS operations
   - Role switching (with PIN)
   - Debtor management
   - Reports and PDF exports
   - Offline mode (PWA)

2. **Test on different devices**:
   - Desktop
   - Mobile
   - Tablet

3. **Test PWA install**:
   - Desktop: Install prompt in browser
   - Mobile: "Add to Home Screen"

## 🎉 Your App is Live!

After deployment, share your URL:
- **Netlify URL**: `https://your-site-name.netlify.app`
- **Custom Domain**: `https://yourdomain.com` (if configured)

---

**Need help?** Check [Netlify Documentation](https://docs.netlify.com/)
