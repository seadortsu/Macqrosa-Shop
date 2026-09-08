export interface Variant {
  id: number;
  product_id: number;
  sku: string | null;
  variant_label: string;
  variant_type: string;
  price_modifier: number;
  stock: number;
  image_url: string | null;
  is_default: number;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  discipline: string;
  price: number;
  compare_at_price: number | null;
  rating: number;
  reviews_count: number;
  description: string;
  benefits?: string;
  ingredients?: string;
  sensorial_fragrance?: string;
  sensorial_texture?: string;
  sensorial_finish?: string;
  clinical_metric_1_val?: string;
  clinical_metric_1_lbl?: string;
  clinical_metric_2_val?: string;
  clinical_metric_2_lbl?: string;
  volume: string;
  stock: number;
  image_url: string;
  gallery: string[];
  shades?: { name: string; hex: string }[];
  is_featured: number;
  is_bestseller: number;
  reviews?: Review[];
  variants?: Variant[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  customer_name: string;
  customer_tier: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

export interface CustomerAddress {
  id: number;
  customer_id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: number;
}

export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tier: string;
  points: number;
  totalSpent: number;
  ordersCount: number;
  createdAt?: string;
  addresses?: CustomerAddress[];
}

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_title: string;
  product_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_email: string;
  customer_name: string;
  shipping_address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shipping_fee: number;
  tax: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string;
  payment_status: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: { name: string; hex: string };
}

export interface InventoryItem extends Product {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  valuation: number;
}

export interface InventorySummary {
  totalStockCount: number;
  totalInventoryValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSKUs: number;
  lowStockThreshold: number;
}

export interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    revenueGrowth: string;
    totalOrders: number;
    ordersGrowth: string;
    averageOrderValue: number;
    aovGrowth: string;
    conversionRate: number;
    conversionGrowth: string;
    totalCustomers: number;
  };
  chartData: { label: string; revenue: number; orders: number }[];
  recentOrders: {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
  topProducts: {
    id: number;
    title: string;
    category: string;
    price: number;
    stock: number;
    image_url: string;
    units_sold: number;
    revenue: number;
  }[];
  orderStatusMap: Record<string, number>;
}
