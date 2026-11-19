import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, generateId } from '../../lib/utils';
import { dbStorage } from '../../lib/db/storage';
import { auditService } from '../../services/auditService';
import { ServiceItem } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Sparkles, Plus, Edit2, ToggleLeft, ToggleRight, Clock } from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { db, currentUser, refreshDb } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [defaultPrice, setDefaultPrice] = useState<string>('150');
  const [duration, setDuration] = useState<string>('30');

  const categories = db.serviceCategories;

  const filteredServices = db.services.filter(s => {
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setDefaultPrice('150');
    setDuration('30');
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setName(srv.name);
    setDescription(srv.description || '');
    setCategoryId(srv.categoryId);
    setDefaultPrice(String(srv.defaultPrice));
    setDuration(String(srv.estimatedDurationMinutes));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim()) {
      alert('يرجى إدخال اسم الخدمة');
      return;
    }

    if (editingService) {
      dbStorage.updateDb(d => {
        const s = d.services.find(x => x.id === editingService.id);
        if (s) {
          s.name = name.trim();
          s.description = description.trim();
          s.categoryId = categoryId;
          s.defaultPrice = Number(defaultPrice) || 0;
          s.estimatedDurationMinutes = Number(duration) || 15;
        }
      });

      auditService.log(
        currentUser.id,
        currentUser.displayName,
        currentUser.role,
        'UPDATE_SERVICE',
        'SERVICE',
        editingService.id,
        `تعديل الخدمة: ${name} بسعر ${defaultPrice} ج.م`
      );
    } else {
      const newSrv: ServiceItem = {
        id: generateId('srv'),
        categoryId,
        name: name.trim(),
        description: description.trim(),
        defaultPrice: Number(defaultPrice) || 0,
        estimatedDurationMinutes: Number(duration) || 15,
        isActive: true,
        sortOrder: db.services.length + 1,
      };

      dbStorage.updateDb(d => {
        d.services.push(newSrv);
      });

      auditService.log(
        currentUser.id,
        currentUser.displayName,
        currentUser.role,
        'CREATE_SERVICE',
        'SERVICE',
        newSrv.id,
        `إضافة خدمة جديدة لقائمة الصالون: ${name}`
      );
    }

    setIsModalOpen(false);
    refreshDb();
  };

  const toggleServiceActive = (srv: ServiceItem) => {
    if (!currentUser) return;
    dbStorage.updateDb(d => {
      const s = d.services.find(x => x.id === srv.id);
      if (s) s.isActive = !s.isActive;
    });

    auditService.log(
      currentUser.id,
      currentUser.displayName,
      currentUser.role,
      'TOGGLE_SERVICE_ACTIVE',
      'SERVICE',
      srv.id,
      `تغيير حالة الخدمة ${srv.name}`
    );
    refreshDb();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-950 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <span>قائمة الخدمات وباقات الصالون (Service Catalogue)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة الأسعار والخدمات والمدد التقديرية لكل خدمة
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={openAddModal}>
          <Plus className="w-4 h-4 ml-1.5" />
          إضافة خدمة جديدة
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            selectedCategory === 'all'
              ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
              : 'bg-dark-900 border border-dark-800 text-slate-300 hover:bg-dark-800'
          }`}
        >
          الكل ({db.services.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat.id
                ? 'bg-gold-500 text-dark-950 shadow-gold-sm'
                : 'bg-dark-900 border border-dark-800 text-slate-300 hover:bg-dark-800'
            }`}
          >
            {cat.name} ({db.services.filter(s => s.categoryId === cat.id).length})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredServices.map(srv => {
          const category = categories.find(c => c.id === srv.categoryId);
          return (
            <div
              key={srv.id}
              className={`bg-dark-900 border rounded-2xl p-5 flex flex-col justify-between transition ${
                srv.isActive
                  ? 'border-dark-800 hover:border-gold-500/30'
                  : 'border-dark-800/50 opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={srv.isActive ? 'gold' : 'neutral'}>
                    {category?.name || 'خدمة'}
                  </Badge>
                  <button
                    onClick={() => toggleServiceActive(srv)}
                    title={srv.isActive ? 'تعطيل' : 'تفعيل'}
                    className="text-slate-400 hover:text-gold-400 transition"
                  >
                    {srv.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </button>
                </div>

                <h4 className="font-bold text-sm text-slate-100">{srv.name}</h4>
                {srv.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>المدة التقديرية: {srv.estimatedDurationMinutes} دقيقة</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">السعر الأساسي</span>
                  <span className="font-mono font-bold text-base text-gold-400">
                    {formatCurrency(srv.defaultPrice)}
                  </span>
                </div>

                <Button variant="secondary" size="sm" onClick={() => openEditModal(srv)}>
                  <Edit2 className="w-3.5 h-3.5 ml-1" />
                  تعديل
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة إلى الصالون'}
        subtitle="تحديد السعر الافتراضي والتصنيف والمدة التقديرية"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم الخدمة:</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: قص شعر ملكي + استشوار"
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">التصنيف:</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-gold-500/50"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">السعر (ج.م):</label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={defaultPrice}
                onChange={e => setDefaultPrice(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">المدة (بالدقائق):</label>
              <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 rounded-xl px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">وصف مختصر للخدمة:</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="وصف مكونات الخدمة للعميل..."
              className="w-full bg-dark-800 border border-dark-750 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-gold-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="gold" type="submit">
              {editingService ? 'حفظ التعديلات' : 'إضافة الخدمة'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
