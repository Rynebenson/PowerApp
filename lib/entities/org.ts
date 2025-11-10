export interface Organization {
  pk: string; // ORG#${orgId}
  sk: string; // PROFILE
  entity_type: "ORGANIZATION";
  org_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
