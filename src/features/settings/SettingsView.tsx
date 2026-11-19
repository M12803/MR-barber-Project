import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dbStorage } from '../../lib/db/storage';
import { auditService } from '../../services/auditService';
import { Button } from '../../components/ui/Button';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [shopName, setShopName] = useState(db.settings.shopName);
  const [shopSubtitle, setShopSubtitle] = useState(db.settings.shopSubtitle);
  const [phone, setPhone] = useState(db.settings.phone);
  const [address, setAddress] = useState(db.settings.address);
  const [receiptFooter, setReceiptFooter] = useState(db.settings.receiptFooter);
  const [inactivityMinutes, setInactivityMinutes] = useState(String(db.settings.inactivityLockMinutes));
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    dbStorage.updateDb(d => {
      d.settings.shopName = shopName.trim();
      d.settings.shopSubtitle = shopSubtitle.trim();
      d.settings.phone = phone.trim();
      d.settings.address = address.trim();
      d.settings.receiptFooter = receiptFooter.trim();
      d.settings.inactivityLockMinutes = Number(inactivityMinutes) || 10;
    });

    auditService.log(
      currentUser.id,
      currentUser.displayName,
      currentUser.role,
      'UPDATE_SHOP_SETTINGS',
      'SETTING',
      'shop_settings',
      `تحديث إعدادات الصالون وهوية النظام`
    );

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    refreshDb();
  };

  const handleDownloadBackup = () => {
    const backupJson = dbStorage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    a.href = url;
    a.download = `MR_Barbers_Backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بتحديث كافة بيانات الصالون الحالية بالبيانات الموجودة في الملف. هل تود المتابعة؟')) {
        const res = dbStorage.restoreBackup(content);
        if (res.success) {
          alert('تم استعادة النسخة الاحتياطية بنجاح!');
          refreshDb();
        } else {
          alert(res.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    if (confirm('تنبيه هام جداً: سيتم مسح التغييرات وإعادة تهيئة النظام بالبيانات التوضيحية الافتراضية. هل أنت متأكد تماماً؟')) {
      dbStorage.resetToFactory();
      alert('تم إعادة ضبط النظام إلى الحالة الأولية بنجاح.');
      refreshDb();
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gold-400" />
          <span>إعدادات النظام والنسخ الاحتياطي (Settings & Maintenance)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          تخصيص هوية الصالون، نصوص الإيصالات الحرارية، وإدارة النسخ الاحتياطية المحلية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shop Profile Form (2 cols) */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-100 mb-4 pb-3 border-b border-dark-800">
            بيانات وهوية الصالون الرسمية
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الصالون:</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الشعار والوصف الفرعي:</label>
                <input
                  type="text"
                  value={shopSubtitle}
                  onChange={e => setShopSubtitle(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  مدة قفل الشاشة التلقائي (بالدقائق):
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={inactivityMinutes}
                  onChange={e => setInactivityMinutes(e.target.value)}
                  className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">العنوان والموقع:</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                الرسالة الترحيبية في ذيل الإيصال الحراري:
              </label>
              <textarea
                rows={3}
                value={receiptFooter}
                onChange={e => setReceiptFooter(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-dark-800">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح</span>
                </div>
              )}
              <div className="mr-auto">
                <Button variant="gold" type="submit">
                  <Save className="w-4 h-4 ml-1.5" />
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Database Backup & Maintenance (1 col) */}
        <div className="space-y-4">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-gold-400" />
              <span>النسخ الاحتياطي (Backup)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              قم بتحميل نسخة احتياطية كاملة من قاعدة بيانات الصالون واحتفظ بها على فلاش ميموري خارجي لضمان سلامة بياناتك.
            </p>

            <div className="space-y-3">
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
                <span>استعادة نسخة احتياطية من ملف</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>إعادة ضبط المصنع (Factory Reset)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">
              إعادة تهيئة النظام بقاعدة البيانات التوضيحية الافتراضية وحذف أي تعديلات محلية.
            </p>
            <Button variant="danger" size="sm" className="w-full" onClick={handleFactoryReset}>
              <RotateCcw className="w-4 h-4 ml-1.5" />
              إعادة ضبط المصنع
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
