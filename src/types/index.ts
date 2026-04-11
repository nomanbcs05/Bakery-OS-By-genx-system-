export type UserRole = 'admin' | 'production_manager' | 'branch_staff' | 'accountant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: 'branch_1' | 'branch_2';
  pinCode?: string;
  avatarUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit?: number;
  supplierName?: string;
  isActive: boolean;
  lastUpdated: string;
}

export type StockAdjustmentType = 'in' | 'out';

export interface RawMaterialAdjustment {
  id: string;
  materialId: string;
  type: StockAdjustmentType;
  quantity: number;
  reason?: string;
  date: string;
  userId: string;
  syncStatus: 'synced' | 'pending';
}

export interface ProductionBatch {
  id: string;
  batchId: string;
  productId: string;
  quantity: number;
  date: string;
  notes?: string;
  syncStatus: 'synced' | 'pending';
}

export type DispatchDestination = 'branch_1' | 'branch_2' | 'walkin';

export interface Dispatch {
  id: string;
  destination: DispatchDestination;
  date: string;
  status: 'pending' | 'confirmed';
  items: DispatchItem[];
  syncStatus: 'synced' | 'pending';
}

export interface DispatchItem {
  productId: string;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'credit';
export type SaleType = 'branch' | 'factory_walkin';

export interface Sale {
  id: string;
  type: SaleType;
  branch?: 'branch_1' | 'branch_2';
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  syncStatus: 'synced' | 'pending';
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  branchId?: 'branch_1' | 'branch_2' | 'factory';
  syncStatus: 'synced' | 'pending';
}

export interface InventorySnapshot {
  productId: string;
  totalProduced: number;
  totalDispatched: number;
  totalSold: number;
  productionStock: number;
  branch1Stock: number;
  branch2Stock: number;
}

export interface BranchStockAdjustment {
  id: string;
  productId: string;
  branch: 'branch_1' | 'branch_2';
  quantity: number; // always positive, represents items removed
  reason: string;
  date: string;
  userId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  userId: string;
  timestamp: string;
}

// Database helper types for snake_case conversion
export interface DBProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export interface DBProductionBatch {
  id: string;
  batch_id: string;
  product_id: string;
  quantity: number;
  date: string;
  notes?: string;
  sync_status: 'synced' | 'pending';
}

export interface DBSale {
  id: string;
  type: SaleType;
  branch?: 'branch_1' | 'branch_2';
  items: SaleItem[];
  total: number;
  payment_method: PaymentMethod;
  date: string;
  sync_status: 'synced' | 'pending';
}

export interface DBExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  branch_id?: 'branch_1' | 'branch_2' | 'factory';
  sync_status: 'synced' | 'pending';
}

export interface DBDispatch {
  id: string;
  destination: DispatchDestination;
  date: string;
  status: 'pending' | 'confirmed';
  items: DispatchItem[];
  sync_status: 'synced' | 'pending';
}

export interface DBAuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  user_id: string;
  timestamp: string;
}

export interface DBRawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  cost_per_unit?: number;
  supplier_name?: string;
  is_active: boolean;
  last_updated: string;
}

export interface DBRawMaterialAdjustment {
  id: string;
  material_id: string;
  type: StockAdjustmentType;
  quantity: number;
  reason?: string;
  date: string;
  user_id: string;
  sync_status: 'synced' | 'pending';
}

export interface DBBranchStockAdjustment {
  id: string;
  product_id: string;
  branch: 'branch_1' | 'branch_2';
  quantity: number;
  reason: string;
  date: string;
  user_id: string;
  sync_status: 'synced' | 'pending';
}

export interface ReceiptSettings {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  phone: string;
  footerMessage1: string;
  footerMessage2: string;
  printedBy: string;
  branch1Location: string;
  branch1OnlineOrder: string;
  branch2Location: string;
  branch2OnlineOrder: string;
  branch1Cashier: string;
  branch2Cashier: string;
}

export interface StaffMember {
  id: string;
  name: string;
  department: string;
  baseSalary: number;
  isActive: boolean;
  createdAt: string;
}

export interface StaffDeduction {
  id: string;
  staffId: string;
  amount: number;
  reason: string;
  date: string;
  syncStatus: 'synced' | 'pending';
}

export interface SalaryVoucher {
  id: string;
  staffId: string;
  amount: number;
  month: string;
  year: number;
  date: string;
  status: 'paid';
  syncStatus: 'synced' | 'pending';
}

export interface DBStaffMember {
  id: string;
  name: string;
  department: string;
  base_salary: number;
  is_active: boolean;
  created_at: string;
}

export interface DBStaffDeduction {
  id: string;
  staff_id: string;
  amount: number;
  reason: string;
  date: string;
  sync_status: 'synced' | 'pending';
}

export interface DBSalaryVoucher {
  id: string;
  staff_id: string;
  amount: number;
  month: string;
  year: number;
  date: string;
  status: 'paid';
  sync_status: 'synced' | 'pending';
}
