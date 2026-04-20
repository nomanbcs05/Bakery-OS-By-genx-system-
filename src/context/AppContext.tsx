import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  User, Product, ProductionBatch, Dispatch, DispatchDestination,
  DispatchItem, Sale, SaleItem, SaleType, PaymentMethod, Expense, AuditLog, InventorySnapshot, UserRole,
  RawMaterial, RawMaterialAdjustment, StockAdjustmentType, BranchStockAdjustment, ReceiptSettings, Recipe, DBRecipe,
  StaffMember, StaffDeduction, SalaryVoucher,
  DBProduct, DBProductionBatch, DBSale, DBAuditLog, DBExpense, DBDispatch, DBRawMaterial, DBRawMaterialAdjustment, DBBranchStockAdjustment,
  DBStaffMember, DBStaffDeduction, DBSalaryVoucher, Purchase, DBPurchase
} from '@/types';
import { toast } from 'sonner';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

// Sample data (used as initial state if local storage and Supabase are empty)
const sampleProducts: Product[] = [
  // CAKES
  { id: 'p1', name: 'Black Forest cake', category: 'Cakes', price: 600, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  { id: 'p2', name: 'Pineapple ice cake', category: 'Cakes', price: 550, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  { id: 'p3', name: 'Dry fruit cake', category: 'Cakes', price: 600, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  { id: 'p4', name: 'Three milky cake', category: 'Cakes', price: 1300, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  { id: 'p5', name: 'Bombay Chocolate', category: 'Cakes', price: 600, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  { id: 'p6', name: 'Bombay Coffee', category: 'Cakes', price: 600, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  { id: 'p7', name: 'Brownie Cake', category: 'Cakes', price: 700, unit: 'pound', isActive: true, createdAt: '2026-04-11' },
  
  // M.A FROZEN ITEMS
  { id: 'p8', name: 'Plain Paratha (5 PC)', category: 'M.A Frozen Items', price: 180, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p9', name: 'Plain Paratha (30 PC)', category: 'M.A Frozen Items', price: 850, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p10', name: 'Malai Boti Samosa (12 PC)', category: 'M.A Frozen Items', price: 500, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p11', name: 'Tikka Samosa (12 PC)', category: 'M.A Frozen Items', price: 500, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p12', name: 'Chicken Pocket (6 PC)', category: 'M.A Frozen Items', price: 300, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p13', name: 'Chinese Roll (6 PC)', category: 'M.A Frozen Items', price: 300, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p14', name: 'Macroni Samosa (12 PC)', category: 'M.A Frozen Items', price: 300, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  
  // TEA TIME MUNCHIES
  { id: 'p15', name: 'Khaaray', category: 'Tea Time Munchies', price: 660, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  { id: 'p16', name: 'Biscuits', category: 'Tea Time Munchies', price: 1100, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  { id: 'p17', name: 'Sugar free Biscuits', category: 'Tea Time Munchies', price: 1200, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  { id: 'p18', name: 'Rusks', category: 'Tea Time Munchies', price: 560, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  { id: 'p19', name: 'Slice cake', category: 'Tea Time Munchies', price: 150, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p20', name: 'Vegetable patties', category: 'Tea Time Munchies', price: 40, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p21', name: 'Chicken patties', category: 'Tea Time Munchies', price: 50, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p22', name: 'Rusk Cake', category: 'Tea Time Munchies', price: 1200, unit: 'kg', isActive: true, createdAt: '2026-04-11' },
  
  // CUPCAKES & BREADS
  { id: 'p23', name: 'Cupcakes', category: 'Cupcakes & Breads', price: 50, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p24', name: 'Bakery bread', category: 'Cupcakes & Breads', price: 160, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p25', name: 'Pita bread', category: 'Cupcakes & Breads', price: 100, unit: 'pkt', isActive: true, createdAt: '2026-04-11' },
  { id: 'p26', name: 'Burger buns', category: 'Cupcakes & Breads', price: 25, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  
  // PASTERIES
  { id: 'p27', name: 'Bombay Chocolate pastry', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p28', name: 'Bombay Coffee pastry', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p29', name: 'Sundae Small', category: 'Pasteries', price: 130, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p30', name: 'Sundae Large', category: 'Pasteries', price: 180, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p31', name: 'Red velvet pastry', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p32', name: 'Black Forest pastry', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p33', name: 'Pineapple pastry', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p34', name: 'Brownie', category: 'Pasteries', price: 100, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
  { id: 'p35', name: 'Chocolate cream puff', category: 'Pasteries', price: 80, unit: 'pc', isActive: true, createdAt: '2026-04-11' },
];

const sampleRawMaterials: RawMaterial[] = [
  { id: 'rm1', name: 'Flour', category: 'Dry', unit: 'kg', currentStock: 250, minStockLevel: 50, isActive: true, lastUpdated: '2026-04-01' },
  { id: 'rm2', name: 'Sugar', category: 'Dry', unit: 'kg', currentStock: 100, minStockLevel: 20, isActive: true, lastUpdated: '2026-04-01' },
  { id: 'rm3', name: 'Butter', category: 'Dairy', unit: 'kg', currentStock: 15, minStockLevel: 10, isActive: true, lastUpdated: '2026-04-01' },
  { id: 'rm4', name: 'Milk', category: 'Liquid', unit: 'liters', currentStock: 5, minStockLevel: 20, isActive: true, lastUpdated: '2026-04-01' }, // Low stock example
];

const sampleBatches: ProductionBatch[] = [
  { id: 'b1', batchId: 'BATCH-001', productId: 'p1', quantity: 500, date: '2026-04-05', syncStatus: 'synced' },
  { id: 'b2', batchId: 'BATCH-002', productId: 'p3', quantity: 300, date: '2026-04-05', syncStatus: 'synced' },
  { id: 'b3', batchId: 'BATCH-003', productId: 'p4', quantity: 50, date: '2026-04-05', syncStatus: 'synced' },
  { id: 'b4', batchId: 'BATCH-004', productId: 'p5', quantity: 200, date: '2026-04-05', syncStatus: 'synced' },
];

interface StockMap {
  [productId: string]: {
    production: number;
    branch_1: number;
    branch_2: number;
  };
}

interface AppState {
  currentUser: User | null;
  selectedProfile: User | null;
  isProfileLocked: boolean;
  products: Product[];
  rawMaterials: RawMaterial[];
  rawMaterialAdjustments: RawMaterialAdjustment[];
  branchStockAdjustments: BranchStockAdjustment[];
  batches: ProductionBatch[];
  dispatches: Dispatch[];
  sales: Sale[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  stock: StockMap;
  allUsers: User[];
  isOnline: boolean;
  lastSyncTime: string | null;
  isLoading: boolean;
  receiptSettings: ReceiptSettings;
  staff: StaffMember[];
  staffDeductions: StaffDeduction[];
  salaryVouchers: SalaryVoucher[];
  recipes: Recipe[];
  purchases: Purchase[];
}

interface AppContextType extends AppState {
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string, soft?: boolean) => Promise<void>;
  addRawMaterial: (m: Omit<RawMaterial, 'id' | 'lastUpdated' | 'isActive' | 'currentStock'>) => Promise<void>;
  updateRawMaterial: (id: string, updates: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  adjustRawMaterialStock: (materialId: string, type: StockAdjustmentType, quantity: number, reason?: string) => Promise<boolean>;
  
  addRecipe: (r: Omit<Recipe, 'id' | 'syncStatus'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  
  branchStockAdjustments: BranchStockAdjustment[];
  adjustBranchStock: (productId: string, branch: 'branch_1' | 'branch_2', quantity: number, reason: string) => Promise<void>;
  addProduction: (productId: string, quantity: number, notes?: string) => Promise<boolean | void>;
  updateProduction: (id: string, updates: Partial<ProductionBatch>) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;
  createDispatch: (destination: DispatchDestination, items: DispatchItem[], paymentMethod?: PaymentMethod, customerName?: string, customerPhone?: string) => Promise<string | boolean>;
  createSale: (type: SaleType, branch: 'branch_1' | 'branch_2' | undefined, items: SaleItem[], paymentMethod: PaymentMethod) => Promise<string | false> | string | false;
  refundSale: (id: string) => Promise<boolean>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getInventorySnapshots: () => InventorySnapshot[];
  getTodaySales: () => Sale[];
  getBranchStock: (branch: 'branch_1' | 'branch_2') => { productId: string; stock: number }[];
  getProductionStock: () => { productId: string; stock: number }[];
  clearSales: (range: 'today' | 'weekly' | 'monthly' | 'all') => void;
  clearAllReportData: () => void;
  selectProfile: (profile: User) => void;
  verifyPin: (pin: string) => boolean;
  lockProfile: () => void;
  switchUser: (role: UserRole, branchId?: 'branch_1' | 'branch_2') => void;
  updateUserRole: (userId: string, role: UserRole, branchId?: 'branch_1' | 'branch_2') => Promise<void>;
  updateUserPin: (userId: string, pin: string) => Promise<void>;
  createStaffMember: (name: string, email: string, password: string, role: UserRole, branchId?: string, pin?: string) => Promise<void>;
  logout: () => Promise<void>;
  forceSync: () => Promise<void>;
  seedDatabase: () => Promise<void>;
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => Promise<void>;
  // Staff & Accounts
  addStaffMember: (s: Omit<StaffMember, 'id' | 'isActive' | 'createdAt'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
  addStaffDeduction: (d: Omit<StaffDeduction, 'id' | 'syncStatus'>) => Promise<void>;
  updateStaffDeduction: (id: string, updates: Partial<StaffDeduction>) => Promise<void>;
  deleteStaffDeduction: (id: string) => Promise<void>;
  createSalaryVoucher: (v: Omit<SalaryVoucher, 'id' | 'syncStatus' | 'status'>) => Promise<void>;
  deleteSalaryVoucher: (id: string) => Promise<void>;
  payCreditSale: (id: string) => Promise<void>;
  addPurchase: (p: Omit<Purchase, 'id' | 'syncStatus'>) => Promise<void>;
  hasSupabaseConfig: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'bakewise_erp_state';
const AUTH_STORAGE_KEY = 'bakewise_auth_state';

// Flag to temporarily disable offline database (localStorage) for online-only testing
const DISABLE_OFFLINE_DB = true;

// Helper to convert DB objects to CamelCase
const fromDBProduct = (p: DBProduct): Product => ({
  id: p.id, name: p.name, category: p.category, price: p.price, unit: p.unit, isActive: p.is_active, createdAt: p.created_at
});
const fromDBBatch = (b: DBProductionBatch): ProductionBatch => ({
  id: b.id, batchId: b.batch_id, productId: b.product_id, quantity: b.quantity, date: b.date, notes: b.notes, syncStatus: b.sync_status || 'synced'
});
const fromDBSale = (s: DBSale): Sale => ({
  id: s.id, type: s.type, branch: s.branch, items: s.items, total: s.total, paymentMethod: s.payment_method, 
  customerName: s.customer_name, customerPhone: s.customer_phone, isCreditPaid: s.is_credit_paid,
  date: s.date, syncStatus: s.sync_status || 'synced'
});
const fromDBExpense = (e: DBExpense): Expense => ({
  id: e.id, title: e.title, amount: e.amount, category: e.category, date: e.date, branchId: e.branch_id, syncStatus: e.sync_status || 'synced'
});
const fromDBDispatch = (d: DBDispatch): Dispatch => ({
  id: d.id, destination: d.destination, date: d.date, status: d.status, items: d.items, tokenNumber: d.token_number, syncStatus: d.sync_status || 'synced'
});
const fromDBLog = (l: DBAuditLog): AuditLog => ({
  id: l.id, action: l.action, entity: l.entity, entityId: l.entity_id, details: l.details, userId: l.user_id, timestamp: l.timestamp
});
const fromDBRawMaterial = (m: DBRawMaterial): RawMaterial => ({
  id: m.id, name: m.name, category: m.category, unit: m.unit, currentStock: m.current_stock, minStockLevel: m.min_stock_level, costPerUnit: m.cost_per_unit, supplierName: m.supplier_name, isActive: m.is_active, lastUpdated: m.last_updated
});
const fromDBRawAdjustment = (a: DBRawMaterialAdjustment): RawMaterialAdjustment => ({
  id: a.id, materialId: a.material_id, type: a.type, quantity: a.quantity, reason: a.reason, date: a.date, userId: a.user_id, syncStatus: a.sync_status || 'synced'
});
const fromDBBranchAdjustment = (a: DBBranchStockAdjustment): BranchStockAdjustment => ({
  id: a.id, productId: a.product_id, branch: a.branch, quantity: a.quantity, reason: a.reason, date: a.date, userId: a.user_id
});
const fromDBStaff = (s: DBStaffMember): StaffMember => ({
  id: s.id, name: s.name, department: s.department, baseSalary: s.base_salary, isActive: s.is_active, createdAt: s.created_at
});
const fromDBDeduction = (d: DBStaffDeduction): StaffDeduction => ({
  id: d.id, staffId: d.staff_id, amount: d.amount, reason: d.reason, date: d.date, syncStatus: d.sync_status || 'synced'
});
const fromDBVoucher = (v: DBSalaryVoucher): SalaryVoucher => ({
  id: v.id, staffId: v.staff_id, amount: v.amount, month: v.month, year: v.year, date: v.date, status: v.status, syncStatus: v.sync_status || 'synced'
});
const fromDBPurchase = (p: DBPurchase): Purchase => ({
  id: p.id, materialId: p.material_id, quantity: p.quantity, totalCost: p.total_cost, amountPaid: p.amount_paid, paymentMethod: p.payment_method, 
  vendorName: p.vendor_name, vendorCity: p.vendor_city, date: p.date, syncStatus: p.sync_status || 'synced'
});

const fromDBRecipe = (r: DBRecipe): Recipe => ({
  id: r.id, productId: r.product_id, ingredients: r.ingredients || [], isActive: r.is_active, syncStatus: r.sync_status || 'synced'
});

// Helper to convert frontend objects to DB snake_case
const toDBProduct = (p: Product): DBProduct => ({
  id: p.id, name: p.name, category: p.category, price: p.price, unit: p.unit, is_active: p.isActive, created_at: p.createdAt
});
const toDBBatch = (b: ProductionBatch): DBProductionBatch => ({
  id: b.id, batch_id: b.batchId, product_id: b.productId, quantity: b.quantity, date: b.date, notes: b.notes, sync_status: b.syncStatus
});
const toDBSale = (s: Sale): any => {
  return {
    id: s.id,
    type: s.type,
    branch: s.branch || null,
    items: s.items,
    total: s.total,
    payment_method: s.paymentMethod,
    customer_name: s.customerName || null,
    customer_phone: s.customerPhone || null,
    is_credit_paid: s.isCreditPaid ?? false,
    date: s.date,
    sync_status: 'synced'
  };
};
const toDBExpense = (e: Expense): DBExpense => ({
  id: e.id, title: e.title, amount: e.amount, category: e.category, date: e.date, branch_id: e.branchId, sync_status: e.syncStatus
});
const toDBDispatch = (d: Dispatch): DBDispatch => ({
  id: d.id, destination: d.destination, date: d.date, status: d.status, items: d.items, token_number: d.tokenNumber, sync_status: d.syncStatus
});
const toDBLog = (l: AuditLog): DBAuditLog => ({
  id: l.id, action: l.action, entity: l.entity, entity_id: l.entityId, details: l.details, user_id: l.userId, timestamp: l.timestamp
});
const toDBRawMaterial = (m: RawMaterial): DBRawMaterial => ({
  id: m.id, name: m.name, category: m.category, unit: m.unit, current_stock: m.currentStock, min_stock_level: m.minStockLevel, cost_per_unit: m.costPerUnit, supplier_name: m.supplierName, is_active: m.isActive, last_updated: m.lastUpdated
});
const toDBRawAdjustment = (a: RawMaterialAdjustment): DBRawMaterialAdjustment => ({
  id: a.id, material_id: a.materialId, type: a.type, quantity: a.quantity, reason: a.reason, date: a.date, user_id: a.userId, sync_status: a.syncStatus
});
const toDBBranchAdjustment = (a: BranchStockAdjustment): DBBranchStockAdjustment => ({
  id: a.id, product_id: a.productId, branch: a.branch, quantity: a.quantity, reason: a.reason, date: a.date, user_id: a.userId, sync_status: 'synced'
});
const toDBStaff = (s: StaffMember): DBStaffMember => ({
  id: s.id, name: s.name, department: s.department, base_salary: s.baseSalary, is_active: s.isActive, created_at: s.createdAt
});
const toDBDeduction = (d: StaffDeduction): DBStaffDeduction => ({
  id: d.id, staff_id: d.staffId, amount: d.amount, reason: d.reason, date: d.date, sync_status: d.syncStatus
});
const toDBVoucher = (v: SalaryVoucher): DBSalaryVoucher => ({
  id: v.id, staff_id: v.staffId, amount: v.amount, month: v.month, year: v.year, date: v.date, status: v.status, sync_status: v.syncStatus
});
const toDBPurchase = (p: Purchase): DBPurchase => ({
  id: p.id, material_id: p.materialId, quantity: p.quantity, total_cost: p.totalCost, amount_paid: p.amountPaid, payment_method: p.paymentMethod, 
  vendor_name: p.vendorName, vendor_city: p.vendorCity, date: p.date, sync_status: p.syncStatus
});

const toDBRecipe = (r: Recipe): DBRecipe => ({
  id: r.id, product_id: r.productId, ingredients: r.ingredients, is_active: r.isActive, sync_status: r.syncStatus
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  
  const loadBusinessData = (): Partial<AppState> => {
    if (DISABLE_OFFLINE_DB) return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
      console.error('Failed to load business data from localStorage', e);
      return {};
    }
  };

  const loadAuthData = (): { currentUser?: User | null; selectedProfile?: User | null } => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
      return {};
    }
  };

  const initialState = loadBusinessData();
  const initialAuth = loadAuthData();

  const [currentUser, setCurrentUser] = useState<User | null>(initialAuth.currentUser || null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(() => {
    const saved = localStorage.getItem('bakewise_selected_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return initialAuth.selectedProfile || null;
  });
  const [isProfileLocked, setIsProfileLocked] = useState(true);

  const [products, setProducts] = useState<Product[]>(() => {
    const defaultMenu = [...sampleProducts];
    if (initialState.products && initialState.products.length > 0) {
      initialState.products.forEach(p => {
        if (!defaultMenu.find(m => m.id === p.id)) defaultMenu.push(p);
      });
    }
    return defaultMenu;
  });
  
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(
    initialState.rawMaterials && initialState.rawMaterials.length > 0 
      ? initialState.rawMaterials 
      : sampleRawMaterials
  );
  
  const [rawMaterialAdjustments, setRawMaterialAdjustments] = useState<RawMaterialAdjustment[]>(initialState.rawMaterialAdjustments || []);
  const [batches, setBatches] = useState<ProductionBatch[]>(
    initialState.batches && initialState.batches.length > 0 
      ? initialState.batches 
      : (initialState.products ? [] : sampleBatches)
  );
  
  const [dispatches, setDispatches] = useState<Dispatch[]>(initialState.dispatches || []);
  const [sales, setSales] = useState<Sale[]>(initialState.sales || []);
  const [expenses, setExpenses] = useState<Expense[]>(initialState.expenses || []);
  const [branchStockAdjustments, setBranchStockAdjustments] = useState<BranchStockAdjustment[]>(initialState.branchStockAdjustments || []);
  const [staff, setStaff] = useState<StaffMember[]>(initialState.staff || []);
  const [staffDeductions, setStaffDeductions] = useState<StaffDeduction[]>(initialState.staffDeductions || []);
  const [salaryVouchers, setSalaryVouchers] = useState<SalaryVoucher[]>(initialState.salaryVouchers || []);
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const rawPurchases = initialState.purchases || [];
    return rawPurchases.map((p: any) => ({
      ...p,
      amountPaid: p.amountPaid !== undefined ? p.amountPaid : (p.amount_paid !== undefined ? p.amount_paid : 0)
    }));
  });
  const [recipes, setRecipes] = useState<Recipe[]>(initialState.recipes || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialState.auditLogs || []);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(initialState.lastSyncTime || null);
  
  const defaultReceiptSettings: ReceiptSettings = {
    brandName: "M.A BAKER'S",
    tagline: 'Quality You Can Trust',
    logoUrl: '',
    address: 'Jam Sahib Road, Nawabshah',
    phone: '0329-7040402',
    footerMessage1: "Thank you for visiting M.A BAKER'S!",
    footerMessage2: 'Powered by genx systems +923342826675',
    printedBy: 'GENX ERP & POS SYSTEMS',
    branch1Location: 'Jam sahib road',
    branch1OnlineOrder: '03297040402',
    branch2Location: '',
    branch2OnlineOrder: '',
    branch1Cashier: 'Main Staff',
    branch2Cashier: '',
    branch1Address: 'Jam sahib road, nawabshah',
    branch1Phone: '03297040402',
    branch2Address: 'MAIN CHOWK JAM SAHIB NAWABSHAH',
    branch2Phone: '+92 309 3660360',
    dispatchAddress: 'Factory Gate, Nawabshah',
    dispatchPhone: '03297040402',
    isLocked: false
  };

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() => {
    const saved = (initialState as any).receiptSettings || {};
    return { ...defaultReceiptSettings, ...saved };
  });

  const hasLoaded = React.useRef(false);
  
  // Refs to keep sync functions stable and avoid infinite loops
  const salesRef = React.useRef(sales);
  const batchesRef = React.useRef(batches);
  const dispatchesRef = React.useRef(dispatches);
  const expensesRef = React.useRef(expenses);
  const staffDeductionsRef = React.useRef(staffDeductions);
  const salaryVouchersRef = React.useRef(salaryVouchers);
  const purchasesRef = React.useRef(purchases);
  const recipesRef = React.useRef(recipes);
  const rawMaterialAdjustmentsRef = React.useRef(rawMaterialAdjustments);

  useEffect(() => { salesRef.current = sales; }, [sales]);
  useEffect(() => { batchesRef.current = batches; }, [batches]);
  useEffect(() => { dispatchesRef.current = dispatches; }, [dispatches]);
  useEffect(() => { expensesRef.current = expenses; }, [expenses]);
  useEffect(() => { staffDeductionsRef.current = staffDeductions; }, [staffDeductions]);
  useEffect(() => { salaryVouchersRef.current = salaryVouchers; }, [salaryVouchers]);
  useEffect(() => { purchasesRef.current = purchases; }, [purchases]);
  useEffect(() => { recipesRef.current = recipes; }, [recipes]);
  useEffect(() => { rawMaterialAdjustmentsRef.current = rawMaterialAdjustments; }, [rawMaterialAdjustments]);

  const syncOfflineData = useCallback(async () => {
    if (!hasSupabaseConfig || !navigator.onLine) return;
    
    let syncCount = 0;

    const syncTable = async (table: string, items: any[], toDB: (item: any) => any, setter: (val: any) => void) => {
      const pending = items.filter(i => i.syncStatus === 'pending');
      if (pending.length === 0) return;
      try {
        const payload = pending.map(i => toDB({ ...i, syncStatus: 'synced' }));
        const { error } = await supabase.from(table).upsert(payload);
        if (!error) {
          setter((prev: any[]) => prev.map(i => i.syncStatus === 'pending' ? { ...i, syncStatus: 'synced' } : i));
          syncCount += pending.length;
        } else {
          console.error(`Supabase ${table} sync error:`, error.message, error.details);
          toast.error(`Sync Error (${table}): ${error.message}`);
        }
      } catch (err: any) { 
        console.error(`${table} execution sync error:`, err);
        toast.error(`System Error: ${err.message || 'Unknown error'}`);
      }
    };

    await Promise.all([
      syncTable('sales', salesRef.current, toDBSale, setSales),
      syncTable('production_batches', batchesRef.current, toDBBatch, setBatches),
      syncTable('dispatches', dispatchesRef.current, toDBDispatch, setDispatches),
      syncTable('expenses', expensesRef.current, toDBExpense, setExpenses),
      syncTable('staff_deductions', staffDeductionsRef.current, toDBDeduction, setStaffDeductions),
      syncTable('salary_vouchers', salaryVouchersRef.current, toDBVoucher, setSalaryVouchers),
      syncTable('purchases', purchasesRef.current, toDBPurchase, setPurchases),
      syncTable('recipes', recipesRef.current, toDBRecipe, setRecipes),
      syncTable('raw_material_adjustments', rawMaterialAdjustmentsRef.current, toDBRawAdjustment, setRawMaterialAdjustments)
    ]);

    if (syncCount > 0) {
      toast.success(`Synced ${syncCount} records`);
      setLastSyncTime(new Date().toISOString());
    }
  }, [hasSupabaseConfig]); // Stable dependency

  const fetchData = useCallback(async () => {
    if (!currentUser || !hasSupabaseConfig) return;

    const fetchTable = async (table: string, orderField: string = 'date') => {
      try {
        const { data, error } = await supabase.from(table).select('*').order(orderField, { ascending: false }).limit(1000);
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn(`Failed to fetch ${table}:`, err);
        return null;
      }
    };

    const merge = (remote: any[], local: any[], fromDB: (d: any) => any) => {
      if (!remote) return local;
      const remoteMapped = remote.map(fromDB);
      const localOnly = local.filter(l => !remoteMapped.find(r => r.id === l.id));
      return [...remoteMapped, ...localOnly];
    };

    // Fetch tables independently
    const pData = await fetchTable('products', 'created_at');
    if (pData) setProducts(prev => merge(pData, prev, fromDBProduct));

    const rmData = await fetchTable('raw_materials', 'last_updated');
    if (rmData) setRawMaterials(prev => merge(rmData, prev, fromDBRawMaterial));

    const sData = await fetchTable('sales', 'date');
    if (sData) setSales(prev => merge(sData, prev, fromDBSale));

    const bData = await fetchTable('production_batches', 'date');
    if (bData) setBatches(prev => merge(bData, prev, fromDBBatch));

    const dData = await fetchTable('dispatches', 'date');
    if (dData) setDispatches(prev => merge(dData, prev, fromDBDispatch));

    const eData = await fetchTable('expenses', 'date');
    if (eData) setExpenses(prev => merge(eData, prev, fromDBExpense));

    const rmaData = await fetchTable('raw_material_adjustments', 'date');
    if (rmaData) setRawMaterialAdjustments(prev => merge(rmaData, prev, fromDBRawAdjustment));

    const lData = await fetchTable('audit_logs', 'timestamp');
    if (lData) setAuditLogs(lData.map(fromDBLog));

    const bsaData = await fetchTable('branch_stock_adjustments', 'date');
    if (bsaData) setBranchStockAdjustments(prev => merge(bsaData, prev, fromDBBranchAdjustment));

    const stData = await fetchTable('staff_members', 'created_at');
    if (stData) setStaff(prev => merge(stData, prev, fromDBStaff));

    const sdData = await fetchTable('staff_deductions', 'date');
    if (sdData) setStaffDeductions(prev => merge(sdData, prev, fromDBDeduction));

    const svData = await fetchTable('salary_vouchers', 'date');
    if (svData) setSalaryVouchers(prev => merge(svData, prev, fromDBVoucher));

    const purchasesData = await fetchTable('purchases', 'date');
    if (purchasesData) {
      const sanitized = purchasesData.map(fromDBPurchase);
      setPurchases(prev => merge(sanitized, prev, (d) => d));
    }

    const recipesData = await fetchTable('recipes', 'id');
    if (recipesData) setRecipes(prev => merge(recipesData, prev, fromDBRecipe));

    const { data: settingsData } = await supabase.from('app_settings').select('*').eq('id', 'receipt_config').maybeSingle();
    if (settingsData?.settings) {
      const remote = settingsData.settings;
      const localSavedAt = receiptSettings._savedAt || 0;
      const remoteSavedAt = remote._savedAt || 0;
      // Only overwrite if remote is newer than local
      if (remoteSavedAt >= localSavedAt) {
        setReceiptSettings(prev => ({ ...prev, ...remote, isLocked: false }));
      }
    }

    setLastSyncTime(new Date().toISOString());
    setIsLoading(false);
    setTimeout(() => syncOfflineData(), 1000);
  }, [currentUser, hasSupabaseConfig, syncOfflineData]);

  useEffect(() => { 
    if (currentUser && hasSupabaseConfig) {
      fetchData(); 
    }
  }, [currentUser, hasSupabaseConfig, fetchData]);

  useEffect(() => {
    if (isOnline && hasSupabaseConfig && currentUser) {
      const pullInterval = setInterval(() => fetchData(), 30000); // Poll less frequently when realtime is on
      const pushInterval = setInterval(() => syncOfflineData(), 15000);
      return () => { clearInterval(pullInterval); clearInterval(pushInterval); };
    }
  }, [isOnline, hasSupabaseConfig, currentUser, fetchData, syncOfflineData]);

  const forceSync = useCallback(async () => {
    if (!navigator.onLine || !hasSupabaseConfig) return;
    toast.loading('Syncing...');
    try {
      await syncOfflineData();
      await fetchData();
      toast.dismiss();
      toast.success('Synced');
    } catch (err) {
      toast.dismiss();
      toast.error('Sync failed');
    }
  }, [syncOfflineData, fetchData]);

  useEffect(() => { hasLoaded.current = true; }, []);

  const stock = React.useMemo(() => {
    const map: StockMap = {};
    products.forEach(p => { map[p.id] = { production: 0, branch_1: 0, branch_2: 0 }; });
    batches.forEach(b => { if (map[b.productId]) map[b.productId].production += b.quantity; });
    dispatches.forEach(d => {
      d.items.forEach(item => {
        if (map[item.productId]) {
          map[item.productId].production -= item.quantity;
          if (d.destination === 'branch_1') map[item.productId].branch_1 += item.quantity;
          else if (d.destination === 'branch_2') map[item.productId].branch_2 += item.quantity;
        }
      });
    });
    sales.forEach(s => {
      s.items.forEach(item => {
        if (map[item.productId]) {
          if (s.branch === 'branch_1') map[item.productId].branch_1 -= item.quantity;
          else if (s.branch === 'branch_2') map[item.productId].branch_2 -= item.quantity;
        }
      });
    });
    branchStockAdjustments.forEach(adj => { if (map[adj.productId]) map[adj.productId][adj.branch] -= adj.quantity; });
    return map;
  }, [products, batches, dispatches, sales, branchStockAdjustments]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else { setCurrentUser(null); setSelectedProfile(null); setAllUsers([]); setIsLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        setCurrentUser({
          id: data.id, name: data.name, email: data.email, role: data.role as UserRole,
          branchId: data.branch_id, pinCode: data.pin_code, avatarUrl: data.avatar_url
        });
        fetchAllUsers();
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('role');
    if (data) setAllUsers(data.map(d => ({
      id: d.id, name: d.name, email: d.email, role: d.role as UserRole,
      branchId: d.branch_id, pinCode: d.pin_code, avatarUrl: d.avatar_url
    })));
  };

  useEffect(() => {
    if (!hasSupabaseConfig || !isOnline) return;
    
    let retryCount = 0;
    const maxRetries = 5;

    const setupRealtime = () => {
      const channel = supabase.channel('realtime-erp')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const s = fromDBSale(p.new as DBSale);
            setSales(prev => {
              const idx = prev.findIndex(x => x.id === s.id);
              if (idx === -1) return [...prev, s];
              const next = [...prev]; next[idx] = s; return next;
            });
          } else if (p.eventType === 'DELETE') {
            setSales(prev => prev.filter(s => s.id !== (p.old as any).id));
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const b = fromDBBatch(p.new as DBProductionBatch);
            setBatches(prev => {
              const idx = prev.findIndex(x => x.id === b.id);
              if (idx === -1) return [...prev, b];
              const next = [...prev]; next[idx] = b; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const e = fromDBExpense(p.new as DBExpense);
            setExpenses(prev => {
              const idx = prev.findIndex(x => x.id === e.id);
              if (idx === -1) return [...prev, e];
              const next = [...prev]; next[idx] = e; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const d = fromDBDispatch(p.new as DBDispatch);
            setDispatches(prev => {
              const idx = prev.findIndex(x => x.id === d.id);
              if (idx === -1) return [...prev, d];
              const next = [...prev]; next[idx] = d; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const pr = fromDBProduct(p.new as DBProduct);
            setProducts(prev => {
              const idx = prev.findIndex(x => x.id === pr.id);
              if (idx === -1) return [...prev, pr];
              const next = [...prev]; next[idx] = pr; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_materials' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const rm = fromDBRawMaterial(p.new as DBRawMaterial);
            setRawMaterials(prev => {
              const idx = prev.findIndex(x => x.id === rm.id);
              if (idx === -1) return [...prev, rm];
              const next = [...prev]; next[idx] = rm; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const st = fromDBStaff(p.new as DBStaffMember);
            setStaff(prev => {
              const idx = prev.findIndex(x => x.id === st.id);
              if (idx === -1) return [...prev, st];
              const next = [...prev]; next[idx] = st; return next;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (p) => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const data = p.new as any;
            if (data.id === 'receipt_config' && data.settings) {
              const remote = data.settings;
              setReceiptSettings(prev => {
                const localSavedAt = (prev as any)._savedAt || 0;
                const remoteSavedAt = remote._savedAt || 0;
                // Only overwrite if remote is newer than local
                if (remoteSavedAt >= localSavedAt) {
                  return { ...prev, ...remote, isLocked: false };
                }
                return prev;
              });
            }
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime subscribed successfully');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime subscription error');
          }
        });
      return channel;
    };

    const channel = setupRealtime();
    return () => { supabase.removeChannel(channel); };
  }, [hasSupabaseConfig, isOnline]);

  useEffect(() => {
    if (!hasLoaded.current || DISABLE_OFFLINE_DB) return;
    const data = { products, rawMaterials, rawMaterialAdjustments, branchStockAdjustments, batches, dispatches, sales, expenses, auditLogs, stock, lastSyncTime, receiptSettings, staff, staffDeductions, salaryVouchers, recipes, purchases };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [products, rawMaterials, rawMaterialAdjustments, branchStockAdjustments, batches, dispatches, sales, expenses, auditLogs, stock, lastSyncTime, receiptSettings, staff, staffDeductions, salaryVouchers, recipes, purchases]);

  useEffect(() => {
    if (!hasLoaded.current) return;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ currentUser, selectedProfile }));
  }, [currentUser, selectedProfile]);

  useEffect(() => {
    const on = () => { setIsOnline(true); syncOfflineData(); fetchData(); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [syncOfflineData, fetchData]);

  const addLog = useCallback(async (action: string, entity: string, entityId: string, details: string) => {
    if (!currentUser) return;
    const log: AuditLog = { id: `log-${Date.now()}`, action, entity, entityId, details, userId: currentUser.id, timestamp: new Date().toISOString() };
    setAuditLogs(prev => [...prev, log]);
    if (isOnline && hasSupabaseConfig) {
      try {
        await supabase.from('audit_logs').insert([toDBLog(log)]);
      } catch (err) { console.warn('Failed to log to cloud'); }
    }
  }, [currentUser, isOnline]);

  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  
  const getInventorySnapshots = useCallback((): InventorySnapshot[] => {
    return products.map(p => {
      const s = stock[p.id] || { production: 0, branch_1: 0, branch_2: 0 };
      const totalProduced = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0);
      const totalDispatched = dispatches.flatMap(d => d.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
      const totalSold = sales.flatMap(sl => sl.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
      return { productId: p.id, totalProduced, totalDispatched, totalSold, productionStock: s.production, branch1Stock: s.branch_1, branch2Stock: s.branch_2 };
    });
  }, [products, stock, batches, dispatches, sales]);

  const addProduct = async (p: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => {
    const newP: Product = { ...p, id: `p${Date.now()}`, createdAt: new Date().toISOString(), isActive: true };
    setProducts(prev => [...prev, newP]);
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('products').upsert([toDBProduct(newP)]); } catch (err) { console.error('Product sync error'); }
    }
    addLog('create', 'product', newP.id, `Added product ${newP.name}`);
  };

  const updateProduct = async (id: string, u: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...u } : p));
    const updated = products.find(p => p.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('products').upsert([toDBProduct({ ...updated, ...u })]); } catch (err) { console.error('Product sync error'); }
    }
    addLog('update', 'product', id, `Updated product`);
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('products').update({ is_active: false }).eq('id', id); } catch (err) { console.error('Product delete error'); }
    }
    addLog('delete', 'product', id, `Soft deleted product`);
  };

  const addRawMaterial = async (m: Omit<RawMaterial, 'id' | 'lastUpdated' | 'isActive' | 'currentStock'>) => {
    const newM: RawMaterial = { ...m, id: `rm${Date.now()}`, lastUpdated: new Date().toISOString(), isActive: true, currentStock: 0 };
    setRawMaterials(prev => [...prev, newM]);
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('raw_materials').upsert([toDBRawMaterial(newM)]); } catch (err) { console.error('Material sync error'); }
    }
    addLog('create', 'raw_material', newM.id, `Added material ${newM.name}`);
  };

  const updateRawMaterial = async (id: string, u: Partial<RawMaterial>) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, ...u, lastUpdated: new Date().toISOString() } : m));
    const updated = rawMaterials.find(m => m.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('raw_materials').upsert([toDBRawMaterial({ ...updated, ...u, lastUpdated: new Date().toISOString() })]); } catch (err) { console.error('Material sync error'); }
    }
  };

  const deleteRawMaterial = async (id: string) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('raw_materials').update({ is_active: false }).eq('id', id); } catch (err) { console.error('Material delete error'); }
    }
  };

  const adjustRawMaterialStock = async (materialId: string, type: StockAdjustmentType, quantity: number, reason?: string) => {
    const id = `rma${Date.now()}`;
    const adj: RawMaterialAdjustment = { id, materialId, type, quantity, reason, date: new Date().toISOString(), userId: currentUser?.id || 'system', syncStatus: isOnline ? 'synced' : 'pending' };
    setRawMaterialAdjustments(prev => [...prev, adj]);
    setRawMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        const newStock = type === 'in' ? m.currentStock + quantity : m.currentStock - quantity;
        return { ...m, currentStock: newStock, lastUpdated: new Date().toISOString() };
      }
      return m;
    }));
    if (isOnline && hasSupabaseConfig) {
      const mat = rawMaterials.find(m => m.id === materialId);
      if (mat) {
        const newStock = type === 'in' ? mat.currentStock + quantity : mat.currentStock - quantity;
        try {
          const { error } = await supabase.from('raw_material_adjustments').upsert([toDBRawAdjustment(adj)]);
          await supabase.from('raw_materials').update({ current_stock: newStock, last_updated: new Date().toISOString() }).eq('id', materialId);
          if (error) throw error;
        } catch (err) {
          setRawMaterialAdjustments(prev => prev.map(a => a.id === id ? { ...a, syncStatus: 'pending' } : a));
        }
      }
    }
    return true;
  };

  const addRecipe = async (r: Omit<Recipe, 'id' | 'syncStatus'>) => {
    const newR: Recipe = { ...r, id: `rcp${Date.now()}`, syncStatus: isOnline ? 'synced' : 'pending' };
    setRecipes(prev => [...prev, newR]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('recipes').upsert([toDBRecipe(newR)]);
        if (error) throw error;
      } catch (err) {
        setRecipes(prev => prev.map(rc => rc.id === newR.id ? { ...rc, syncStatus: 'pending' } : rc));
      }
    }
  };

  const updateRecipe = async (id: string, u: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...u } : r));
    const updated = recipes.find(r => r.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('recipes').upsert([toDBRecipe({ ...updated, ...u })]); } catch (err) { console.error('Recipe sync error'); }
    }
  };

  const deleteRecipe = async (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('recipes').delete().eq('id', id); } catch (err) { console.error('Recipe delete error'); }
    }
  };

  const adjustBranchStock = async (productId: string, branch: 'branch_1' | 'branch_2', quantity: number, reason: string) => {
    const adj: BranchStockAdjustment = { id: `bsa${Date.now()}`, productId, branch, quantity, reason, date: new Date().toISOString(), userId: currentUser?.id || 'system' };
    setBranchStockAdjustments(prev => [...prev, adj]);
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('branch_stock_adjustments').upsert([toDBBranchAdjustment(adj)]); } catch (err) { console.error('Stock adjustment sync error'); }
    }
  };

  const addProduction = async (productId: string, quantity: number, notes?: string) => {
    const batchId = `BATCH-${String(batches.length + 1).padStart(3, '0')}`;
    const id = `b${Date.now()}`;
    const newBatch: ProductionBatch = { id, batchId, productId, quantity, date: new Date().toISOString().slice(0, 10), notes, syncStatus: isOnline ? 'synced' : 'pending' };
    setBatches(prev => [...prev, newBatch]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('production_batches').upsert([toDBBatch(newBatch)]);
        if (error) throw error;
      } catch (err) {
        setBatches(prev => prev.map(b => b.id === id ? { ...b, syncStatus: 'pending' } : b));
      }
    }
    return true;
  };

  const updateProduction = async (id: string, u: Partial<ProductionBatch>) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...u } : b));
    const updated = batches.find(b => b.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('production_batches').upsert([toDBBatch({ ...updated, ...u })]); } catch (err) { console.error('Production sync error'); }
    }
  };

  const deleteProduction = async (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('production_batches').delete().eq('id', id); } catch (err) { console.error('Production delete error'); }
    }
  };

  const createDispatch = async (destination: DispatchDestination, items: DispatchItem[], paymentMethod: PaymentMethod = 'cash', customerName?: string, customerPhone?: string) => {
    const id = `d${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const todayDispatches = dispatches.filter(d => d.date === today);
    const tokenNumber = todayDispatches.length + 1;
    const dispatch: Dispatch = { id, destination, date: today, status: 'confirmed', items, tokenNumber, syncStatus: isOnline ? 'synced' : 'pending' };
    setDispatches(prev => [...prev, dispatch]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('dispatches').upsert([toDBDispatch(dispatch)]);
        if (error) throw error;
      } catch (err) {
        setDispatches(prev => prev.map(d => d.id === id ? { ...d, syncStatus: 'pending' } : d));
      }
    }

    if (destination === 'walkin') {
      const saleItems: SaleItem[] = items.map(i => {
        const product = products.find(p => p.id === i.productId);
        return { productId: i.productId, quantity: i.quantity, unitPrice: product?.price || 0 };
      });
      const total = saleItems.reduce((sum, si) => sum + si.quantity * si.unitPrice, 0);
      const walkinSale: Sale = { id: `s${Date.now()}`, type: 'factory_walkin', items: saleItems, total, paymentMethod, customerName, customerPhone, isCreditPaid: true, date: today, syncStatus: isOnline ? 'synced' : 'pending' };
      setSales(prev => [...prev, walkinSale]);
      if (isOnline && hasSupabaseConfig) {
        try {
          const { error } = await supabase.from('sales').upsert([toDBSale(walkinSale)]);
          if (error) throw error;
        } catch (err) {
          setSales(prev => prev.map(s => s.id === walkinSale.id ? { ...s, syncStatus: 'pending' } : s));
        }
      }
      return walkinSale.id;
    }
    return true;
  };

  const createSale = useCallback(async (type: SaleType, branch: 'branch_1' | 'branch_2' | undefined, items: SaleItem[], paymentMethod: PaymentMethod) => {
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const id = `s${Date.now()}`;
    const newSale: Sale = { id, type, branch, items, total, paymentMethod, date: new Date().toISOString().slice(0, 10), syncStatus: isOnline ? 'synced' : 'pending' };
    setSales(prev => [...prev, newSale]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('sales').upsert([toDBSale(newSale)]);
        if (error) throw error;
      } catch (err: any) {
        console.error('Sale sync failed:', err);
        toast.error(`Sale failed to sync: ${err.message || 'Unknown error'}`);
        setSales(prev => prev.map(s => s.id === id ? { ...s, syncStatus: 'pending' } : s));
      }
    }
    addLog('create', 'sale', id, `Sale Rs. ${total}`);
    return id;
  }, [addLog, isOnline]);

  const refundSale = async (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('sales').delete().eq('id', id); } catch (err) { console.error('Sale refund error'); }
    }
    addLog('refund', 'sale', id, `Refunded sale`);
    return true;
  };

  const addExpense = async (e: Omit<Expense, 'id'>) => {
    const newE: Expense = { ...e, id: `e${Date.now()}`, syncStatus: isOnline ? 'synced' : 'pending' };
    setExpenses(prev => [...prev, newE]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('expenses').upsert([toDBExpense(newE)]);
        if (error) throw error;
      } catch (err) {
        setExpenses(prev => prev.map(ex => ex.id === newE.id ? { ...ex, syncStatus: 'pending' } : ex));
      }
    }
  };

  const updateExpense = async (id: string, u: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...u } : e));
    const updated = expenses.find(e => e.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('expenses').upsert([toDBExpense({ ...updated, ...u })]); } catch (err) { console.error('Expense sync error'); }
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('expenses').delete().eq('id', id); } catch (err) { console.error('Expense delete error'); }
    }
  };

  const updateReceiptSettings = async (s: Partial<ReceiptSettings>) => {
    const now = Date.now();
    const newS = { ...receiptSettings, ...s, _savedAt: now };
    setReceiptSettings(newS);
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('app_settings').upsert([{ id: 'receipt_config', settings: newS }]); } catch (err) { console.error('Settings sync error'); }
    }
  };

  const selectProfile = (profile: User) => {
    setSelectedProfile(profile);
    setIsProfileLocked(true);
    localStorage.setItem('bakewise_selected_profile', JSON.stringify(profile));
  };

  const verifyPin = (pin: string) => {
    if (selectedProfile && selectedProfile.pinCode === pin) {
      setIsProfileLocked(false);
      return true;
    }
    return false;
  };

  const lockProfile = () => {
    setIsProfileLocked(true);
    setSelectedProfile(null);
    localStorage.removeItem('bakewise_selected_profile');
  };

  const switchUser = (role: UserRole, branchId?: 'branch_1' | 'branch_2') => {
    const user = allUsers.find(u => u.role === role && (branchId ? u.branchId === branchId : true));
    if (user) {
      selectProfile(user);
    }
  };

  const addStaffMember = async (s: Omit<StaffMember, 'id' | 'isActive' | 'createdAt'>) => {
    const newS: StaffMember = { ...s, id: `st${Date.now()}`, isActive: true, createdAt: new Date().toISOString() };
    setStaff(prev => [...prev, newS]);
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('staff_members').upsert([toDBStaff(newS)]); } catch (err) { console.error('Staff sync error'); }
    }
  };

  const updateStaffMember = async (id: string, u: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
    const updated = staff.find(s => s.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('staff_members').upsert([toDBStaff({ ...updated, ...u })]); } catch (err) { console.error('Staff sync error'); }
    }
  };

  const deleteStaffMember = async (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('staff_members').update({ is_active: false }).eq('id', id); } catch (err) { console.error('Staff delete error'); }
    }
  };

  const addStaffDeduction = async (d: Omit<StaffDeduction, 'id' | 'syncStatus'>) => {
    const newD: StaffDeduction = { ...d, id: `sd${Date.now()}`, syncStatus: isOnline ? 'synced' : 'pending' };
    setStaffDeductions(prev => [...prev, newD]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('staff_deductions').upsert([toDBDeduction(newD)]);
        if (error) throw error;
      } catch (err) {
        setStaffDeductions(prev => prev.map(sd => sd.id === newD.id ? { ...sd, syncStatus: 'pending' } : sd));
      }
    }
  };

  const updateStaffDeduction = async (id: string, u: Partial<StaffDeduction>) => {
    setStaffDeductions(prev => prev.map(d => d.id === id ? { ...d, ...u } : d));
    const updated = staffDeductions.find(d => d.id === id);
    if (updated && isOnline && hasSupabaseConfig) {
      try { await supabase.from('staff_deductions').upsert([toDBDeduction({ ...updated, ...u })]); } catch (err) { console.error('Deduction sync error'); }
    }
  };

  const deleteStaffDeduction = async (id: string) => {
    setStaffDeductions(prev => prev.filter(d => d.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('staff_deductions').delete().eq('id', id); } catch (err) { console.error('Deduction delete error'); }
    }
  };

  const createSalaryVoucher = async (v: Omit<SalaryVoucher, 'id' | 'syncStatus' | 'status'>) => {
    const newV: SalaryVoucher = { ...v, id: `sv${Date.now()}`, status: 'paid', syncStatus: isOnline ? 'synced' : 'pending' };
    setSalaryVouchers(prev => [...prev, newV]);
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('salary_vouchers').upsert([toDBVoucher(newV)]);
        if (error) throw error;
      } catch (err) {
        setSalaryVouchers(prev => prev.map(sv => sv.id === newV.id ? { ...sv, syncStatus: 'pending' } : sv));
      }
    }
  };

  const deleteSalaryVoucher = async (id: string) => {
    setSalaryVouchers(prev => prev.filter(v => v.id !== id));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('salary_vouchers').delete().eq('id', id); } catch (err) { console.error('Voucher delete error'); }
    }
  };

  const payCreditSale = async (id: string) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, isCreditPaid: true } : s));
    if (isOnline && hasSupabaseConfig) {
      try { await supabase.from('sales').update({ is_credit_paid: true }).eq('id', id); } catch (err) { console.error('Credit payment sync error'); }
    }
  };

  const addPurchase = async (p: Omit<Purchase, 'id' | 'syncStatus'>) => {
    const newP: Purchase = { ...p, id: `pur${Date.now()}`, syncStatus: isOnline ? 'synced' : 'pending' };
    setPurchases(prev => [...prev, newP]);
    setRawMaterials(prev => prev.map(m => m.id === p.materialId ? { ...m, currentStock: m.currentStock + p.quantity } : m));
    if (isOnline && hasSupabaseConfig) {
      const mat = rawMaterials.find(m => m.id === p.materialId);
      try {
        await Promise.all([
          supabase.from('purchases').upsert([toDBPurchase(newP)]),
          supabase.from('raw_materials').update({ current_stock: (mat?.currentStock || 0) + p.quantity }).eq('id', p.materialId)
        ]);
      } catch (err) {
        setPurchases(prev => prev.map(pur => pur.id === newP.id ? { ...pur, syncStatus: 'pending' } : pur));
      }
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, selectedProfile, isProfileLocked, products, rawMaterials, rawMaterialAdjustments, batches, dispatches, sales, expenses, auditLogs, stock, allUsers, isOnline, lastSyncTime, isLoading,
      addProduct, updateProduct, deleteProduct,
      addRawMaterial, updateRawMaterial, deleteRawMaterial, adjustRawMaterialStock,
      addRecipe, updateRecipe, deleteRecipe,
      adjustBranchStock, branchStockAdjustments,
      addProduction, updateProduction, deleteProduction,
      createDispatch, createSale, refundSale,
      addExpense, updateExpense, deleteExpense,
      getProductById, getInventorySnapshots, getTodaySales: () => sales.filter(s => s.date === new Date().toISOString().slice(0, 10)),
      getBranchStock: (b) => products.map(p => ({ productId: p.id, stock: stock[p.id]?.[b] || 0 })),
      getProductionStock: () => products.map(p => ({ productId: p.id, stock: stock[p.id]?.production || 0 })),
      clearSales: (r) => {
        const today = new Date().toISOString().slice(0, 10);
        if (r === 'today') setSales(prev => prev.filter(s => s.date !== today));
        else if (r === 'all') setSales([]);
      },
      clearAllReportData: () => { setSales([]); setExpenses([]); setBatches([]); setDispatches([]); },
      selectProfile, verifyPin, lockProfile, switchUser,
      updateUserRole: async (id, r, b) => { if (isOnline) await supabase.from('profiles').update({ role: r, branch_id: b }).eq('id', id); fetchAllUsers(); },
      updateUserPin: async (id, p) => { if (isOnline) await supabase.from('profiles').update({ pin_code: p }).eq('id', id); fetchAllUsers(); },
      createStaffMember: async (n, e, p, r, b, pi) => { if (isOnline) await supabase.from('profiles').insert([{ name: n, email: e, role: r, branch_id: b, pin_code: pi }]); fetchAllUsers(); },
      logout: async () => { await supabase.auth.signOut(); setCurrentUser(null); setSelectedProfile(null); },
      forceSync, seedDatabase: async () => { fetchData(); },
      receiptSettings, updateReceiptSettings,
      staff, staffDeductions, salaryVouchers,
      addStaffMember, updateStaffMember, deleteStaffMember,
      addStaffDeduction, updateStaffDeduction, deleteStaffDeduction,
      createSalaryVoucher, deleteSalaryVoucher,
      payCreditSale,
      purchases, addPurchase,
      hasSupabaseConfig
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
