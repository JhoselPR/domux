// Supabase types for the Domux application

export type UserRole = 'admin' | 'member';
export type TaskStatus = 'pending' | 'completed';
export type PeriodType = 'weekly' | 'biweekly' | 'monthly';
export type ExpenseCategory = 'electricity' | 'phone' | 'internet' | 'water' | 'gas' | 'rent' | 'other';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  profile_id: string;
  role: UserRole;
  joined_at: string;
  // Joined data
  profile?: Profile;
  household?: Household;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  due_date: string | null;
  is_recurring: boolean;
  recurring_days: WeekDay[];
  created_by: string;
  created_at: string;
  // Joined data
  assignee?: Profile;
}

export interface PantryItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  is_bought: boolean;
  price: number | null;
  added_by: string;
  bought_at: string | null;
  created_at: string;
  // Joined data
  added_by_profile?: Profile;
}

export interface Expense {
  id: string;
  household_id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface Budget {
  id: string;
  household_id: string;
  period_type: PeriodType;
  amount: number;
  created_at: string;
  updated_at: string;
}
