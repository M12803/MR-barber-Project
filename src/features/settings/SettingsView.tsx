import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbStorage } from '../../lib/db/storage';
import { generateId, formatCurrency } from '../../lib/utils';
import { ServiceType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Settings,
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Save,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { db, refreshDb } = useApp();

  // Shop Info
  const [shopName, setShopName] = useState(db.settings.shopName);
  const [shopSubtitle, setShopSubtitle] = useState(db.settings.shopSubtitle);
  const [phone, setPhone] = useState(db.settings.phone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin credentials
  const adminUser = db.users.find(u => u.role === 'ADMIN');
  const [adminUsername, setAdminUsername] = useState(adminUser?.username || 'Admin');
  const [adminPassword, setAdminPassword] = useState(adminUser?.pinCode || '');
  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Service Edit / Add Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('80');

  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    dbStorage.updateDb(d => {
      d.settings.shopName = shopName.trim();
      d.settings.shopSubtitle = shopSubtitle.trim();
      d.settings.phone = phone.trim();
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshDb();
  };

  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminUsername.trim()) {
      setAdminError('اسم المستخدم مطلوب');
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 4) {
      setAdminError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    dbStorage.updateDb(d => {
      const a = d.users.find(u => u.role === 'ADMIN');
      if (a) {
        a.username = adminUsername.trim();
        a.pinCode = adminPassword.trim();
      }
    });
    setAdminSaveSuccess(true);
    setTimeout(() => setAdminSaveSuccess(false), 3000);
    refreshDb();
  };

  const openAddService = () => {
    setEditingService(null);
    setServiceName('');
    setServicePrice('80');
    setIsServiceModalOpen(true);
  };

  const openEditService = (srv: ServiceType) => {
    setEditingService(srv);
    setServiceName(srv.name);
    setServicePrice(String(srv.defaultPrice));
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;
    const priceNum = Number(servicePrice) || 0;

    if (editingService) {
      dbStorage.updateDb(d => {
        const s = d.services.find(x => x.id === editingService.id);
        if (s) {
          s.name = serviceName.trim();
          s.defaultPrice = priceNum;
        }
      });
    } else {
      const newSrv: ServiceType = {
        id: generateId('srv'),
        name: serviceName.trim(),
        defaultPrice: priceNum,
      };
      dbStorage.updateDb(d => {
        d.services.push(newSrv);
      });
    }

    setIsServiceModalOpen(false);
    refreshDb();
  };

  const handleDeleteService = (id: string) => {
    if (confirm('هل تريد حذف هذه الخدمة من قائمة الحلاقة؟')) {
      dbStorage.updateDb(d => {
        d.services = d.services.filter(s => s.id !== id);
      });
      refreshDb();
    }
  };

  const handleDownloadBackup = () => {
    const backupJson = dbStorage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_صالون_رمضان_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (confirm('تنبيه: سيتم استبدال البيانات بالملف المحمل. هل تود المتابعة؟')) {
        const res = dbStorage.restoreBackup(content);
        if (res.success) {
          alert('تم استعادة البيانات بنجاح!');
          refreshDb();
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 font-display">
          <Settings className="w-5 h-5 text-gold-400" />
          <span>إعدادات النظام والخدمات (تحكم الأدمن)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          إدارة أنواع الحلاقة وأسعارها، بيانات الصالون، والنسخ الاحتياطي للبيانات
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Services Management (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service catalogue */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-800">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-gold-400" />
                  <span>أنواع الحلاقة والأسعار الافتراضية</span>
                </h3>
                <p className="text-xs text-slate-400">
                  تظهر للحلاق في قائمة تسجيل العملاء ويسجل السعر تلقائياً
                </p>
              </div>

              <Button variant="gold" size="sm" onClick={openAddService}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة نوع حلاقة
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {db.services.map(srv => (
                <div
                  key={srv.id}
                  className="p-4 bg-dark-850 border border-dark-750 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{srv.name}</h4>
                    <span className="font-mono font-bold text-xs text-gold-400 mt-0.5 block">
                      {formatCurrency(srv.defaultPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditService(srv)}
                      className="p-1.5 text-slate-400 hover:text-gold-400 rounded-lg bg-dark-800 hover:bg-dark-750 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg bg-dark-800 hover:bg-dark-750 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shop Information Form */}
          <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-100 mb-4 pb-3 border-b border-dark-800">
              بيانات وهوية الصالون
            </h3>

            <form onSubmit={handleSaveShopInfo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم الصالون:</label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الوصف والشعار:</label>
                  <input
                    type="text"
                    value={shopSubtitle}
                    onChange={e => setShopSubtitle(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم هاتف الصالون:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/60"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-dark-800">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    تم الحفظ بنجاح
                  </span>
                )}
                <Button type="submit" variant="gold" className="mr-auto">
                  <Save className="w-4 h-4 ml-1.5" />
                  حفظ البيانات
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Admin Credentials + Backup & Restore (1 col) */}
        <div className="space-y-6">
          {/* Admin Credentials Card */}
          <div className="bg-dark-900 border border-gold-500/20 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-100 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              بيانات دخول الأدمن
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              غيّر اسم المستخدم وكلمة المرور بتاعتك. تأكد منهم قبل الحفظ.
            </p>
            <form onSubmit={handleSaveAdminCredentials} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المستخدم:</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-gold-500/60"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">كلمة المرور (PIN):</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl px-3 py-2 text-slate-100 font-mono tracking-widest focus:outline-none focus:border-gold-500/60"
                />
              </div>
              {adminError && (
                <p className="text-red-400 text-[11px]">{adminError}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                {adminSaveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> تم الحفظ
                  </span>
                )}
                <Button type="submit" variant="gold" size="sm" className="mr-auto">
                  <Save className="w-3.5 h-3.5 ml-1" />
                  حفظ بيانات الأدمن
                </Button>
              </div>
            </form>
          </div>
          <div className="space-y-6">
            <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-100 mb-2">
              النسخ الاحتياطي للبيانات
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              احفظ نسخة من بيانات المحل وسجلات الحلاقة والسلف على فلاش ميموري خارجي لضمان الأمان.
            </p>

            <div className="space-y-3 text-xs">
              <Button
                variant="outline-gold"
                size="md"
                className="w-full"
                onClick={handleDownloadBackup}
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل نسخة احتياطية (.json)
              </Button>

              <label className="w-full inline-flex items-center justify-center font-bold rounded-xl transition text-xs px-4 py-2.5 bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 cursor-pointer">
                <Upload className="w-4 h-4 ml-2" />
                <span>استعادة البيانات من ملف</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? 'تعديل نوع الحلاقة' : 'إضافة نوع حلاقة جديد'}
        subtitle="تحديد اسم الخدمة وسعرها الافتراضي"
      >
        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">اسم نوع الحلاقة:</label>
            <input
              type="text"
              required
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder="مثال: قصة شعر مميزة"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">السعر الافتراضي (جنيه):</label>
            <input
              type="number"
              min="0"
              step="5"
              required
              value={servicePrice}
              onChange={e => setServicePrice(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-base font-bold text-gold-300 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsServiceModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="gold">
              {editingService ? 'حفظ التعديل' : 'إضافة نوع الحلاقة'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
