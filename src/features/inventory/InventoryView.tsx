import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { productService, sumProductPurchases, sumProductSales } from '../../services/productService';
import { Product, StockMovementType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Package, Plus, ShoppingCart, Truck, Ban } from 'lucide-react';

type Tab = 'stock' | 'movements';
type Action = { type: StockMovementType; product: Product } | null;

const typeLabel: Record<StockMovementType, string> = {
  SALE: 'بيع لزبون',
  PURCHASE: 'شراء للمخزن',
  ADJUSTMENT: 'تسوية جرد',
};

export const InventoryView: React.FC = () => {
  const { db, currentUser } = useApp();
  const [tab, setTab] = useState<Tab>('stock');
  const [error, setError] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [threshold, setThreshold] = useState('3');

  const [action, setAction] = useState<Action>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [party, setParty] = useState('');
  const [notes, setNotes] = useState('');
  const [sign, setSign] = useState<1 | -1>(-1);

  const products = db.products || [];
  const movements = db.stockMovements || [];
  const stockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);

  const actor = { userId: currentUser?.id ?? 'unknown', name: currentUser?.displayName ?? 'غير محدد' };

  const openAction = (type: StockMovementType, product: Product) => {
    setAction({ type, product });
    setQty('1');
    setPrice(String(type === 'SALE' ? product.salePrice : product.costPrice));
    setParty('');
    setNotes('');
    setSign(-1);
    setError('');
  };

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      productService.addProduct(name, Number(salePrice), Number(costPrice || 0), Number(threshold || 0));
      setIsAddOpen(false);
      setName(''); setSalePrice(''); setCostPrice(''); setThreshold('3'); setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const submitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;
    try {
      const q = Number(qty);
      const p = Number(price);
      if (action.type === 'SALE') productService.sell(action.product.id, q, p, actor, party, notes);
      else if (action.type === 'PURCHASE') productService.buy(action.product.id, q, p, actor, party, notes);
      else productService.adjust(action.product.id, q, sign, actor, notes);
      setAction(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const voidRow = (id: string) => {
    if (!window.confirm('إلغاء هذه الحركة؟ سيتم عكس أثرها على المخزن والدرج.')) return;
    try {
      productService.voidMovement(id);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  const inputCls =
    'w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-400" />
            المخزن والمنتجات
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            البيع يقلل الكمية والشراء يزودها. المبالغ تتحرك في نفس درج المحل وتظهر في التقارير كبنود منفصلة.
          </p>
        </div>
        <Button size="sm" onClick={() => { setIsAddOpen(true); setError(''); }}>
          <Plus className="w-4 h-4 ml-1.5" />
          <span>منتج جديد</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4">
          <span className="text-slate-400">إجمالي مبيعات المنتجات</span>
          <p className="text-lg font-black font-mono text-emerald-400 mt-1">{formatCurrency(sumProductSales(movements))}</p>
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4">
          <span className="text-slate-400">إجمالي مشتريات المخزن</span>
          <p className="text-lg font-black font-mono text-amber-400 mt-1">{formatCurrency(sumProductPurchases(movements))}</p>
        </div>
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4">
          <span className="text-slate-400">قيمة المخزون الحالي (بسعر الشراء)</span>
          <p className="text-lg font-black font-mono text-gold-400 mt-1">{formatCurrency(stockValue)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {([['stock', `المخزون (${products.length})`], ['movements', `حركة البيع والشراء (${movements.length})`]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              tab === id ? 'bg-gold-500 text-dark-950' : 'text-slate-400 hover:text-white bg-dark-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800 text-slate-400 border-b border-dark-750">
              <tr>
                <th className="p-4">المنتج</th>
                <th className="p-4">الكمية</th>
                <th className="p-4">سعر البيع</th>
                <th className="p-4">آخر سعر شراء</th>
                <th className="p-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {products.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">لا توجد منتجات بعد. أضف منتج ثم سجل أول شراء له.</td></tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-dark-850/50">
                    <td className="p-4 font-bold text-slate-100">{p.name}</td>
                    <td className="p-4 font-mono">
                      {p.stock}{' '}
                      {p.stock <= p.lowStockThreshold && <Badge variant="neutral">{p.stock === 0 ? 'نفد' : 'قارب على النفاد'}</Badge>}
                    </td>
                    <td className="p-4 font-mono text-emerald-400">{formatCurrency(p.salePrice)}</td>
                    <td className="p-4 font-mono text-slate-300">{formatCurrency(p.costPrice)}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" disabled={p.stock === 0} onClick={() => openAction('SALE', p)}>
                          <ShoppingCart className="w-4 h-4 ml-1" />بيع
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openAction('PURCHASE', p)}>
                          <Truck className="w-4 h-4 ml-1" />شراء
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openAction('ADJUSTMENT', p)}>تسوية</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'movements' && (
        <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-dark-800 text-slate-400 border-b border-dark-750">
              <tr>
                <th className="p-4">الكود</th>
                <th className="p-4">النوع</th>
                <th className="p-4">المنتج</th>
                <th className="p-4">الكمية</th>
                <th className="p-4">الإجمالي</th>
                <th className="p-4">العميل / المورد</th>
                <th className="p-4">المسجل</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-200">
              {movements.length === 0 ? (
                <tr><td colSpan={9} className="p-10 text-center text-slate-500">لا توجد حركات بعد.</td></tr>
              ) : (
                movements.map(m => (
                  <tr key={m.id} className={m.isVoided ? 'opacity-50 line-through' : 'hover:bg-dark-850/50'}>
                    <td className="p-4 font-mono text-gold-400">{m.movementNumber}</td>
                    <td className="p-4">{typeLabel[m.type]}</td>
                    <td className="p-4 font-bold">{m.productName}</td>
                    <td className="p-4 font-mono">{m.signedQuantity > 0 ? `+${m.signedQuantity}` : m.signedQuantity}</td>
                    <td className={`p-4 font-mono ${m.type === 'SALE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.type === 'ADJUSTMENT' ? '-' : formatCurrency(m.total)}
                    </td>
                    <td className="p-4">{m.partyName || '-'}</td>
                    <td className="p-4">{m.recordedByName}</td>
                    <td className="p-4 font-mono text-slate-400">{formatDateTime(m.createdAt)}</td>
                    <td className="p-4 text-center">
                      {!m.isVoided && (
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => voidRow(m.id)}>
                          <Ban className="w-4 h-4 ml-1" />إلغاء
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAddOpen && (
        <Modal isOpen onClose={() => setIsAddOpen(false)} title="إضافة منتج جديد">
          <form onSubmit={submitProduct} className="space-y-4 text-xs">
            <div><label className="block text-slate-300 font-bold mb-1">اسم المنتج</label>
              <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-slate-300 font-bold mb-1">سعر البيع</label>
                <input required type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} className={inputCls} /></div>
              <div><label className="block text-slate-300 font-bold mb-1">سعر الشراء</label>
                <input type="number" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className="block text-slate-300 font-bold mb-1">تنبيه عند وصول الكمية إلى</label>
              <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className={inputCls} /></div>
            {error && <p className="text-red-400">{error}</p>}
            <Button type="submit" className="w-full">حفظ المنتج</Button>
          </form>
        </Modal>
      )}

      {action && (
        <Modal
          isOpen
          onClose={() => setAction(null)}
          title={`${typeLabel[action.type]}: ${action.product.name}`}
          subtitle={`الكمية الحالية: ${action.product.stock}`}
        >
          <form onSubmit={submitAction} className="space-y-4 text-xs">
            {action.type === 'ADJUSTMENT' && (
              <select value={sign} onChange={e => setSign(Number(e.target.value) as 1 | -1)} className={inputCls}>
                <option value={-1}>نقص (تالف / فرق جرد)</option>
                <option value={1}>زيادة (فرق جرد)</option>
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-slate-300 font-bold mb-1">الكمية</label>
                <input required type="number" min="1" step="1" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} /></div>
              {action.type !== 'ADJUSTMENT' && (
                <div><label className="block text-slate-300 font-bold mb-1">{action.type === 'SALE' ? 'سعر البيع للوحدة' : 'سعر الشراء للوحدة'}</label>
                  <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} /></div>
              )}
            </div>
            {action.type !== 'ADJUSTMENT' && (
              <>
                <div><label className="block text-slate-300 font-bold mb-1">{action.type === 'SALE' ? 'اسم الزبون (اختياري)' : 'اسم المورد (اختياري)'}</label>
                  <input value={party} onChange={e => setParty(e.target.value)} className={inputCls} /></div>
                <p className="text-slate-400">
                  الإجمالي: <span className="font-mono text-gold-300">{formatCurrency(Number(qty || 0) * Number(price || 0))}</span>{' '}
                  {action.type === 'SALE' ? '(يدخل الدرج)' : '(يخرج من الدرج)'}
                </p>
              </>
            )}
            <div><label className="block text-slate-300 font-bold mb-1">ملاحظات</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} /></div>
            {error && <p className="text-red-400">{error}</p>}
            <Button type="submit" className="w-full">تأكيد</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
