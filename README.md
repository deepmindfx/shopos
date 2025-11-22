# ShopOS - Smart Point of Sale System

![ShopOS](public/icon-192.png)

A modern, professional Point of Sale (POS) system with advanced features including role-based access control, debtor management, offline PWA capabilities, and comprehensive sales analytics.

## ✨ Features

### 🎨 Premium UI/UX
- Modern glassmorphism design with Violet & Emerald theme
- Fully responsive (mobile-first design)
- Smooth animations and transitions
- AI-generated product images

### 🔐 Role-Based Access Control (RBAC)
- **Admin**: Sales and debtor management only
- **Super Admin** (PIN: `Aiypwzqp01POS$`): Full system access
- PIN-protected role switching

### 💰 Point of Sale
- Product grid with search functionality
- Quantity selector with +/- buttons
- Custom pricing option
- Payment method tracking (Cash/Bank Transfer)
- Cash and Credit sales support

### 💳 Enhanced Debtor Management
- Mobile number tracking for recovery
- **Overdue alerts** for debts >3 days
- Complete payment history
- Transaction tracking with product details

### 📊 Advanced Reports & Analytics
- Revenue, Profit, Debt tracking
- Interactive 7-day revenue trend chart
- Top products analysis
- Searchable transaction history
- **PDF exports** (Daily Sales, Product Reports)
- Time filters (Today, Week, Month, All Time)

### 📦 Inventory Management
- Real-time stock tracking
- Inline editing (Super Admin only)
- Low stock indicators
- Mobile-optimized card view

### 📱 Progressive Web App (PWA)
- ✅ **Works Offline** - All data in localStorage
- ✅ **Installable** - Add to home screen
- ✅ **Auto-updates** - Service worker caching
- ✅ **Fast Loading** - Cached assets

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/deepmindfx/shopos.git
cd shopos

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## 📖 Usage

### Default Credentials
- **Super Admin PIN**: `Aiypwzqp01POS$`

### Switching Roles
- **Desktop**: Use role switcher at bottom of sidebar
- **Mobile**: Tap role badge in top-right header
- Enter PIN when switching to Super Admin

### Offline Mode
1. Build the production version: `npm run build`
2. Serve the build: `npm run preview`
3. Open in browser and install the PWA
4. The app works completely offline!

## 🛠️ Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **jsPDF** - PDF generation
- **Recharts** - Data visualization
- **vite-plugin-pwa** - PWA support

## 📁 Project Structure

```
shopos/
├── public/
│   ├── products/           # AI-generated product images
│   ├── icon-192.png        # PWA icon
│   └── icon-512.png        # PWA icon
├── src/
│   ├── App.jsx             # Main application
│   ├── index.css           # Custom styles
│   └── main.jsx            # Entry point
├── vite.config.js          # Vite + PWA configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## 🎯 Key Features Explained

### Payment Method Tracking
Every sale (cash/credit) now tracks the payment method:
- 💵 **Cash**: Physical currency
- 🏦 **Bank Transfer**: Electronic payment

View payment methods in the Reports tab transaction history.

### Debtor Overdue System
- Automatically calculates days since first debt
- Visual alerts (⚠) for debts >3 days
- Orange highlight in debtor list
- Helps prioritize recovery efforts

### Quantity Selector
- Intuitive +/- buttons instead of number input
- **Minus (−)**: Decrease quantity (min: 1)
- **Plus (+)**: Increase quantity (max: available stock)

## 📊 Data Persistence

All data is stored in browser localStorage:
- `pos_products` - Product inventory
- `pos_sales` - Sales transactions
- `pos_debtors` - Debtor records
- `pos_customers` - Customer list

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**DeepMind FX**
- GitHub: [@deepmindfx](https://github.com/deepmindfx)

## 🙏 Acknowledgments

- Built with modern web technologies
- AI-generated product images
- Inspired by real-world POS requirements

---

**Note**: This is a client-side application with localStorage persistence. For production use with multiple devices, consider adding a backend API for data synchronization.
