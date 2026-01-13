// Database types based on Supabase schema

export type UserRole = 'customer' | 'admin' | 'seller';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refunded';

export type PaymentMethod =
  | 'cod'
  | 'bank_transfer'
  | 'ewallet'
  | 'credit_card'
  | 'virtual_account';

export type ShippingMethod =
  | 'jne'
  | 'jnt'
  | 'sicepat'
  | 'gojek'
  | 'grab'
  | 'pos'
  | 'tiki';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  parent?: Category | null;
  children?: Category[];
  _count?: { products: number };
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku: string;
  barcode: string | null;
  stock: number;
  low_stock_threshold: number;
  weight: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_digital: boolean;
  meta_title: string | null;
  meta_description: string | null;
  avg_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  shipping_notes: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_method: ShippingMethod | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  paid_at: string | null;
  status: OrderStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  cancel_reason: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
  // Relations
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
  product?: Product;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  address_line: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Relations
  product?: Product;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrderStatusData {
  status: OrderStatus;
  count: number;
}

export interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  low_stock_threshold: number;
  image_url: string | null;
}
