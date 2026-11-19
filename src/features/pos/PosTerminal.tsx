import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { transactionService } from '../../services/transactionService';
import { formatCurrency, soundFx } from '../../lib/utils';
import { ServiceItem, PaymentMethod, Transaction } from '../../types';
import { Button } from '../../components/ui/Button';
import { ReceiptModal } from './ReceiptModal';
import {
  Scissors,
  Sparkles,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  User,
  Plus,
  Minus,
  Percent,
} from 'lucide-react';

interface CartItem {
  service: ServiceItem;
  quantity: number;
  discount: number;
}

export const PosTerminal: React.FC = () => {
  const { db, currentUser } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Assigned Employee: if logged in as EMPLOYEE, default to their employee profile
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(() => {
    if (currentUser?.role === 'EMPLOYEE' && currentUser.employeeId) {
      return currentUser.employeeId;
    }
    const firstEmp = db.employees.find(e => e.status === 'ACTIVE');
    return firstEmp ? firstEmp.id : '';
  });

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const activeEmployees = db.employees.filter(e => e.status === 'ACTIVE');
  const categories = db.serviceCategories;

  // Filter services
  const filteredServices = db.services.filter(s => {
    if (!s.isActive) return false;
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  const addToCart = (service: ServiceItem) => {
    soundFx.playClick();
    setCart(prev => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) {
        return prev.map(item =>
          item.service.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { service, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    soundFx.playClick();
    setCart(prev =>
      prev
        .map(item => {
          if (item.service.id === serviceId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (serviceId: string) => {
    soundFx.playClick();
    setCart(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountTotal(0);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  // Computations
  const grossTotal = cart.reduce(
    (sum, item) => sum + item.service.defaultPrice * item.quantity,
    0
  );
  const netTotal = Math.max(0, grossTotal - discountTotal);

  // Commission preview for the assigned employee
  const selectedEmp = db.employees.find(e => e.id === assignedEmployeeId);
  let commissionEstimate = 0;
  if (selectedEmp) {
    const rule = selectedEmp.compensationRule;
    if (rule.type === 'PERCENTAGE') {
      commissionEstimate = (netTotal * rule.rateOrAmount) / 100;
    } else if (rule.type === 'FIXED_PER_SERVICE') {
      const totalServicesCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      commissionEstimate = totalServicesCount * rule.rateOrAmount;
    } else if (rule.type === 'SALARY_PLUS_COMMISSION') {
      commissionEstimate = (netTotal * rule.rateOrAmount) / 100;
    }
  }

  const handleCheckout = () => {
    if (!currentUser) return;
    if (cart.length === 0) return;
    if (!assignedEmployeeId) {
      alert('يرجى اختيار الحلاق المنفذ للخدمة');
      return;
    }

    try {
      setIsSubmitting(true);

      const itemsPayload: Array<{ serviceId: string; unitPrice: number; discount: number }> = [];
      cart.forEach(c => {
        for (let i = 0; i < c.quantity; i++) {
          itemsPayload.push({
            serviceId: c.service.id,
            unitPrice: c.service.defaultPrice,
            discount: c.discount || 0,
          });
        }
      });

      const tx = transactionService.createTransaction(
        {
          employeeId: assignedEmployeeId,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items: itemsPayload,
          discountTotal,
          paymentMethod,
          notes: notes.trim() || undefined,
        },
        currentUser
      );

      soundFx.playSuccess();
      if (paymentMethod === 'CASH') {
        soundFx.playCash();
      }

      setCompletedTx(tx);
      clearCart();
    } catch (e: any) {
      alert(e.message || 'حدث خطأ أثناء حفظ التذكرة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-dark-950 select-none">
      {/* Left/Main Column: Catalogue & Category filter */}
      <div className="flex-1 flex flex-col h-full border-l border-dark-800 overflow-hidden">
        {/* Top Controls: Search & Category Filter */}
        <div className="p-4 border-b border-dark-800 bg-dark-900/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                  : 'bg-dark-800 text-slate-300 hover:bg-dark-750'
              }`}
            >
              جميع الخدمات ({db.services.filter(s => s.isActive).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                    : 'bg-dark-800 text-slate-300 hover:bg-dark-750'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث عن خدمة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-dark-850 border border-dark-750 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredServices.map(service => {
            const inCart = cart.find(c => c.service.id === service.id);
            return (
              <button
                key={service.id}
                onClick={() => addToCart(service)}
                className={`relative p-4 rounded-2xl border text-right transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] active:scale-95 group ${
                  inCart
                    ? 'bg-gold-500/10 border-gold-500/40 shadow-gold-sm'
                    : 'bg-dark-850 hover:bg-dark-800 border-dark-750 hover:border-gold-500/30'
                }`}
              >
                {inCart && (
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gold-500 text-dark-950 font-bold text-xs flex items-center justify-center font-mono">
                    {inCart.quantity}
                  </span>
                )}

                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/15 text-gold-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-gold-300 transition">
                    {service.name}
                  </h4>
                  {service.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark-800/80">
                  <span className="text-[11px] text-slate-500">
                    {service.estimatedDurationMinutes} دقيقة
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-gold-400 font-mono">
                    {formatCurrency(service.defaultPrice)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Ticket & Checkout Summary */}
      <div className="w-full lg:w-96 bg-dark-900 flex flex-col h-full border-t lg:border-t-0 border-dark-800">
        {/* Ticket Header */}
        <div className="p-4 border-b border-dark-800 bg-dark-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold-400" />
            <h3 className="font-bold text-sm text-slate-100">تفاصيل الفاتورة</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ</span>
            </button>
          )}
        </div>

        {/* Barber Selector & Customer details */}
        <div className="p-4 border-b border-dark-800 space-y-3 bg-dark-900/50 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">الحلاق المنفذ:</label>
            <select
              value={assignedEmployeeId}
              onChange={e => setAssignedEmployeeId(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-gold-500/50"
            >
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.roleTitle})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="اسم العميل (اختياري)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="رقم الهاتف (اختياري)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <Scissors className="w-10 h-10 mb-2 opacity-30 text-gold-400" />
              <p className="text-xs">اضغط على أي خدمة لإضافتها إلى التذكرة</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.service.id}
                className="p-3 bg-dark-850 border border-dark-750 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex-1 pr-1">
                  <h5 className="font-bold text-slate-200">{item.service.name}</h5>
                  <span className="text-[11px] text-gold-400 font-mono">
                    {formatCurrency(item.service.defaultPrice)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-dark-800 px-2 py-1 rounded-lg border border-dark-700">
                  <button
                    onClick={() => updateQuantity(item.service.id, -1)}
                    className="p-1 hover:text-gold-400 text-slate-400 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-xs text-slate-100 min-w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.service.id, 1)}
                    className="p-1 hover:text-gold-400 text-slate-400 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.service.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition mr-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Payment Methods & Checkout Section */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-dark-800 bg-dark-850 space-y-3">
            {/* Payment Method Selector */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                طريقة الدفع:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'CASH', label: 'كاش', icon: Banknote },
                  { id: 'CARD', label: 'فيزا', icon: CreditCard },
                  { id: 'INSTAPAY', label: 'انستاباي', icon: Smartphone },
                  { id: 'VODAFONE_CASH', label: 'فودافون', icon: Smartphone },
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        soundFx.playClick();
                        setPaymentMethod(m.id as PaymentMethod);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-[11px] font-bold ${
                        isSelected
                          ? 'bg-gold-500 text-dark-950 border-gold-400 shadow-gold-sm'
                          : 'bg-dark-800 text-slate-400 hover:bg-dark-750 border-dark-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount total input */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">خصم مخصص:</span>
              <div className="flex items-center gap-1 max-w-[120px]">
                <input
                  type="number"
                  min="0"
                  max={grossTotal}
                  value={discountTotal || ''}
                  onChange={e => setDiscountTotal(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2 py-1 text-xs text-left font-mono text-slate-200 focus:outline-none focus:border-gold-500/50"
                />
                <span className="text-slate-400">ج.م</span>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="pt-2 border-t border-dark-750 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>الإجمالي:</span>
                <span className="font-mono">{formatCurrency(grossTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>الخصم:</span>
                  <span className="font-mono">-{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gold-300 pt-1">
                <span>المطلوب تحصيله:</span>
                <span className="font-mono">{formatCurrency(netTotal)}</span>
              </div>
              {currentUser?.role === 'ADMIN' && commissionEstimate > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>تقدير عمولة الحلاق:</span>
                  <span className="font-mono">{formatCurrency(commissionEstimate)}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              variant="gold"
              size="lg"
              className="w-full shadow-gold-md"
              onClick={handleCheckout}
              isLoading={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              <span>إصدار التذكرة وحفظ العملية</span>
            </Button>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(completedTx)}
        onClose={() => setCompletedTx(null)}
        transaction={completedTx}
      />
    </div>
  );
};
