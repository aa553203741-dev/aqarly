// أنواع البيانات — تعكس مخطّط قاعدة البيانات

export type Role = "broker" | "admin";
export type Plan = "free" | "premium";
export type DealType = "buy" | "rent";
export type LeadStatus = "new" | "in_progress" | "done" | "rejected";
export type ListingStatus = "active" | "closed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  plan: Plan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientLead {
  id: string;
  broker_user_id: string;
  client_name: string;
  phone: string;
  deal_type: DealType;
  property_type: string;
  property_type_other: string;
  city: string;
  district: string;
  budget: number | null;
  notes: string;
  status: LeadStatus;
  created_at: string;
}

export interface Listing {
  id: string;
  broker_user_id: string;
  title: string;
  deal_type: DealType;
  property_type: string;
  city: string;
  district: string;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  notes: string;
  status: ListingStatus;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referred_email: string | null;
  referrer_code: string | null;
  status: "pending" | "earned" | "rewarded";
  created_at: string;
  earned_at: string | null;
}

export interface BrokerCode {
  user_id: string;
  code: string;
  created_at: string;
}
