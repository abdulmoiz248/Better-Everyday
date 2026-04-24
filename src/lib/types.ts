export type SkillStatus = "pending" | "learning" | "completed";

export type SkillRecord = {
  id: string;
  user_id: string;
  name: string;
  status: SkillStatus;
  created_at: string;
  updated_at: string;
};

export type ReflectionRecord = {
  id: string;
  user_id: string;
  learned_today: string;
  leetcode_question: string | null;
  blockers: string | null;
  wins: string | null;
  created_at: string;
};

export type CheckinTokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type ProfileRecord = {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};
