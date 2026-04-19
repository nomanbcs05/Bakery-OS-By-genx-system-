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
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string, soft?: boolean) => Promise<void>;
  addRawMaterial: (m: Omit<RawMaterial, 'id' | 'lastUpdated' | 'isActive' | 'currentStock'>) => void;
  updateRawMaterial: (id: string, updates: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  adjustRawMaterialStock: (materialId: string, type: StockAdjustmentType, quantity: number, reason?: string) => Promise<boolean>;
  
  addRecipe: (r: Omit<Recipe, 'id' | 'syncStatus'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  
  branchStockAdjustments: BranchStockAdjustment[];
  adjustBranchStock: (productId: string, branch: 'branch_1' | 'branch_2', quantity: number, reason: string) => void;
  addProduction: (productId: string, quantity: number, notes?: string) => Promise<boolean | void>;
  updateProduction: (id: string, updates: Partial<ProductionBatch>) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;
  createDispatch: (destination: DispatchDestination, items: DispatchItem[], paymentMethod?: PaymentMethod, customerName?: string, customerPhone?: string) => Promise<string | boolean>;
  createSale: (type: SaleType, branch: 'branch_1' | 'branch_2' | undefined, items: SaleItem[], paymentMethod: PaymentMethod) => Promise<string | false> | string | false;
  refundSale: (id: string) => Promise<boolean>;
  addExpense: (e: Omit<Expense, 'id'>) => void;
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
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => void;
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
    branch: s.branch,
    items: s.items,
    total: s.total,
    payment_method: s.paymentMethod,
    customer_name: s.customerName,
    customer_phone: s.customerPhone,
    is_credit_paid: s.isCreditPaid,
    date: s.date,
    sync_status: 'synced' // Explicitly set to synced when uploading
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
  
  // Load BUSINESS data from local storage (products, sales, expenses, etc.)
  // This data persists across logins/logouts and profile switches
  const loadBusinessData = (): Partial<AppState> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed;
    } catch (e) {
      console.error('Failed to load business data from localStorage', e);
      return {};
    }
  };

  // Load AUTH data separately (currentUser, selectedProfile)
  const loadAuthData = (): { currentUser?: User | null; selectedProfile?: User | null } => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed;
    } catch (e) {
      return {};
    }
  };

  const initialState = loadBusinessData();
  const initialAuth = loadAuthData();

  // Auth state — separate from business data
  const [currentUser, setCurrentUser] = useState<User | null>(initialAuth.currentUser || null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(() => {
    const saved = localStorage.getItem('bakewise_selected_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return initialAuth.selectedProfile || null;
  });
  const [isProfileLocked, setIsProfileLocked] = useState(true);

  // BUSINESS DATA — these persist FOREVER until user explicitly clears
  const [products, setProducts] = useState<Product[]>(() => {
    const defaultMenu = [...sampleProducts];
    if (initialState.products && initialState.products.length > 0) {
      initialState.products.forEach(p => {
        if (!defaultMenu.find(m => m.id === p.id)) {
          defaultMenu.push(p);
        }
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
  const [purchases, setPurchases] = useState<Purchase[]>(initialState.purchases || []);
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
    branch2Address: 'Main chowk jam sahib road nawabshah',
    branch2Phone: '03093660360',
    dispatchAddress: 'Factory Gate, Nawabshah',
    dispatchPhone: '03297040402',
    isLocked: false
  };

  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() => {
    const saved = (initialState as any).receiptSettings || {};
    return {
      ...defaultReceiptSettings,
      ...saved
    };
  });

  const hasLoaded = React.useRef(false);

  const forceSync = useCallback(async () => {
    if (!navigator.onLine || !hasSupabaseConfig) return;
    
    try {
      // Sync pending sales
      const pendingSales = sales.filter(s => s.syncStatus === 'pending');
      if (pendingSales.length > 0) {
        for (const sale of pendingSales) {
          await supabase.from('sales').upsert([toDBSale(sale)]);
        }
        setSales(prev => prev.map(s => s.syncStatus === 'pending' ? { ...s, syncStatus: 'synced' } : s));
      }

      // Sync pending expenses
      const pendingExpenses = expenses.filter(e => e.syncStatus === 'pending');
      if (pendingExpenses.length > 0) {
        for (const exp of pendingExpenses) {
          await supabase.from('expenses').upsert([toDBExpense(exp)]);
        }
        setExpenses(prev => prev.map(e => e.syncStatus === 'pending' ? { ...e, syncStatus: 'synced' } : e));
      }
      
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, [sales, expenses, hasSupabaseConfig]);

  useEffect(() => {
    hasLoaded.current = true;
  }, []);

  // Derive stock from all historical data
  const stock = React.useMemo(() => {
    const map: StockMap = {};
    
    // Initialize
    products.forEach(p => {
      map[p.id] = { production: 0, branch_1: 0, branch_2: 0 };
    });

    // Add production
    batches.forEach(b => {
      if (map[b.productId]) {
        map[b.productId].production += b.quantity;
      }
    });

    // Subtract dispatches and add to branches
    dispatches.forEach(d => {
      d.items.forEach(item => {
        if (map[item.productId]) {
          map[item.productId].production -= item.quantity;
          if (d.destination === 'branch_1') map[item.productId].branch_1 += item.quantity;
          else if (d.destination === 'branch_2') map[item.productId].branch_2 += item.quantity;
        }
      });
    });

    // Subtract sales
    sales.forEach(s => {
      s.items.forEach(item => {
        if (map[item.productId]) {
          if (s.branch === 'branch_1') map[item.productId].branch_1 -= item.quantity;
          else if (s.branch === 'branch_2') map[item.productId].branch_2 -= item.quantity;
        }
      });
    });

    // Subtract branch stock adjustments (wastage, damage, morning count adjustments)
    branchStockAdjustments.forEach(adj => {
      if (map[adj.productId]) {
        map[adj.productId][adj.branch] -= adj.quantity;
      }
    });

    return map;
  }, [products, batches, dispatches, sales, branchStockAdjustments]);

  // Auth and Data Fetching
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchAllUsers(); // Fetch all profiles for the selection wall
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes — NEVER touch business data here
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchAllUsers();
      } else {
        // Only clear auth state, NEVER touch products/sales/expenses etc.
        setCurrentUser(null);
        setSelectedProfile(null);
        setAllUsers([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          branchId: data.branch_id,
          pinCode: data.pin_code,
          avatarUrl: data.avatar_url
        });
        
        // Always fetch all users when a session is active to populate the profile selection screen
        fetchAllUsers();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true }); // Admin first
      
      if (error) throw error;
      if (data) {
        setAllUsers(data.map(d => ({
          id: d?.id || '',
          name: d?.name || 'Unknown',
          email: d?.email || '',
          role: (d?.role as UserRole) || 'branch_staff',
          branchId: d?.branch_id,
          pinCode: d?.pin_code,
          avatarUrl: d?.avatar_url
        })));
      }
    } catch (error) {
      console.error('Error fetching all profiles:', error);
    }
  };

  // Fetch data from Supabase on mount
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const [
          { data: pData },
          { data: rmData },
          { data: rmaData },
          { data: bData },
          { data: dData },
          { data: sData },
          { data: eData },
          { data: lData },
          { data: bsaData },
          { data: stData },
          { data: sdData },
          { data: svData },
          { data: purchasesData },
          { data: recipesData },
          { data: settingsData }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('raw_materials').select('*'),
          supabase.from('raw_material_adjustments').select('*'),
          supabase.from('production_batches').select('*'),
          supabase.from('dispatches').select('*'),
          supabase.from('sales').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('audit_logs').select('*'),
          supabase.from('branch_stock_adjustments').select('*'),
          supabase.from('staff_members').select('*'),
          supabase.from('staff_deductions').select('*'),
          supabase.from('salary_vouchers').select('*'),
          supabase.from('purchases').select('*'),
          supabase.from('recipes').select('*'),
          supabase.from('app_settings').select('*').eq('id', 'receipt_config').maybeSingle()
        ]);

        // MERGE strategy: cloud data + local-only data. NEVER replace local with empty cloud.
        if (pData && pData.length > 0) {
          const remoteProducts = pData.map(fromDBProduct);
          setProducts(prev => {
            const offlineProducts = prev.filter(local => !remoteProducts.find(r => r.id === local.id));
            return [...remoteProducts, ...offlineProducts];
          });
        }

        if (rmData && rmData.length > 0) {
          const remoteRM = rmData.map(fromDBRawMaterial);
          setRawMaterials(prev => {
            const offline = prev.filter(local => !remoteRM.find(r => r.id === local.id));
            return [...remoteRM, ...offline];
          });
        }

        if (rmaData && rmaData.length > 0) {
          const remoteAdjustments = rmaData.map(fromDBRawAdjustment);
          setRawMaterialAdjustments(prev => {
            const merged = [...prev];
            remoteAdjustments.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }
        
        if (bData && bData.length > 0) {
          const remoteBatches = bData.map(fromDBBatch);
          setBatches(prev => {
            const merged = [...prev];
            remoteBatches.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }

        if (settingsData?.settings) {
          setReceiptSettings(prev => ({
            ...prev,
            ...settingsData.settings,
            isLocked: true
          }));
        }
        
        if (dData && dData.length > 0) {
          const remoteDispatches = dData.map(fromDBDispatch);
          setDispatches(prev => {
            const merged = [...prev];
            remoteDispatches.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }
        
        if (sData && sData.length > 0) {
          const remoteSales = sData.map(fromDBSale);
          setSales(prev => {
            const merged = [...prev];
            remoteSales.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }

        if (eData && eData.length > 0) {
          const remoteExpenses = eData.map(fromDBExpense);
          setExpenses(prev => {
            const merged = [...prev];
            remoteExpenses.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }
        
        if (lData && lData.length > 0) setAuditLogs(lData.map(fromDBLog));
        
        if (bsaData && bsaData.length > 0) {
          const remoteBsa = bsaData.map(fromDBBranchAdjustment);
          setBranchStockAdjustments(prev => {
            const offline = prev.filter(local => !remoteBsa.find(r => r.id === local.id));
            return [...remoteBsa, ...offline];
          });
        }

        if (stData && stData.length > 0) {
          const remoteStaff = stData.map(fromDBStaff);
          setStaff(prev => {
            const offline = prev.filter(local => !remoteStaff.find(r => r.id === local.id));
            return [...remoteStaff, ...offline];
          });
        }

        if (sdData && sdData.length > 0) {
          const remoteDeductions = sdData.map(fromDBDeduction);
          setStaffDeductions(prev => {
            const merged = [...prev];
            remoteDeductions.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }

        if (svData && svData.length > 0) {
          const remoteVouchers = svData.map(fromDBVoucher);
          setSalaryVouchers(prev => {
            const merged = [...prev];
            remoteVouchers.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }

        if (purchasesData && purchasesData.length > 0) {
          const remotePurchases = purchasesData.map(fromDBPurchase);
          setPurchases(prev => {
            const merged = [...prev];
            remotePurchases.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }

        if (recipesData && recipesData.length > 0) {
          const remoteRecipes = recipesData.map(fromDBRecipe);
          setRecipes(prev => {
            const merged = [...prev];
            remoteRecipes.forEach(r => {
              const idx = merged.findIndex(l => l.id === r.id);
              if (idx !== -1) merged[idx] = r; else merged.push(r);
            });
            return merged;
          });
        }
        
        setLastSyncTime(new Date().toISOString());
        
        // After fetching, immediately push any local-only data that might exist
        setTimeout(() => {
          forceSync();
        }, 1000);
      } catch (error: any) {
        console.error('Supabase fetch error:', error);
        if (hasSupabaseConfig) {
          toast.error(`Database connection failed: ${error.message || 'Check your internet connection'}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Background Heartbeat Sync: Ensure all terminals push data every 30 seconds
  useEffect(() => {
    if (isOnline && hasSupabaseConfig) {
      const interval = setInterval(() => {
        forceSync();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, hasSupabaseConfig, forceSync]);

  // Real-time subscriptions
  useEffect(() => {
    if (!navigator.onLine || !hasSupabaseConfig) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newSale = fromDBSale(payload.new as DBSale);
          setSales(prev => {
            const index = prev.findIndex(s => s.id === newSale.id);
            if (index === -1) return [...prev, newSale];
            const next = [...prev];
            next[index] = newSale;
            return next;
          });
        } else if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id: string }).id;
          setSales(prev => prev.filter(s => s.id !== oldId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newBatch = fromDBBatch(payload.new as DBProductionBatch);
          setBatches(prev => {
            if (prev.find(b => b.id === newBatch.id)) return prev;
            return [...prev, newBatch];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newExpense = fromDBExpense(payload.new as DBExpense);
          setExpenses(prev => {
            if (prev.find(e => e.id === newExpense.id)) return prev;
            return [...prev, newExpense];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newDispatch = fromDBDispatch(payload.new as DBDispatch);
          setDispatches(prev => {
            if (prev.find(d => d.id === newDispatch.id)) return prev;
            return [...prev, newDispatch];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_materials' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newRM = fromDBRawMaterial(payload.new as DBRawMaterial);
          setRawMaterials(prev => {
            const index = prev.findIndex(r => r.id === newRM.id);
            if (index === -1) return [...prev, newRM];
            const next = [...prev];
            next[index] = newRM;
            return next;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'raw_material_adjustments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAdj = fromDBRawAdjustment(payload.new as DBRawMaterialAdjustment);
          setRawMaterialAdjustments(prev => {
            if (prev.find(a => a.id === newAdj.id)) return prev;
            return [...prev, newAdj];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newStaff = fromDBStaff(payload.new as DBStaffMember);
          setStaff(prev => {
            const index = prev.findIndex(r => r.id === newStaff.id);
            if (index === -1) return [...prev, newStaff];
            const next = [...prev];
            next[index] = newStaff;
            return next;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_deductions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newAdj = fromDBDeduction(payload.new as DBStaffDeduction);
          setStaffDeductions(prev => {
            if (prev.find(a => a.id === newAdj.id)) return prev;
            return [...prev, newAdj];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salary_vouchers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newVoucher = fromDBVoucher(payload.new as DBSalaryVoucher);
          setSalaryVouchers(prev => {
            if (prev.find(a => a.id === newVoucher.id)) return prev;
            return [...prev, newVoucher];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newRecipe = fromDBRecipe(payload.new as DBRecipe);
          setRecipes(prev => {
            const index = prev.findIndex(r => r.id === newRecipe.id);
            if (index === -1) return [...prev, newRecipe];
            const next = [...prev];
            next[index] = newRecipe;
            return next;
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          fetchAllProfiles(); // Refresh the full user list to ensure roles/passcodes stay synced
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newSettings = (payload.new as any).settings;
          if (newSettings) {
            setReceiptSettings(prev => ({
              ...prev,
              ...newSettings,
              isLocked: true
            }));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Persist BUSINESS data to local storage (separate from auth)
  useEffect(() => {
    if (!hasLoaded.current) return;
    
    // Business data — persists across login/logout/profile switches
    const businessData = {
      products, 
      rawMaterials, 
      rawMaterialAdjustments, 
      branchStockAdjustments,
      batches, 
      dispatches, 
      sales, 
      expenses, 
      auditLogs, 
      stock, 
      lastSyncTime,
      receiptSettings,
      staff,
      staffDeductions,
      salaryVouchers,
      recipes
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(businessData));
    } catch (e) {
      console.error('Failed to save business data to localStorage:', e);
    }
  }, [products, rawMaterials, rawMaterialAdjustments, branchStockAdjustments, batches, dispatches, sales, expenses, auditLogs, stock, lastSyncTime, receiptSettings, staff, staffDeductions, salaryVouchers, recipes]);

  // Persist AUTH data separately
  useEffect(() => {
    if (!hasLoaded.current) return;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ currentUser, selectedProfile }));
    } catch (e) {
      console.error('Failed to save auth data to localStorage:', e);
    }
  }, [currentUser, selectedProfile]);

  // Sync offline data on mount if online
  useEffect(() => {
    if (isOnline && !isLoading) {
      const timer = setTimeout(() => {
        syncOfflineData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isLoading]);

  // Online/Offline handling
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('System is online. Syncing data...');
      syncOfflineData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('System is offline. Data will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!hasSupabaseConfig || !navigator.onLine) return;
    
    let syncCount = 0;

    // 1. Sync Sales
    const pendingSales = sales.filter(s => s.syncStatus === 'pending');
    if (pendingSales.length > 0) {
      try {
        const { error } = await supabase.from('sales').insert(
          pendingSales.map(s => toDBSale({ ...s, syncStatus: 'synced' }))
        );
        if (!error) {
          setSales(prev => prev.map(s => s.syncStatus === 'pending' ? { ...s, syncStatus: 'synced' } : s));
          syncCount += pendingSales.length;
        }
      } catch (err) { console.error('Sales sync error:', err); }
    }

    // 2. Sync Production Batches
    const pendingBatches = batches.filter(b => b.syncStatus === 'pending');
    if (pendingBatches.length > 0) {
      try {
        const { error } = await supabase.from('production_batches').insert(
          pendingBatches.map(b => toDBBatch({ ...b, syncStatus: 'synced' }))
        );
        if (!error) {
          setBatches(prev => prev.map(b => b.syncStatus === 'pending' ? { ...b, syncStatus: 'synced' } : b));
          syncCount += pendingBatches.length;
        }
      } catch (err) { console.error('Production sync error:', err); }
    }

    // 3. Sync Dispatches
    const pendingDispatches = dispatches.filter(d => d.syncStatus === 'pending');
    if (pendingDispatches.length > 0) {
      try {
        const { error } = await supabase.from('dispatches').insert(
          pendingDispatches.map(d => toDBDispatch({ ...d, syncStatus: 'synced' }))
        );
        if (!error) {
          setDispatches(prev => prev.map(d => d.syncStatus === 'pending' ? { ...d, syncStatus: 'synced' } : d));
          syncCount += pendingDispatches.length;
        }
      } catch (err) { console.error('Dispatch sync error:', err); }
    }

    // 4. Sync Expenses
    const pendingExpenses = expenses.filter(e => e.syncStatus === 'pending');
    if (pendingExpenses.length > 0) {
      try {
        const { error } = await supabase.from('expenses').insert(
          pendingExpenses.map(e => toDBExpense({ ...e, syncStatus: 'synced' }))
        );
        if (!error) {
          setExpenses(prev => prev.map(e => e.syncStatus === 'pending' ? { ...e, syncStatus: 'synced' } : e));
          syncCount += pendingExpenses.length;
        }
      } catch (err) { console.error('Expense sync error:', err); }
    }

    // 5. Sync Staff Deductions
    const pendingDeductions = staffDeductions.filter(d => d.syncStatus === 'pending');
    if (pendingDeductions.length > 0) {
      try {
        const { error } = await supabase.from('staff_deductions').insert(
          pendingDeductions.map(d => toDBDeduction({ ...d, syncStatus: 'synced' }))
        );
        if (!error) {
          setStaffDeductions(prev => prev.map(d => d.syncStatus === 'pending' ? { ...d, syncStatus: 'synced' } : d));
          syncCount += pendingDeductions.length;
        }
      } catch (err) { console.error('Staff deductions sync error:', err); }
    }

    // 6. Sync Salary Vouchers
    const pendingVouchers = salaryVouchers.filter(v => v.syncStatus === 'pending');
    if (pendingVouchers.length > 0) {
      try {
        const { error } = await supabase.from('salary_vouchers').insert(
          pendingVouchers.map(v => toDBVoucher({ ...v, syncStatus: 'synced' }))
        );
        if (!error) {
          setSalaryVouchers(prev => prev.map(v => v.syncStatus === 'pending' ? { ...v, syncStatus: 'synced' } : v));
          syncCount += pendingVouchers.length;
        }
      } catch (err) { console.error('Salary vouchers sync error:', err); }
    }

    // 7. Sync Purchases
    const pendingPurchases = purchases.filter(p => p.syncStatus === 'pending');
    if (pendingPurchases.length > 0) {
      try {
        const { error } = await supabase.from('purchases').insert(
          pendingPurchases.map(p => toDBPurchase({ ...p, syncStatus: 'synced' }))
        );
        if (!error) {
          setPurchases(prev => prev.map(p => p.syncStatus === 'pending' ? { ...p, syncStatus: 'synced' } : p));
          syncCount += pendingPurchases.length;
        }
      } catch (err) { console.error('Purchase sync error:', err); }
    }

    if (syncCount > 0) {
      toast.success(`Successfully synced ${syncCount} offline records to cloud`);
      setLastSyncTime(new Date().toISOString());
    }
  }, [sales, batches, dispatches, expenses, staffDeductions, salaryVouchers]);


  const seedDatabase = useCallback(async () => {
    if (!navigator.onLine || !hasSupabaseConfig) {
      toast.error('Connect to internet and configure Supabase first');
      return;
    }

    toast.loading('Seeding initial data...');
    try {
      // 1. Seed Products
      const { error: pError } = await supabase.from('products').upsert(sampleProducts.map(toDBProduct));
      if (pError) throw pError;

      // 2. Seed Batches
      const { error: bError } = await supabase.from('production_batches').upsert(sampleBatches.map(toDBBatch));
      if (bError) throw bError;

      // 3. Seed Sample Sales
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      
      const sampleSales: Sale[] = [
        {
          id: 's-seed-1',
          type: 'branch',
          branch: 'branch_1',
          items: [{ productId: 'p1', quantity: 10, unitPrice: 350 }],
          total: 3500,
          paymentMethod: 'cash',
          date: today,
          syncStatus: 'synced'
        },
        {
          id: 's-seed-2',
          type: 'branch',
          branch: 'branch_2',
          items: [{ productId: 'p2', quantity: 5, unitPrice: 400 }],
          total: 2000,
          paymentMethod: 'card',
          date: today,
          syncStatus: 'synced'
        },
        {
          id: 's-seed-3',
          type: 'factory_walkin',
          items: [{ productId: 'p3', quantity: 20, unitPrice: 250 }],
          total: 5000,
          paymentMethod: 'cash',
          date: yesterday,
          syncStatus: 'synced'
        }
      ];

      const { error: sError } = await supabase.from('sales').upsert(sampleSales.map(toDBSale));
      if (sError) throw sError;

      toast.dismiss();
      toast.success('Initial data and sample sales seeded successfully. Refreshing...');
      window.location.reload();
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Seeding failed: ${error.message}`);
    }
  }, []);

  const addLog = useCallback(async (action: string, entity: string, entityId: string, details: string) => {
    if (!currentUser) {
      console.warn('Cannot add log: No current user');
      return;
    }

    const log: AuditLog = {
      id: `log-${Date.now()}`, 
      action, 
      entity, 
      entityId, 
      details,
      userId: currentUser?.id || 'unknown', 
      timestamp: new Date().toISOString()
    };
    
    setAuditLogs(prev => [...prev, log]);
    
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('audit_logs').insert([toDBLog(log)]);
    }
  }, [currentUser]);

  const switchUser = useCallback((role: UserRole, branchId?: 'branch_1' | 'branch_2') => {
    setCurrentUser(prev => prev ? { ...prev, role, branchId } : null);
    toast.info(`Switched perspective to ${role.replace('_', ' ')}`);
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: UserRole, branchId?: 'branch_1' | 'branch_2') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role, branch_id: branchId })
        .eq('id', userId);
      
      if (error) throw error;
      
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role, branchId } : u));
      toast.success('User role updated successfully');
      
      // If we updated our own role, update current user too
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, role, branchId } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  }, [currentUser]);

  const selectProfile = useCallback((profile: User) => {
    setSelectedProfile(profile);
    localStorage.setItem('bakewise_selected_profile', JSON.stringify(profile));
    setIsProfileLocked(true);
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    if (selectedProfile && selectedProfile.pinCode === pin) {
      setIsProfileLocked(false);
      return true;
    }
    return false;
  }, [selectedProfile]);

  const lockProfile = useCallback(() => {
    setIsProfileLocked(true);
  }, []);

  const updateUserPin = useCallback(async (userId: string, pin: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pin_code: pin })
        .eq('id', userId);
      
      if (error) throw error;
      
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, pinCode: pin } : u));
      toast.success('User PIN updated successfully');
      
      if (selectedProfile?.id === userId) {
        setSelectedProfile(prev => prev ? { ...prev, pinCode: pin } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update PIN');
    }
  }, [selectedProfile]);

  const createStaffMember = async (name: string, email: string, password: string, role: UserRole, branchId?: string, pin?: string) => {
    try {
      if (!currentUser) throw new Error('Must be logged in to create profiles');

      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          account_id: currentUser.id,
          name,
          email,
          role,
          branch_id: branchId,
          pin_code: pin || '0000'
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        toast.success(`Profile ${name} created successfully!`);
        fetchAllUsers(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    }
  };

  const clearSales = useCallback(async (range: 'today' | 'weekly' | 'monthly' | 'all') => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    setSales(prev => {
      if (range === 'all') return [];
      return prev.filter(sale => {
        const saleDate = new Date(sale.date);
        if (range === 'today') return sale.date !== today;
        if (range === 'weekly') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate < oneWeekAgo;
        }
        if (range === 'monthly') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return saleDate < oneMonthAgo;
        }
        return true;
      });
    });
    
    addLog('clear', 'sales', range, `Cleared ${range} sales records`);
    toast.success(`Cleared ${range} sales records`);
  }, [addLog]);

  const clearAllReportData = useCallback(() => {
    setSales([]);
    setBatches([]);
    setExpenses([]);
    addLog('clear', 'reports', 'all', 'Cleared all sales, production, and expense records');
    toast.success('All report data cleared');
  }, [addLog]);

  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => {
    const id = `p${Date.now()}`;
    const newProduct = { ...p, id, isActive: true, createdAt: new Date().toISOString().slice(0, 10) };
    
    setProducts(prev => [...prev, newProduct]);
    
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('products').insert([toDBProduct(newProduct)]);
    }
    
    addLog('create', 'product', id, `Created product: ${p.name}`);
    toast.success(`Product "${p.name}" created`);
  }, [addLog]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (navigator.onLine && hasSupabaseConfig) {
      const product = products.find(p => p.id === id);
      if (product) {
        await supabase.from('products').update(toDBProduct({ ...product, ...updates })).eq('id', id);
      }
    }
    addLog('update', 'product', id, `Updated product: ${updates.name || id}`);
    toast.success(`Product updated successfully`);
  }, [products, addLog]);

  const deleteProduct = useCallback(async (id: string, soft = true) => {
    if (soft) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
      if (navigator.onLine && hasSupabaseConfig) {
        await supabase.from('products').update({ is_active: false }).eq('id', id);
      }
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (navigator.onLine && hasSupabaseConfig) {
        await supabase.from('products').delete().eq('id', id);
      }
    }
    addLog('delete', 'product', id, `${soft ? 'Soft deleted' : 'Deleted'} product: ${id}`);
    toast.success(`Product deleted successfully`);
  }, [addLog]);


  const createDispatch = useCallback(async (destination: DispatchDestination, items: DispatchItem[], paymentMethod: PaymentMethod = 'cash', customerName?: string, customerPhone?: string) => {
    for (const item of items) {
      const available = stock[item.productId]?.production || 0;
      if (item.quantity > available) {
        toast.error(`Insufficient stock for dispatch`);
        return false;
      }
    }
    const id = `d${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    const todayDispatches = dispatches.filter(d => d.date === today);
    const tokenNumber = todayDispatches.length + 1;

    const dispatch: Dispatch = { 
      id, destination, date: today, 
      status: 'confirmed', items,
      tokenNumber,
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };
    
    setDispatches(prev => [...prev, dispatch]);

    if (isOnline && hasSupabaseConfig) {
      await supabase.from('dispatches').insert([toDBDispatch(dispatch)]);
    }

    if (destination === 'walkin') {
      const saleItems: SaleItem[] = items.map(i => {
        const product = products.find(p => p.id === i.productId);
        return { productId: i.productId, quantity: i.quantity, unitPrice: product?.price || 0 };
      });
      const total = saleItems.reduce((sum, si) => sum + si.quantity * si.unitPrice, 0);
      const walkinSale: Sale = {
        id: `s${Date.now()}`, type: 'factory_walkin', items: saleItems,
        total, paymentMethod: paymentMethod, 
        customerName, customerPhone, isCreditPaid: paymentMethod === 'cash' || paymentMethod === 'card',
        date: new Date().toISOString().slice(0, 10),
        syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
      };
      
      setSales(prev => [...prev, walkinSale]);
      if (isOnline && hasSupabaseConfig) {
        const { error } = await supabase.from('sales').insert([toDBSale(walkinSale)]);
        if (error) {
          setSales(prev => prev.map(s => s.id === walkinSale.id ? { ...s, syncStatus: 'pending' } : s));
        }
      }
      return walkinSale.id;
    }

    addLog('create', 'dispatch', id, `Created dispatch to ${destination} (Token #${tokenNumber})`);
    toast.success(`Dispatch recorded (Token #${tokenNumber})`);
    return true;
  }, [stock, products, dispatches, isOnline, addLog, hasSupabaseConfig]);

  const payCreditSale = useCallback(async (id: string) => {
    setSales(prev => prev.map(s => s.id === id ? { ...s, isCreditPaid: true, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' } : s));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('sales').update({ is_credit_paid: true }).eq('id', id);
    }
    toast.success('Credit payment recorded');
  }, [isOnline]);

  const createSale = useCallback(async (type: SaleType, branch: 'branch_1' | 'branch_2' | undefined, items: SaleItem[], paymentMethod: PaymentMethod) => {
    if (type === 'branch' && branch) {
      for (const item of items) {
        const available = stock[item.productId]?.[branch] || 0;
        // Removed strict stock validation to allow "always available for selling"
        // if (item.quantity > available) {
        //   toast.error(`Insufficient stock at ${branch.replace('_', ' ')}`);
        //   return false;
        // }
      }
    }

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const id = `s${Date.now()}`;
    const newSale: Sale = { 
      id, type, branch, items, total, paymentMethod, 
      date: new Date().toISOString().slice(0, 10),
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };
    
    setSales(prev => [...prev, newSale]);

    if (isOnline && hasSupabaseConfig) {
      const { error } = await supabase.from('sales').insert([toDBSale(newSale)]);
      if (error) {
        setSales(prev => prev.map(s => s.id === id ? { ...s, syncStatus: 'pending' } : s));
      }
    }

    addLog('create', 'sale', id, `Sale of Rs. ${total.toFixed(2)} at ${branch || 'factory'}`);
    toast.success(isOnline ? `Sale recorded: Rs. ${total.toFixed(2)}` : `Sale saved offline: Rs. ${total.toFixed(2)}`);
    return id;
  }, [stock, addLog, isOnline]);

  const refundSale = useCallback(async (id: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return false;
    
    setSales(prev => prev.filter(s => s.id !== id));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('sales').delete().eq('id', id);
    }
    addLog('delete', 'sale', id, `Refunded/Deleted sale: ${id} at ${sale.branch || 'factory'}`);
    toast.success(`Sale refunded successfully`);
    return true;
  }, [sales, addLog, isOnline]);

  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const id = `e${Date.now()}`;
    const newExpense: Expense = { 
      ...e, 
      id, 
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };
    setExpenses(prev => [...prev, newExpense]);
    
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('expenses').insert([toDBExpense(newExpense)]);
    }
    
    addLog('create', 'expense', id, `Expense: ${e.title} - Rs. ${e.amount}`);
    toast.success(isOnline ? `Expense recorded: ${e.amount}` : `Expense saved offline: ${e.amount}`);
  }, [addLog, isOnline]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' } : e));
    if (navigator.onLine && hasSupabaseConfig) {
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        await supabase.from('expenses').update(toDBExpense({ ...expense, ...updates, syncStatus: 'synced' })).eq('id', id);
      }
    }
    addLog('update', 'expense', id, `Updated expense: ${id}`);
    toast.success(`Expense updated successfully`);
  }, [expenses, addLog, isOnline]);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    addLog('delete', 'expense', id, `Deleted expense: ${id}`);
    toast.success(`Expense deleted successfully`);
  }, [addLog, isOnline]);

  const addPurchase = useCallback(async (p: Omit<Purchase, 'id' | 'syncStatus'>) => {
    const id = `pur${Date.now()}`;
    const newPurchase: Purchase = {
      ...p,
      id,
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };

    // 1. Add to purchases state
    setPurchases(prev => [...prev, newPurchase]);

    // 2. Update material stock automatically
    setRawMaterials(prev => prev.map(m => 
      m.id === p.materialId 
        ? { ...m, currentStock: m.currentStock + p.quantity, lastUpdated: new Date().toISOString() } 
        : m
    ));

    // 3. Sync to DB if online
    if (isOnline && hasSupabaseConfig) {
      try {
        const { error } = await supabase.from('purchases').insert([toDBPurchase(newPurchase)]);
        if (error) throw error;

        // Also update material stock in DB
        const currentMaterial = rawMaterials.find(m => m.id === p.materialId);
        if (currentMaterial) {
          await supabase.from('raw_materials')
            .update({ current_stock: currentMaterial.currentStock + p.quantity, last_updated: new Date().toISOString() })
            .eq('id', p.materialId);
        }
      } catch (err) {
        console.error('Purchase sync error:', err);
        setPurchases(prev => prev.map(item => item.id === id ? { ...item, syncStatus: 'pending' } : item));
      }
    }

    addLog('create', 'purchase', id, `Purchased ${p.quantity} from ${p.vendorName}`);
    toast.success(`Purchase recorded and stock updated!`);
  }, [addLog, isOnline, hasSupabaseConfig, rawMaterials]);

  // RECIPES
  const addRecipe = useCallback(async (r: Omit<Recipe, 'id' | 'syncStatus'>) => {
    const id = `rec${Date.now()}`;
    const newRecipe: Recipe = {
      ...r,
      id,
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };
    setRecipes(prev => [...prev, newRecipe]);
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('recipes').insert([toDBRecipe(newRecipe)]);
    }
    toast.success(`Recipe saved!`);
  }, [isOnline]);

  const updateRecipe = useCallback(async (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' } : r));
    if (isOnline && hasSupabaseConfig) {
      const recipe = recipes.find(r => r.id === id);
      if (recipe) {
        await supabase.from('recipes').update(toDBRecipe({ ...recipe, ...updates, syncStatus: 'synced' })).eq('id', id);
      }
    }
    toast.success(`Recipe updated!`);
  }, [recipes, isOnline]);

  const deleteRecipe = useCallback(async (id: string) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('recipes').delete().eq('id', id);
    }
    toast.success(`Recipe deleted!`);
  }, [isOnline]);

  const addRawMaterial = useCallback(async (m: Omit<RawMaterial, 'id' | 'lastUpdated' | 'isActive' | 'currentStock'>) => {
    const id = `rm${Date.now()}`;
    const newRM: RawMaterial = {
      ...m,
      id,
      currentStock: 0,
      isActive: true,
      lastUpdated: new Date().toISOString()
    };
    setRawMaterials(prev => [...prev, newRM]);
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('raw_materials').insert([toDBRawMaterial(newRM)]);
    }
    addLog('create', 'raw_material', id, `Added raw material: ${m.name}`);
    toast.success(`Raw material "${m.name}" added`);
  }, [addLog]);

  const updateRawMaterial = useCallback(async (id: string, updates: Partial<RawMaterial>) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updates, lastUpdated: new Date().toISOString() } : m));
    if (navigator.onLine && hasSupabaseConfig) {
      const material = rawMaterials.find(m => m.id === id);
      if (material) {
        await supabase.from('raw_materials').update(toDBRawMaterial({ ...material, ...updates, lastUpdated: new Date().toISOString() })).eq('id', id);
      }
    }
    addLog('update', 'raw_material', id, `Updated raw material: ${id}`);
    toast.success(`Raw material updated`);
  }, [rawMaterials, addLog]);

  const deleteRawMaterial = useCallback(async (id: string) => {
    setRawMaterials(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('raw_materials').update({ is_active: false }).eq('id', id);
    }
    addLog('delete', 'raw_material', id, `Soft deleted raw material: ${id}`);
    toast.success(`Raw material deleted`);
  }, [addLog]);

  const adjustRawMaterialStock = useCallback(async (materialId: string, type: StockAdjustmentType, quantity: number, reason?: string) => {
    const material = rawMaterials.find(m => m.id === materialId);
    if (!material) return false;

    if (type === 'out' && material.currentStock < quantity) {
      toast.error(`Insufficient stock for ${material.name}`);
      return false;
    }

    const newStock = type === 'in' ? material.currentStock + quantity : material.currentStock - quantity;
    const adjId = `rma${Date.now()}`;
    const newAdj: RawMaterialAdjustment = {
      id: adjId,
      materialId,
      type,
      quantity,
      reason,
      date: new Date().toISOString().slice(0, 10),
      userId: currentUser?.id || 'unknown',
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };

    setRawMaterials(prev => prev.map(m => m.id === materialId ? { ...m, currentStock: newStock, lastUpdated: new Date().toISOString() } : m));
    setRawMaterialAdjustments(prev => [...prev, newAdj]);

    if (isOnline && hasSupabaseConfig) {
      await Promise.all([
        supabase.from('raw_materials').update({ current_stock: newStock, last_updated: new Date().toISOString() }).eq('id', materialId),
        supabase.from('raw_material_adjustments').insert([toDBRawAdjustment(newAdj)])
      ]);
    }

    toast.success(`Stock adjusted for ${material.name}`);
    return true;
  }, [rawMaterials, currentUser, isOnline, addLog]);

  const adjustBranchStock = useCallback(async (productId: string, branch: 'branch_1' | 'branch_2', quantity: number, reason: string) => {
    const id = `bsa${Date.now()}`;
    const newAdj: BranchStockAdjustment = {
      id,
      productId,
      branch,
      quantity, // this is the amount to SUBTRACT from the branch stock
      reason,
      date: new Date().toISOString().slice(0, 10),
      userId: currentUser?.id || 'unknown'
    };

    setBranchStockAdjustments(prev => [...prev, newAdj]);
    
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('branch_stock_adjustments').insert([toDBBranchAdjustment(newAdj)]);
    }
    
    addLog('adjust', 'branch_stock', productId, `Adjusted ${branch} stock by -${quantity}. Reason: ${reason}`);
    toast.success(`Stock adjusted by -${quantity}`);
  }, [currentUser, addLog, isOnline]);

  const addProduction = useCallback(async (productId: string, quantity: number, notes?: string) => {
    const batchId = `BATCH-${String(batches.length + 1).padStart(3, '0')}`;
    
    // Check Recipe and calculate deductions
    const recipe = recipes.find(r => r.productId === productId && r.isActive);
    if (recipe) {
      // PRE-CHECK: Ensure we have enough stock before starting deductions
      for (const ing of recipe.ingredients) {
        const material = rawMaterials.find(m => m.id === ing.materialId);
        const needed = ing.quantity * quantity;
        if (!material || material.currentStock < needed) {
          toast.error(`Insufficient ${material?.name || 'Raw Material'}! Need ${needed}${material?.unit || ''}.`);
          return false; // Prevent production
        }
      }

      // EXECUTE DEDUCTIONS
      for (const ing of recipe.ingredients) {
        const needed = ing.quantity * quantity;
        await adjustRawMaterialStock(ing.materialId, 'out', needed, `Auto-deducted for Production: ${batchId}`);
      }
    }

    const id = `b${Date.now()}`;
    const newBatch: ProductionBatch = { 
      id, batchId, productId, quantity, 
      date: new Date().toISOString().slice(0, 10), 
      notes,
      syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending'
    };
    
    setBatches(prev => [...prev, newBatch]);

    if (isOnline && hasSupabaseConfig) {
      await supabase.from('production_batches').insert([toDBBatch(newBatch)]);
    }

    addLog('create', 'production', id, `Produced ${quantity} units (Batch: ${batchId})`);
    toast.success(isOnline ? `Production recorded: ${quantity} units` : `Production saved offline: ${quantity} units`);
    return true;
  }, [batches.length, addLog, isOnline, recipes, rawMaterials, adjustRawMaterialStock]);

  const updateProduction = useCallback(async (id: string, updates: Partial<ProductionBatch>) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' } : b));
    if (navigator.onLine && hasSupabaseConfig) {
      const batch = batches.find(b => b.id === id);
      if (batch) {
        await supabase.from('production_batches').update(toDBBatch({ ...batch, ...updates, syncStatus: 'synced' })).eq('id', id);
      }
    }
    addLog('update', 'production', id, `Updated production batch: ${id}`);
    toast.success(`Production batch updated successfully`);
  }, [batches, addLog, isOnline]);

  const deleteProduction = useCallback(async (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('production_batches').delete().eq('id', id);
    }
    addLog('delete', 'production', id, `Deleted production batch: ${id}`);
    toast.success(`Production batch deleted successfully`);
  }, [addLog, isOnline]);

  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);

  const getInventorySnapshots = useCallback((): InventorySnapshot[] => {
    return products.map(p => {
      const s = stock[p.id] || { production: 0, branch_1: 0, branch_2: 0 };
      const totalProduced = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.quantity, 0);
      const totalDispatched = dispatches.flatMap(d => d.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
      const totalSold = sales.flatMap(sl => sl.items).filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
      return {
        productId: p.id, totalProduced, totalDispatched, totalSold,
        productionStock: s.production, branch1Stock: s.branch_1, branch2Stock: s.branch_2
      };
    });
  }, [products, stock, batches, dispatches, sales]);

  const getTodaySales = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sales.filter(s => s.date === today);
  }, [sales]);

  const getBranchStock = useCallback((branch: 'branch_1' | 'branch_2') => {
    const dispatchedProductIds = new Set<string>();
    dispatches.forEach(d => {
      if (d.destination === branch) {
        d.items.forEach(i => dispatchedProductIds.add(i.productId));
      }
    });
    return products
      .filter(p => dispatchedProductIds.has(p.id) || (stock[p.id]?.[branch] || 0) !== 0)
      .map(p => ({ productId: p.id, stock: stock[p.id]?.[branch] || 0 }));
  }, [products, stock, dispatches]);

  const getProductionStock = useCallback(() => {
    return products.map(p => ({ productId: p.id, stock: stock[p.id]?.production || 0 })).filter(s => s.stock > 0);
  }, [products, stock]);

  const addStaffMember = useCallback(async (s: Omit<StaffMember, 'id' | 'isActive' | 'createdAt'>) => {
    const id = `st-${Date.now()}`;
    const newStaff: StaffMember = { ...s, id, isActive: true, createdAt: new Date().toISOString().slice(0, 10) };
    setStaff(prev => [...prev, newStaff]);
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('staff_members').insert([toDBStaff(newStaff)]);
    }
    addLog('create', 'staff', id, `Added staff member: ${s.name}`);
    toast.success(`Staff member "${s.name}" added`);
  }, [addLog]);

  const updateStaffMember = useCallback(async (id: string, updates: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (navigator.onLine && hasSupabaseConfig) {
      const staffMember = staff.find(s => s.id === id);
      if (staffMember) {
        await supabase.from('staff_members').update(toDBStaff({ ...staffMember, ...updates })).eq('id', id);
      }
    }
    addLog('update', 'staff', id, `Updated staff member: ${id}`);
    toast.success(`Staff updated`);
  }, [staff, addLog]);

  const deleteStaffMember = useCallback(async (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('staff_members').update({ is_active: false }).eq('id', id);
    }
    addLog('delete', 'staff', id, `Soft deleted staff member: ${id}`);
    toast.success(`Staff member deleted`);
  }, [addLog]);

  const addStaffDeduction = useCallback(async (d: Omit<StaffDeduction, 'id' | 'syncStatus'>) => {
    const id = `sd-${Date.now()}`;
    const newDeduction: StaffDeduction = { ...d, id, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' };
    setStaffDeductions(prev => [...prev, newDeduction]);
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('staff_deductions').insert([toDBDeduction(newDeduction)]);
    }
    addLog('create', 'staff_deduction', id, `Deduction for staff ${d.staffId}: Rs. ${d.amount}`);
    toast.success(`Deduction/Advance recorded`);
  }, [addLog, isOnline]);

  const updateStaffDeduction = useCallback(async (id: string, updates: Partial<StaffDeduction>) => {
    setStaffDeductions(prev => prev.map(d => d.id === id ? { ...d, ...updates, syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' } : d));
    if (navigator.onLine && hasSupabaseConfig) {
       const deduction = staffDeductions.find(d => d.id === id);
       if (deduction) {
         await supabase.from('staff_deductions').update(toDBDeduction({ ...deduction, ...updates, syncStatus: 'synced' })).eq('id', id);
       }
    }
    toast.success(`Deduction updated`);
  }, [staffDeductions, isOnline]);

  const deleteStaffDeduction = useCallback(async (id: string) => {
    setStaffDeductions(prev => prev.filter(d => d.id !== id));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('staff_deductions').delete().eq('id', id);
    }
    toast.success(`Deduction deleted`);
  }, []);

  const createSalaryVoucher = useCallback(async (v: Omit<SalaryVoucher, 'id' | 'syncStatus' | 'status'>) => {
    const id = `sv-${Date.now()}`;
    const newVoucher: SalaryVoucher = { ...v, id, status: 'paid', syncStatus: isOnline && hasSupabaseConfig ? 'synced' : 'pending' };
    setSalaryVouchers(prev => [...prev, newVoucher]);
    if (isOnline && hasSupabaseConfig) {
      await supabase.from('salary_vouchers').insert([toDBVoucher(newVoucher)]);
    }
    addLog('create', 'salary_voucher', id, `Salary paid to staff ${v.staffId}: Rs. ${v.amount}`);
    toast.success(`Salary payment recorded`);
  }, [addLog, isOnline]);

  const deleteSalaryVoucher = useCallback(async (id: string) => {
    setSalaryVouchers(prev => prev.filter(v => v.id !== id));
    if (navigator.onLine && hasSupabaseConfig) {
      await supabase.from('salary_vouchers').delete().eq('id', id);
    }
    toast.success(`Salary voucher deleted`);
  }, []);

  const logout = async () => {
    // Only clear auth state — NEVER touch business data (sales, expenses, etc.)
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSelectedProfile(null);
    setIsProfileLocked(true);
    localStorage.removeItem('bakewise_selected_profile');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Business data in STORAGE_KEY is intentionally preserved
    toast.success('Logged out successfully');
  };


  const updateReceiptSettings = useCallback(async (settings: Partial<ReceiptSettings>) => {
    const updatedSettings = { ...receiptSettings, ...settings, isLocked: true };
    setReceiptSettings(updatedSettings);
    
    if (isOnline && hasSupabaseConfig) {
      try {
        await supabase
          .from('app_settings')
          .upsert({ id: 'receipt_config', settings: updatedSettings, updated_at: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to sync settings to cloud:', error);
      }
    }
    
    toast.success('Receipt information saved permanently to cloud');
    addLog('update', 'receipt_settings', 'system', 'Locked and synced receipt information');
  }, [addLog, isOnline, receiptSettings]);

  return (
    <AppContext.Provider value={{
      currentUser,
      selectedProfile,
      isProfileLocked,
      products,
      rawMaterials,
      rawMaterialAdjustments,
      batches,
      dispatches,
      sales,
      expenses,
      auditLogs,
      stock,
      allUsers,
      isOnline,
      lastSyncTime,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
      adjustRawMaterialStock,
      branchStockAdjustments,
      adjustBranchStock,
      addProduction,
      updateProduction,
      deleteProduction,
      createDispatch,
      createSale,
      refundSale,
      addExpense,
      updateExpense,
      deleteExpense,
      getProductById,
      getInventorySnapshots,
      getTodaySales,
      getBranchStock,
      getProductionStock,
      clearSales,
      clearAllReportData,
      selectProfile,
      verifyPin,
      lockProfile,
      switchUser,
      updateUserRole,
      updateUserPin,
      createStaffMember,
      forceSync,
      seedDatabase,
      logout,
      receiptSettings,
      updateReceiptSettings,
      staff,
      staffDeductions,
      salaryVouchers,
      addStaffMember,
      updateStaffMember,
      deleteStaffMember,
      addStaffDeduction,
      updateStaffDeduction,
      deleteStaffDeduction,
      createSalaryVoucher,
      deleteSalaryVoucher,
      payCreditSale,
      purchases,
      addPurchase,
      addRecipe,
      updateRecipe,
      deleteRecipe,
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
