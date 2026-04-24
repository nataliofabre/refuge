// Minimal types matching the SQL schema — extend as needed.

export type UserRole = "patient" | "practitioner" | "admin";
export type GoalType = "risk_reduction" | "total_stop" | "financial" | "sleep" | "other";
export type ConsumptionCategory =
  | "alcohol"
  | "tobacco"
  | "cannabis"
  | "other_substance"
  | "behavior";
export type EmotionState =
  | "stress"
  | "boredom"
  | "joy"
  | "sadness"
  | "anger"
  | "anxiety"
  | "social_pressure"
  | "habit"
  | "other";

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  date_of_birth: string | null;
  baseline_consumption_summary: Record<string, unknown> | null;
  baseline_budget_estimate: number | null;
  main_goal: GoalType | null;
  consent_to_share_data: boolean;
  consent_recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consumption {
  id: string;
  user_id: string;
  consumed_at: string;
  category: ConsumptionCategory;
  subcategory: string | null;
  quantity: number;
  unit: string;
  price: number | null;
  context: string | null;
  trigger_reason: EmotionState | null;
  emotional_state: string | null;
  sensation_after: string | null;
  note: string | null;
  created_at: string;
}

export interface CravingEvent {
  id: string;
  user_id: string;
  created_at: string;
  intensity: number;
  category: ConsumptionCategory | null;
  context: string | null;
  action_taken: string | null;
  resolved: boolean;
  resolved_at: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: GoalType;
  description: string | null;
  target_value: number | null;
  target_unit: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
}
