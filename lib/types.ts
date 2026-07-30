export type TokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
};

export type UserMe = {
  id: string;
  username: string;
  email: string;
  nickname: string | null;
  level: string;
  is_coach: boolean;
  role: string;
  account_status: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  payload: {
    message?: string;
    link?: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
};

export type Wallet = {
  balance: number;
  debt: number;
  currency_label: string;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  debt_after: number;
  description: string;
  reason: string;
  path_id: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  topic: string;
  goal_tag: string;
  topic_code?: string | null;
  goal_tag_code?: string | null;
  capital_goal?: string | null;
  risk?: string | null;
  amount_range?: string | null;
  readiness_for_matching?: boolean;
  is_active?: boolean;
};

export type GoalsMe = {
  current?: Goal | null;
  active_goal?: Goal | null;
  goals: Goal[];
};

export type MatchCandidate = {
  mentor_id: string;
  nickname: string | null;
  level: string;
  path_cost: number;
  match_score: number;
  public_badges?: string[];
  is_recommended: boolean;
  availability_fallback?: boolean;
  reason_summary: string;
};

export type MenteeCandidate = {
  mentee_id: string;
  nickname: string | null;
  level: string;
  goal_id: string;
  goal_topic: string;
  goal_tag: string;
  match_score: number;
  is_recommended: boolean;
  availability_fallback?: boolean;
  reason_summary: string;
};

export type PublicProfile = {
  user_id: string;
  nickname: string | null;
  level: string;
  path_cost: number;
  is_coach: boolean;
  completed_paths: number;
  public_badges: string[];
  top_topics: string[];
  competences?: Array<{ topic: string; depth: string }>;
  aggregate_metrics: Record<string, unknown>;
};

export type MatchRequestItem = {
  id: string;
  status: string;
  mentor_id: string;
  mentee_id: string;
  goal_id: string;
  initiator_role: "mentee" | "mentor";
  expires_at: string;
  created_at?: string;
  updated_at?: string;
  reason?: string | null;
  mentor?: UserSummary | null;
  mentee?: UserSummary | null;
  goal?: Goal | null;
  path_id?: string | null;
};

export type UserSummary = {
  id?: string;
  user_id?: string;
  nickname: string | null;
  username?: string;
  level: string;
  is_coach: boolean;
};

export type PathItem = {
  id: string;
  status: "open" | "feedback_pending" | "completed" | string;
  mentee_id: string;
  mentor_id: string;
  goal_id: string;
  mentee_closed_at?: string | null;
  mentor_closed_at?: string | null;
  completed_at?: string | null;
  first_call_completed?: boolean;
  goal_review_completed?: boolean;
  mentee_feedback_submitted?: boolean;
  mentor_feedback_submitted?: boolean;
  mentee_feedback_note?: string | null;
  mentor_feedback_note?: string | null;
  mentor?: UserSummary | null;
  mentee?: UserSummary | null;
  goal?: Goal | null;
};

export type CallRoom = {
  id: string;
  path_id: string;
  provider: string;
  provider_space_name: string;
  provider_meeting_code: string | null;
  join_url: string;
  conference_record_name: string | null;
  status: string;
  replaced_at: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  superseded_by_room_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CallMetadataSync = {
  metadata_id: string | null;
  verification_status: "verified" | "pending_provider_metadata" | "insufficient_participants" | "not_verified";
  transcripts_enabled: boolean;
  anomaly_flags: string[];
  conference_record_name: string | null;
  active_participants_count: number;
  conferences_synced: number;
  participant_sessions_synced: number;
  transcripts_synced: number;
  transcript_entries_synced: number;
};

export type ApiError = {
  detail?: string;
  message?: string;
};
