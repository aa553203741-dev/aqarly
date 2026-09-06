// أنواع بيانات المخزون (المرحلة 2/3)

export type ProjectStatus = "ready" | "under_construction" | "off_plan";
export type UnitStatus = "available" | "reserved" | "sold" | "unavailable";
export type ReservationStage =
  | "reserved"
  | "documents"
  | "down_payment"
  | "paying"
  | "paid"
  | "closed"
  | "cancelled";

export interface Developer {
  id: string;
  org_id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  sales_rep_name: string | null;
  sales_rep_phone: string | null;
  website: string | null;
  notes: string;
  created_at: string;
}

export interface District {
  id: string;
  org_id: string;
  city: string;
  zone: string;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
}

export interface Project {
  id: string;
  org_id: string;
  developer_id: string | null;
  district_id: string | null;
  name: string;
  description: string;
  status: ProjectStatus;
  cover_image: string | null;
  images: string[];
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  default_commission_amount: number | null;
  created_at: string;
  updated_at: string;
  // حقول مُنضمّة (من الاستعلام)
  developer?: { name: string } | null;
  district?: { city: string; zone: string; name: string } | null;
}

export interface UnitModel {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  bedrooms: number | null;
  area: number | null;
  bathrooms: number | null;
  majlis: boolean;
  hall: boolean;
  kitchen: boolean;
  maid_room: boolean;
  balcony: boolean;
  floor_plan_url: string | null;
  extra_features: Record<string, unknown>;
  notes: string;
  created_at: string;
}

export interface Unit {
  id: string;
  org_id: string;
  project_id: string;
  model_id: string | null;
  unit_no: string;
  floor: number | null;
  building_no: string | null;
  price: number | null;
  discount_price: number | null;
  status: UnitStatus;
  view: string | null;
  direction: string | null;
  parking_no: string | null;
  storage_no: string | null;
  commission_amount: number | null;
  notes: string;
  updated_at: string;
}

export interface DistrictStat {
  district_id: string;
  city: string;
  zone: string;
  district_name: string;
  projects_count: number;
  available_units: number;
}

export interface ProjectStat {
  project_id: string;
  total_units: number;
  available_units: number;
  start_price: number | null;
  min_area: number | null;
  max_area: number | null;
  min_bed: number | null;
  max_bed: number | null;
}

export interface UserPermissions {
  user_id: string;
  can_reserve: boolean;
  can_process_payments: boolean;
  can_close_deals: boolean;
  can_manage_inventory: boolean;
  can_view_all_commissions: boolean;
}
