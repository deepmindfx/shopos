import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ShoppingCart, User, Users, DollarSign, CreditCard, X, Plus, Minus, Check,
  Wallet, History, Package, Settings, Save, TrendingUp, TrendingDown,
  ClipboardCheck, Upload, LineChart as IconLineChart, Warehouse, Search, AlertTriangle,
  ChevronRight, ChevronLeft, Trash2, Filter, BarChart3, PieChart, Menu, MoreVertical, Printer, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Local Storage Hooks and Utilities ---

const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  DEBTORS: 'pos_debtors',
  CUSTOMERS: 'pos_customers',
  SALES: 'pos_sales',
};

const initialProductsData = [
  { id: 'p1', name: 'Indomie Noodles', sellPrice: 500, buyPrice: 400, stock: 200, image: '/products/indomie.png' },
  { id: 'p2', name: 'Taliya Spaghetti', sellPrice: 1300, buyPrice: 1100, stock: 50, image: '/products/spaghetti.png' },
  { id: 'p3', name: 'Sugar (Kg)', sellPrice: 1500, buyPrice: 1250, stock: 75, image: '/products/sugar.png' },
  { id: 'p4', name: 'Cooking Oil (L)', sellPrice: 4000, buyPrice: 3500, stock: 30, image: '/products/oil.png' },
  { id: 'p5', name: 'Chips', sellPrice: 1000, buyPrice: 700, stock: 50, image: '/products/chips.png' },
  { id: 'p6', name: 'Yam', sellPrice: 300, buyPrice: 200, stock: 50, image: '/products/yam.png' },
  { id: 'p7', name: 'Egg', sellPrice: 300, buyPrice: 200, stock: 200, image: '/products/egg.png' },
  { id: 'p8', name: 'Maggi Cubes', sellPrice: 50, buyPrice: 30, stock: 500, image: '/products/maggi.png' },
];

const initialCustomers = ["Regular A", "Mama Uche", "Mr. Tunde"];

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setStoredValue];
};

const formatCurrency = (amount) => {
  return `₦${new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount)}`;
};

// --- Components ---

const ModalWrapper = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="overflow-y-auto p-5 no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-indigo-600' };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-4 md:left-auto md:right-4 md:translate-x-0 ${bgColors[type] || bgColors.info} text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 z-[60] animate-fade-in`}>
      {type === 'success' && <Check className="w-5 h-5" />}
      {type === 'error' && <AlertTriangle className="w-5 h-5" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [products, setProducts] = useLocalStorage(STORAGE_KEYS.PRODUCTS, initialProductsData);
  const [debtors, setDebtors] = useLocalStorage(STORAGE_KEYS.DEBTORS, []);
  const [customers, setCustomers] = useLocalStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  const [sales, setSales] = useLocalStorage(STORAGE_KEYS.SALES, []);

  // Force update images for existing products if they are missing
  useEffect(() => {
    setProducts(prevProducts => {
      let hasChanges = false;
      const updatedProducts = prevProducts.map(p => {
        const initial = initialProductsData.find(ip => ip.id === p.id);
        if (initial && initial.image && p.image !== initial.image) {
          hasChanges = true;
          return { ...p, image: initial.image };
        }
        return p;
      });
      return hasChanges ? updatedProducts : prevProducts;
    });
  }, []); // Run once on mount

  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('pos');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userRole, setUserRole] = useState('super_admin'); // 'admin' | 'super_admin'
  const [modalQuantity, setModalQuantity] = useState(1); // For quantity selector
  const [paymentMethod, setPaymentMethod] = useState('cash'); // For payment method selection

  const grandTotal = useMemo(() => cart.reduce((total, item) => total + item.sellPrice * item.quantity, 0), [cart]);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // --- Handlers ---
  const addCustomerIfNew = (customerName) => {
    const normalizedName = customerName.trim();
    const existing = customers.find(c => c.toLowerCase() === normalizedName.toLowerCase());
    if (!existing) {
      setCustomers(prev => [...prev, normalizedName]);
      return normalizedName;
    }
    return existing;
  };

  const handleAddProduct = (newProduct) => {
    setProducts(prev => [...prev, {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      sellPrice: parseInt(newProduct.sellPrice, 10),
      buyPrice: parseInt(newProduct.buyPrice, 10),
      stock: parseInt(newProduct.stock, 10),
      image: null // No image for manually added products yet
    }]);
    showToast(`${newProduct.name} added.`);
    setModal(null);
  };

  const handleImportCustomers = (namesArray) => {
    const uniqueNewNames = namesArray.map(n => n.trim()).filter(n => n.length > 0 && !customers.some(c => c.toLowerCase() === n.toLowerCase()));
    if (uniqueNewNames.length > 0) {
      setCustomers(prev => [...prev, ...uniqueNewNames]);
      showToast(`${uniqueNewNames.length} imported.`);
    } else showToast('No new customers.', 'info');
    setModal(null);
  };

  const confirmAddToCart = (product, quantity, customPrice) => {
    const finalPrice = customPrice !== null ? customPrice : product.sellPrice;
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id && item.sellPrice === finalPrice);
      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        if (existingItem.quantity + quantity <= product.stock) {
          updatedCart[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + quantity };
        } else showToast('Not enough stock!', 'error');
        return updatedCart;
      }
      if (quantity <= product.stock) {
        return [...prevCart, { ...product, cartId: `c-${Date.now()}-${Math.random()}`, sellPrice: finalPrice, quantity }];
      } else {
        showToast('Not enough stock!', 'error');
        return prevCart;
      }
    });
    setModal(null);
    setIsCartOpen(true);
  };

  const updateCartQuantity = (cartId, change) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.cartId === cartId);
      if (!item) return prevCart;
      const product = products.find(p => p.id === item.id);
      const newQty = item.quantity + change;
      if (newQty <= 0) return prevCart.filter(i => i.cartId !== cartId);
      if (newQty > product.stock) { showToast('Max stock reached!', 'error'); return prevCart; }
      return prevCart.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i);
    });
  };

  const finalizeSale = (customerName, transactionType, paymentMethod = 'cash') => {
    if (grandTotal === 0) return;
    const finalCustomerName = addCustomerIfNew(customerName);
    const totalRevenue = grandTotal;
    const totalCost = cart.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const profit = totalRevenue - totalCost;

    const saleRecord = {
      id: `s-${Date.now()}`,
      type: transactionType,
      paymentMethod, // 'cash' or 'bank_transfer'
      customerName: finalCustomerName,
      date: new Date().toISOString(),
      totalRevenue, totalCost, profit,
      cart: cart.map(({ name, quantity, sellPrice, buyPrice }) => ({ name, quantity, price: sellPrice, cost: buyPrice }))
    };

    setSales(prev => [saleRecord, ...prev]);
    if (transactionType === 'credit') {
      setDebtors(prev => {
        const existing = prev.find(d => d.name.toLowerCase() === finalCustomerName.toLowerCase());
        if (existing) return prev.map(d => d.id === existing.id ? { ...d, balance: d.balance + totalRevenue, history: [{ ...saleRecord, cart: saleRecord.cart }, ...d.history] } : d);
        // New debtor - will prompt for mobile later
        return [...prev, { id: `debtor-${Date.now()}`, name: finalCustomerName, balance: totalRevenue, mobile: '', history: [{ ...saleRecord, cart: saleRecord.cart }] }];
      });
      showToast(`Credit sale recorded.`, 'success');
    } else showToast(`Cash sale successful!`, 'success');

    setProducts(prev => prev.map(p => {
      const soldQty = cart.filter(c => c.id === p.id).reduce((sum, c) => sum + c.quantity, 0);
      return soldQty > 0 ? { ...p, stock: p.stock - soldQty } : p;
    }));
    setCart([]);
    setModal(null);
    setIsCartOpen(false);
  };

  const handlePayment = (debtorId, amount) => {
    setDebtors(prev => prev.map(d => {
      if (d.id === debtorId) {
        const newBalance = Math.max(0, d.balance - amount);
        return { ...d, balance: newBalance, history: [{ id: `p-${Date.now()}`, type: 'payment', amount, date: new Date().toISOString() }, ...d.history] };
      }
      return d;
    }));
    const debtor = debtors.find(d => d.id === debtorId);
    if (debtor) setSelectedDebtor(prev => ({ ...prev, balance: Math.max(0, debtor.balance - amount) }));
    showToast('Payment recorded!', 'success');
    setModal(null);
  };

  // --- Reporting Functions ---

  const generateDailyReportPDF = (filteredSales, stats) => {
    const doc = new jsPDF();
    const now = new Date();

    doc.setFontSize(20);
    doc.text("Daily Sales Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 28);

    // Summary
    doc.setFillColor(240, 253, 244); // Emerald-50
    doc.rect(14, 35, 180, 25, 'F');
    doc.setFontSize(12);
    doc.text(`Total Revenue: ${formatCurrency(stats.revenue)}`, 20, 45);
    doc.text(`Net Profit: ${formatCurrency(stats.profit)}`, 20, 55);
    doc.text(`Total Sales: ${stats.count}`, 100, 45);

    // Sales Table
    const tableData = filteredSales.map(s => [
      new Date(s.date).toLocaleTimeString(),
      s.customerName,
      s.type.toUpperCase(),
      formatCurrency(s.totalRevenue)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Time', 'Customer', 'Type', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
    });

    doc.save(`daily_report_${now.toISOString().split('T')[0]}.pdf`);
    showToast('Daily report generated!', 'success');
  };

  const generateProductReportPDF = (productName, productStats) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Product Report: ${productName}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Total Sold: ${productStats.qty}`, 14, 32);
    doc.text(`Total Revenue: ${formatCurrency(productStats.rev)}`, 14, 40);

    doc.save(`product_report_${productName.replace(/\s+/g, '_')}.pdf`);
    showToast('Product report generated!', 'success');
  };

  // --- UI Components ---

  const Sidebar = () => (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen sticky top-0 shadow-2xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black flex items-center tracking-tight text-emerald-400">
          <ShoppingCart className="w-8 h-8 mr-3" /> ShopOS
        </h1>
        <p className="text-xs text-slate-400 mt-1 ml-11">Smart POS System</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {[
          { id: 'pos', icon: DollarSign, label: 'Point of Sale' },
          { id: 'debtors', icon: Users, label: 'Debtors' },
          { id: 'reports', icon: BarChart3, label: 'Reports', superAdminOnly: true },
          { id: 'inventory', icon: Warehouse, label: 'Inventory' },
        ].filter(item => !item.superAdminOnly || userRole === 'super_admin').map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSelectedDebtor(null); }}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 font-medium ${activeTab === item.id
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 translate-x-1'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
            {item.id === 'debtors' && debtors.some(d => d.balance > 0) && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {debtors.filter(d => d.balance > 0).length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Role Switcher */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-1 flex">
          <button
            onClick={() => setUserRole('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${userRole === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Admin
          </button>
          <button
            onClick={() => {
              const pin = prompt('Enter Super Admin PIN:');
              if (pin === 'Aiypwzqp01POS$') {
                setUserRole('super_admin');
                showToast('Super Admin access granted', 'success');
              } else if (pin) {
                showToast('Incorrect PIN', 'error');
              }
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${userRole === 'super_admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            Super
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">Current: {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
      </div>
    </div>
  );

  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around p-2 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe">
      {[
        { id: 'pos', icon: DollarSign, label: 'POS' },
        { id: 'debtors', icon: Users, label: 'Debtors' },
        { id: 'reports', icon: BarChart3, label: 'Stats', superAdminOnly: true },
        { id: 'inventory', icon: Warehouse, label: 'Stock' },
      ].filter(item => !item.superAdminOnly || userRole === 'super_admin').map(item => (
        <button
          key={item.id}
          onClick={() => { setActiveTab(item.id); setSelectedDebtor(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all active:scale-95 ${activeTab === item.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'
            }`}
        >
          <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );

  const CartDrawer = () => (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-fade-in"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl" onClick={() => setIsCartOpen(false)}>
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-emerald-600" /> Current Order
          </h2>
          <button className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">{formatCurrency(item.sellPrice)}</p>
                </div>
                <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm">
                  <button onClick={() => updateCartQuantity(item.cartId, -1)} className="p-1"><Minus className="w-4 h-4" /></button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.cartId, 1)} className="p-1"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white pb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-2xl font-black text-gray-900">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={cart.length === 0} onClick={() => setModal({ type: 'customer_select', data: { type: 'cash' } })} className="py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20">Cash</button>
            <button disabled={cart.length === 0} onClick={() => setModal({ type: 'customer_select', data: { type: 'credit' } })} className="py-3 rounded-xl bg-white text-red-600 border-2 border-red-100 font-bold">Credit</button>
          </div>
        </div>
      </div>
    </>
  );

  const POSTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="flex flex-col lg:flex-row h-full gap-6 p-4 lg:p-6 w-full pb-24 md:pb-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button onClick={() => setModal({ type: 'import_customers' })} className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm hover:shadow-md flex-1 sm:flex-none justify-center flex">
                <Upload className="w-5 h-5" />
              </button>
              <button onClick={() => setModal({ type: 'add_product' })} className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 flex items-center font-bold flex-1 sm:flex-none justify-center">
                <Plus className="w-5 h-5 mr-2" /> Add Item
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-20 lg:pb-0 no-scrollbar">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => setModal({ type: 'add_to_cart', data: p })}
                className="glass p-3 rounded-2xl hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between active:scale-95 duration-200 relative overflow-hidden"
              >
                {/* Product Image/Icon Background */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-emerald-200"></div>}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-md ${p.stock < 10 ? 'bg-red-100/80 text-red-600' : 'bg-emerald-100/80 text-emerald-600'}`}>
                      {p.stock} left
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center py-2">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-20 h-20 object-contain drop-shadow-lg mb-2 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Package className="w-12 h-12 text-emerald-200 mb-2" />
                    )}
                    <h3 className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2 text-sm sm:text-base text-center leading-tight">{p.name}</h3>
                  </div>

                  <div className="mt-2 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Price</p>
                      <p className="text-base sm:text-lg font-black text-gray-900">{formatCurrency(p.sellPrice)}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex w-96 bg-white rounded-3xl shadow-xl flex-col h-auto sticky top-4 border border-gray-100 max-h-[calc(100vh-4rem)]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-emerald-600" /> Current Order
            </h2>
            <p className="text-sm text-gray-500 mt-1">{cart.length} items</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-60">
                <ShoppingCart className="w-16 h-16" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">{formatCurrency(item.sellPrice)}</p>
                  </div>
                  <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm">
                    <button onClick={() => updateCartQuantity(item.cartId, -1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-600"><Minus className="w-4 h-4" /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.cartId, 1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-600"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="text-right ml-3 w-16">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.sellPrice * item.quantity)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-gray-50 rounded-b-3xl border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-3xl font-black text-gray-900">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={cart.length === 0} onClick={() => setModal({ type: 'customer_select', data: { type: 'cash' } })} className="py-4 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all flex justify-center items-center">
                <DollarSign className="w-5 h-5 mr-2" /> Cash
              </button>
              <button disabled={cart.length === 0} onClick={() => setModal({ type: 'customer_select', data: { type: 'credit' } })} className="py-4 rounded-xl bg-white text-red-600 border-2 border-red-100 font-bold hover:bg-red-50 disabled:opacity-50 transition-all flex justify-center items-center">
                <CreditCard className="w-5 h-5 mr-2" /> Credit
              </button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-20 right-4 md:hidden z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-emerald-600 text-white p-4 rounded-full shadow-2xl shadow-emerald-600/40 flex items-center justify-center relative active:scale-90 transition-transform"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        <CartDrawer />
      </div>
    );
  };

  const InventoryTab = () => {
    const handleUpdate = (id, field, value) => {
      if (userRole !== 'super_admin') return; // Restrict editing to super admin
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) return;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: numValue } : p));
    };

    return (
      <div className="p-4 lg:p-6 w-full pb-24 md:pb-0">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <Warehouse className="w-6 h-6 mr-3 text-indigo-600" /> Inventory
            </h2>
            {userRole === 'super_admin' && (
              <button onClick={() => setModal({ type: 'add_product' })} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base shadow-lg shadow-indigo-600/20">
                + New
              </button>
            )}
          </div>

          <div className="md:hidden p-4 space-y-4">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  {p.stock < 10 ? <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Low Stock</span> : <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">OK</span>}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Stock</p>
                    <input type="number" value={p.stock} onChange={(e) => handleUpdate(p.id, 'stock', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-full bg-gray-50 rounded-lg p-2 font-bold text-center mt-1 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Sell</p>
                    <input type="number" value={p.sellPrice} onChange={(e) => handleUpdate(p.id, 'sellPrice', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-full bg-gray-50 rounded-lg p-2 font-bold text-center mt-1 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Buy</p>
                    <input type="number" value={p.buyPrice} onChange={(e) => handleUpdate(p.id, 'buyPrice', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-full bg-gray-50 rounded-lg p-2 font-bold text-center mt-1 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Sell Price</th>
                  <th className="px-6 py-4">Buy Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4"><input type="number" value={p.stock} onChange={(e) => handleUpdate(p.id, 'stock', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-20 bg-gray-100 border-none rounded-lg px-3 py-1 text-center focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} /></td>
                    <td className="px-6 py-4"><input type="number" value={p.sellPrice} onChange={(e) => handleUpdate(p.id, 'sellPrice', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-24 bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} /></td>
                    <td className="px-6 py-4"><input type="number" value={p.buyPrice} onChange={(e) => handleUpdate(p.id, 'buyPrice', e.target.value)} disabled={userRole !== 'super_admin'} className={`w-24 bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 ${userRole !== 'super_admin' ? 'opacity-60 cursor-not-allowed' : ''}`} /></td>
                    <td className="px-6 py-4">{p.stock < 10 ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Low Stock</span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div >
    );
  };

  const ReportsTab = () => {
    const [filter, setFilter] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSales = useMemo(() => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let timeFiltered = sales;
      if (filter === 'today') timeFiltered = sales.filter(s => new Date(s.date) >= today);
      else if (filter === 'week') timeFiltered = sales.filter(s => new Date(s.date) >= weekStart);
      else if (filter === 'month') timeFiltered = sales.filter(s => new Date(s.date) >= monthStart);

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        timeFiltered = timeFiltered.filter(s => s.customerName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.cart.some(i => i.name.toLowerCase().includes(q)));
      }
      return timeFiltered;
    }, [sales, filter, searchQuery]);

    const stats = useMemo(() => {
      const revenue = filteredSales.reduce((sum, s) => sum + s.totalRevenue, 0);
      const cost = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
      const profit = revenue - cost;
      const debt = debtors.reduce((sum, d) => sum + d.balance, 0);

      const productStats = {};
      filteredSales.forEach(s => {
        s.cart.forEach(i => {
          if (!productStats[i.name]) productStats[i.name] = { name: i.name, qty: 0, rev: 0 };
          productStats[i.name].qty += i.quantity;
          productStats[i.name].rev += i.price * i.quantity;
        });
      });
      const topProducts = Object.values(productStats).sort((a, b) => b.rev - a.rev).slice(0, 5);
      return { revenue, profit, debt, count: filteredSales.length, topProducts, productStats };
    }, [filteredSales, debtors]);

    // Prepare Chart Data (Last 7 Days)
    const chartData = useMemo(() => {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const daySales = sales.filter(s => s.date.startsWith(dateStr));
        const rev = daySales.reduce((sum, s) => sum + s.totalRevenue, 0);
        data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: rev });
      }
      return data;
    }, [sales]);

    return (
      <div className="p-4 lg:p-6 w-full space-y-6 pb-24 md:pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => generateDailyReportPDF(filteredSales, stats)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center hover:bg-slate-900"><Printer className="w-4 h-4 mr-2" /> Daily Report</button>
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto overflow-x-auto">
              {['today', 'week', 'month', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Revenue', value: stats.revenue, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: DollarSign },
            { label: 'Profit', value: stats.profit, color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp },
            { label: 'Debt', value: stats.debt, color: 'text-red-600', bg: 'bg-red-50', icon: Wallet },
            { label: 'Sales', value: stats.count, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: ClipboardCheck, isCount: true },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-lg sm:text-2xl font-black ${stat.color}`}>{stat.isCount ? stat.value : formatCurrency(stat.value)}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} /></div>
            </div>
          ))}
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center"><IconLineChart className="w-5 h-5 mr-2 text-indigo-500" /> Revenue Trend (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `₦${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><PieChart className="w-5 h-5 mr-2 text-indigo-500" /> Top Products</h3>
            <div className="space-y-4">
              {stats.topProducts.length > 0 ? stats.topProducts.map((p, i) => (
                <div key={i} className="relative group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{formatCurrency(p.rev)}</span>
                      <button onClick={() => generateProductReportPDF(p.name, p)} className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Print Product Report"><FileText className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(p.rev / stats.revenue) * 100}%` }}></div></div>
                  <p className="text-xs text-gray-400 mt-1">{p.qty} sold</p>
                </div>
              )) : <p className="text-gray-400 italic text-center py-10">No data available</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="font-bold text-gray-800 flex items-center"><History className="w-5 h-5 mr-2 text-indigo-500" /> Transactions</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Find sale..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Method</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.customerName}</td>
                      <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{sale.type.toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-xs">
                        {sale.paymentMethod === 'bank_transfer' ? (
                          <span className="text-indigo-600 font-medium">🏦 Transfer</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">💵 Cash</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(sale.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && <p className="text-center text-gray-400 py-10">No transactions found.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DebtorsTab = () => {
    const [paymentAmount, setPaymentAmount] = useState('');

    return (
      <div className="flex flex-col lg:flex-row h-full gap-6 p-4 lg:p-6 w-full pb-24 md:pb-0">
        <div className="lg:w-1/3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-gray-100 bg-red-50/50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center"><Users className="w-5 h-5 mr-2 text-red-600" /> Debtors</h2>
            <p className="text-red-600 font-bold mt-2 text-2xl">{formatCurrency(debtors.reduce((sum, d) => sum + d.balance, 0))}<span className="text-sm text-red-400 font-normal ml-2">owed</span></p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {debtors.filter(d => d.balance > 0).sort((a, b) => b.balance - a.balance).map(d => {
              // Calculate overdue status (>3 days)
              const oldestDebt = d.history.filter(h => h.type === 'debt').sort((a, b) => new Date(a.date) - new Date(b.date))[0];
              const daysSinceFirst = oldestDebt ? Math.floor((Date.now() - new Date(oldestDebt.date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const isOverdue = daysSinceFirst > 3;

              return (
                <div key={d.id} onClick={() => setSelectedDebtor(d)} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedDebtor?.id === d.id ? 'bg-red-50 border-red-200 shadow-sm' : isOverdue ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">{d.name}</h4>
                    <span className="font-bold text-red-600">{formatCurrency(d.balance)}</span>
                  </div>
                  {isOverdue && <p className="text-xs text-orange-600 font-bold mt-1">⚠ Overdue ({daysSinceFirst} days)</p>}
                  {d.mobile && <p className="text-xs text-gray-500 mt-1">📞 {d.mobile}</p>}
                  <p className="text-xs text-gray-400 mt-1">Last activity: {new Date(d.history[0]?.date || Date.now()).toLocaleDateString()}</p>
                </div>
              );
            })}
            {debtors.filter(d => d.balance > 0).length === 0 && <div className="text-center py-10 text-gray-400"><Check className="w-12 h-12 mx-auto mb-2 text-green-300" /><p>No outstanding debts!</p></div>}
          </div>
        </div>

        <div className={`flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8 flex flex-col fixed inset-0 z-50 lg:static lg:z-auto transform transition-transform duration-300 ${selectedDebtor ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          {selectedDebtor ? (
            <>
              <div className="lg:hidden mb-4"><button onClick={() => setSelectedDebtor(null)} className="flex items-center text-gray-500"><ChevronLeft className="w-5 h-5 mr-1" /> Back</button></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">{selectedDebtor.name}</h2>
                  <p className="text-gray-500 text-sm mt-1">ID: {selectedDebtor.id}</p>
                  {selectedDebtor.mobile ? (
                    <p className="text-sm text-gray-600 mt-1">📞 {selectedDebtor.mobile}</p>
                  ) : (
                    <button
                      onClick={() => {
                        const mobile = prompt('Enter mobile number:');
                        if (mobile) {
                          setDebtors(prev => prev.map(d => d.id === selectedDebtor.id ? { ...d, mobile } : d));
                          setSelectedDebtor({ ...selectedDebtor, mobile });
                          showToast('Mobile number added', 'success');
                        }
                      }}
                      className="text-xs text-indigo-600 hover:underline mt-1"
                    >
                      + Add mobile number
                    </button>
                  )}
                </div>
                <div className="text-right"><p className="text-sm text-gray-500">Balance</p><p className="text-4xl font-black text-red-600">{formatCurrency(selectedDebtor.balance)}</p></div>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Record Payment</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Amount..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const val = parseInt(paymentAmount, 10);
                    if (!isNaN(val) && val > 0) {
                      handlePayment(selectedDebtor.id, val);
                      setPaymentAmount('');
                    } else {
                      showToast('Invalid amount', 'error');
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all mt-auto"
                >
                  Pay
                </button>
              </div>
              <h3 className="font-bold text-gray-800 mb-4">History</h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {selectedDebtor.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${h.type === 'payment' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{h.type === 'payment' ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}</div>
                      <div>
                        <p className="font-bold text-gray-800 capitalize">{h.type === 'debt' ? 'Credit Sale' : 'Payment'}</p>
                        {h.type === 'debt' && h.cart && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {h.cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">{new Date(h.date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-lg ${h.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>{h.type === 'payment' ? '-' : '+'}{formatCurrency(h.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50"><User className="w-24 h-24 mb-4" /><p className="text-xl font-medium">Select a debtor</p></div>
          )}
        </div>
      </div>
    );
  };

  const renderModalContent = () => {
    if (!modal) return null;
    if (modal.type === 'add_to_cart') {
      const p = modal.data;

      return (
        <div className="space-y-6">
          <div className="text-center"><h4 className="text-2xl font-bold text-gray-800">{p.name}</h4><p className="text-gray-500">Stock: {p.stock}</p></div>
          <form onSubmit={(e) => { e.preventDefault(); confirmAddToCart(p, modalQuantity, e.target.price.value ? parseInt(e.target.price.value) : null); setModalQuantity(1); }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-xl transition-colors"
                  >
                    −
                  </button>
                  <div className="w-24 h-12 flex items-center justify-center border-2 border-gray-300 rounded-xl">
                    <span className="text-2xl font-black text-gray-800">{modalQuantity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.min(p.stock, modalQuantity + 1))}
                    className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Custom Price (Optional)</label><input name="price" type="number" placeholder={p.sellPrice} className="w-full p-3 border rounded-xl text-center focus:ring-2 focus:ring-indigo-500" /></div>
              <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all">Add to Cart</button>
            </div>
          </form>
        </div>
      );
    }
    if (modal.type === 'customer_select') {
      const transactionType = modal.data.type;

      return (
        <div className="space-y-4">
          <p className="text-center text-gray-500 font-medium">Complete Sale</p>

          {/* Payment Method Selection */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 rounded-lg font-medium transition-all ${paymentMethod === 'cash'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-400'
                  }`}
              >
                💵 Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-3 rounded-lg font-medium transition-all ${paymentMethod === 'bank_transfer'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-400'
                  }`}
              >
                🏦 Transfer
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">{customers.map(c => (<button key={c} onClick={() => { finalizeSale(c, transactionType, paymentMethod); setPaymentMethod('cash'); }} className="w-full p-3 text-left hover:bg-gray-100 rounded-xl font-medium text-gray-700 transition-colors">{c}</button>))}</div>
          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or new</span></div></div>
          <form onSubmit={(e) => { e.preventDefault(); finalizeSale(e.target.name.value, transactionType, paymentMethod); setPaymentMethod('cash'); }}><div className="flex gap-2"><input name="name" placeholder="Customer name..." className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500" required /><button type="submit" className="px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Done</button></div></form>
        </div>
      );
    }
    if (modal.type === 'add_product') {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(Object.fromEntries(new FormData(e.target))); }} className="space-y-4">
          <input name="name" placeholder="Product Name" className="w-full p-3 border rounded-xl" required />
          <div className="grid grid-cols-2 gap-4"><input name="sellPrice" type="number" placeholder="Sell Price" className="w-full p-3 border rounded-xl" required /><input name="buyPrice" type="number" placeholder="Cost Price" className="w-full p-3 border rounded-xl" required /></div>
          <input name="stock" type="number" placeholder="Initial Stock" className="w-full p-3 border rounded-xl" required />
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Save Product</button>
        </form>
      );
    }
    if (modal.type === 'import_customers') {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleImportCustomers(e.target.names.value.split('\n')); }} className="space-y-4">
          <p className="text-sm text-gray-500">Paste names, one per line.</p>
          <textarea name="names" rows="6" className="w-full p-3 border rounded-xl" placeholder="John Doe&#10;Jane Smith"></textarea>
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Import</button>
        </form>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100">
          <h1 className="font-black text-lg flex items-center text-emerald-600"><ShoppingCart className="w-5 h-5 mr-2" /> ShopOS</h1>
          <button
            onClick={() => {
              if (userRole === 'super_admin') {
                setUserRole('admin');
              } else {
                const pin = prompt('Enter Super Admin PIN:');
                if (pin === 'Aiypwzqp01POS$') {
                  setUserRole('super_admin');
                  showToast('Super Admin access granted', 'success');
                } else if (pin) {
                  showToast('Incorrect PIN', 'error');
                }
              }
            }}
            className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold text-slate-600 active:scale-95 transition-transform"
          >
            {userRole === 'super_admin' ? 'Super' : 'Admin'}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {activeTab === 'pos' && <POSTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'debtors' && <DebtorsTab />}
        </main>
      </div>
      <MobileNav />
      {modal && <ModalWrapper title={modal.type === 'add_to_cart' ? 'Add to Cart' : modal.type === 'customer_select' ? 'Select Customer' : modal.type === 'add_product' ? 'New Product' : 'Import'} onClose={() => setModal(null)}>{renderModalContent()}</ModalWrapper>}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
