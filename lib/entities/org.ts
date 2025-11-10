export interface Organization {
  pk: string; // ORG#${orgId}
  sk: string; // PROFILE
  entity_type: "ORGANIZATION";
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  pk: string; // USER#${userId}
  sk: string; // ORG#${orgId}
  entity_type: "USER_ORGANIZATION";
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}
