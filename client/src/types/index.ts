export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  tax_name: string;
  tax_rate: number;
  currency: string;
  currency_symbol: string;
  invoice_prefix: string;
  receipt_prefix: string;
  payment_terms: string;
  notes?: string;
  bank_name?: string;
  bank_account?: string;
  bank_routing?: string;
  signature_url?: string;
  quote_prefix?: string;
  paypal_email?: string;
  mpesa_number?: string;
  mtn_number?: string;
  airtel_number?: string;
  telecel_number?: string;
  whatsapp_number?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
  dkim_domain?: string;
  dkim_selector?: string;
  dkim_private_key?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  org_id: string;
  type: 'invoice' | 'receipt' | 'quote';
  number: string;
  status: 'none' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'accepted' | 'declined' | 'expired' | 'invoiced';
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  subtotal: number;
  discount_type: 'none' | 'percent' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  currency_symbol: string;
  notes?: string;
  terms?: string;
  footer_text?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  client_zip?: string;
  client_company?: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  company?: string;
  notes?: string;
  created_at: string;
}

export interface Quote {
  id: string;
  org_id: string;
  number: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'invoiced';
  issue_date: string;
  expiry_date?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  created_at: string;
}

export interface AISuggestion {
  items: InvoiceItem[];
  notes: string;
  terms: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}
