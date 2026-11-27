import { dbStorage } from '../lib/db/storage';
import { Product, StockMovement, StockMovementType } from '../types';
import { generateId, isToday } from '../lib/utils';

interface Actor {
  userId: string;
  name: string;
}

const live = (m: StockMovement) => !m.isVoided;

/** Cash that entered the shared drawer from product sales (non-voided). */
export function sumProductSales(list: StockMovement[]): number {
  return list.filter(m => live(m) && m.type === 'SALE').reduce((s, m) => s + m.total, 0);
}

/** Cash that left the shared drawer for product purchases (non-voided). */
export function sumProductPurchases(list: StockMovement[]): number {
  return list.filter(m => live(m) && m.type === 'PURCHASE').reduce((s, m) => s + m.total, 0);
}

export const productService = {
  getProducts(): Product[] {
    return dbStorage.getDb().products || [];
  },

  getMovements(): StockMovement[] {
    return dbStorage.getDb().stockMovements || [];
  },

  getTodayMovements(): StockMovement[] {
    return this.getMovements().filter(m => isToday(m.createdAt));
  },

  addProduct(name: string, salePrice: number, costPrice: number, lowStockThreshold = 3): Product {
    const clean = name.trim();
    if (!clean) throw new Error('اسم المنتج مطلوب');
    if (salePrice < 0 || costPrice < 0) throw new Error('السعر لا يمكن أن يكون سالباً');
    const exists = this.getProducts().some(p => p.isActive && p.name.trim() === clean);
    if (exists) throw new Error('يوجد منتج بنفس الاسم بالفعل');

    const product: Product = {
      id: generateId('prd'),
      name: clean,
      salePrice,
      costPrice,
      stock: 0,
      lowStockThreshold,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    dbStorage.updateDb(d => {
      d.products.push(product);
    });
    return product;
  },

  updateProduct(id: string, patch: Partial<Pick<Product, 'name' | 'salePrice' | 'lowStockThreshold' | 'isActive'>>): void {
    dbStorage.updateDb(d => {
      const p = d.products.find(x => x.id === id);
      if (!p) return;
      if (patch.name !== undefined && patch.name.trim()) p.name = patch.name.trim();
      if (patch.salePrice !== undefined && patch.salePrice >= 0) p.salePrice = patch.salePrice;
      if (patch.lowStockThreshold !== undefined && patch.lowStockThreshold >= 0) p.lowStockThreshold = patch.lowStockThreshold;
      if (patch.isActive !== undefined) p.isActive = patch.isActive;
    });
  },

  /** Single entry point that changes stock. Validates, then writes stock + ledger row atomically. */
  record(
    type: StockMovementType,
    productId: string,
    quantity: number,
    unitPrice: number,
    actor: Actor,
    partyName?: string,
    notes?: string,
    adjustmentSign: 1 | -1 = 1
  ): StockMovement {
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('الكمية يجب أن تكون عدداً صحيحاً أكبر من صفر');
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('السعر غير صحيح');

    const db = dbStorage.getDb();
    const product = db.products.find(p => p.id === productId);
    if (!product) throw new Error('المنتج غير موجود');
    if (!product.isActive && type !== 'ADJUSTMENT') throw new Error('هذا المنتج متوقف');

    const signed = type === 'SALE' ? -quantity : type === 'PURCHASE' ? quantity : quantity * adjustmentSign;
    if (product.stock + signed < 0) {
      throw new Error(`الكمية المتاحة من (${product.name}) هي ${product.stock} فقط`);
    }

    const seq = (db.stockMovements?.length || 0) + 1;
    const movement: StockMovement = {
      id: generateId('stk'),
      movementNumber: `STK-${String(seq).padStart(4, '0')}`,
      type,
      productId: product.id,
      productName: product.name,
      quantity,
      signedQuantity: signed,
      unitPrice,
      total: type === 'ADJUSTMENT' ? 0 : quantity * unitPrice,
      partyName: partyName?.trim() || undefined,
      notes: notes?.trim() || undefined,
      recordedByUserId: actor.userId,
      recordedByName: actor.name,
      createdAt: new Date().toISOString(),
    };

    dbStorage.updateDb(d => {
      const p = d.products.find(x => x.id === productId)!;
      p.stock += signed;
      if (type === 'PURCHASE') p.costPrice = unitPrice;
      d.stockMovements.unshift(movement);
    });
    return movement;
  },

  sell(productId: string, quantity: number, unitPrice: number, actor: Actor, customerName?: string, notes?: string): StockMovement {
    return this.record('SALE', productId, quantity, unitPrice, actor, customerName, notes);
  },

  buy(productId: string, quantity: number, unitCost: number, actor: Actor, supplierName?: string, notes?: string): StockMovement {
    return this.record('PURCHASE', productId, quantity, unitCost, actor, supplierName, notes);
  },

  adjust(productId: string, quantity: number, sign: 1 | -1, actor: Actor, notes?: string): StockMovement {
    return this.record('ADJUSTMENT', productId, quantity, 0, actor, undefined, notes, sign);
  },

  /**
   * Admin-only correction. Never deletes: marks the row voided, reverses its stock effect and
   * removes its cash effect from the drawer. A voided purchase is refused if the stock was already sold.
   */
  voidMovement(id: string, note?: string): void {
    const db = dbStorage.getDb();
    const m = db.stockMovements.find(x => x.id === id);
    if (!m) throw new Error('الحركة غير موجودة');
    if (m.isVoided) throw new Error('الحركة ملغاة بالفعل');
    const product = db.products.find(p => p.id === m.productId);
    if (!product) throw new Error('المنتج غير موجود');
    if (product.stock - m.signedQuantity < 0) {
      throw new Error('لا يمكن إلغاء هذه الحركة لأن الكمية الحالية لا تكفي لعكسها');
    }
    dbStorage.updateDb(d => {
      const mv = d.stockMovements.find(x => x.id === id)!;
      const p = d.products.find(x => x.id === mv.productId)!;
      p.stock -= mv.signedQuantity;
      mv.isVoided = true;
      mv.voidedAt = new Date().toISOString();
      mv.voidNote = note?.trim() || 'إلغاء بواسطة الأدمن';
    });
  },
};
