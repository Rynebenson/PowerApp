"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationPage() {
  const [orgData, setOrgData] = useState<{
    organization?: {
      name: string;
      email?: string;
      phone?: string;
      created_at: string;
    };
    members?: Array<{
      name?: string;
      email: string;
      role?: string;
    }>;
    activeOrg?: {
      id: string;
      name: string;
      role: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      const session = await fetchAuthSession();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = session.tokens?.idToken?.toString();

      const [appDataRes, detailsRes] = await Promise.all([
        fetch(`${apiUrl}/users/app-data`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/orgs/details`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (appDataRes.ok && detailsRes.ok) {
        const appData = await appDataRes.json();
        const details = await detailsRes.json();
        
        const activeOrg = appData.organizations?.find(
          (org: { id: string }) => org.id === appData.user?.active_org_id
        );
        
        setOrgData({
          organization: details.organization,
          members: details.members,
          activeOrg
        });
      }
    } catch (error) {
      console.error("Error loading organization:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-md border border-zinc-200 dark:border-zinc-800">
      <div>
        <h2 className="text-2xl font-bold">Organization</h2>
        <p className="text-muted-foreground">
          Manage your workspace and team members.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Workspace Details</CardTitle>
          <CardDescription>Your active workspace information</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : orgData?.organization ? (
            <div className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {orgData.organization.name}
              </div>
              {orgData.organization.email && (
                <div>
                  <span className="font-medium">Email:</span> {orgData.organization.email}
                </div>
              )}
              {orgData.organization.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {orgData.organization.phone}
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(orgData.organization.created_at).toLocaleDateString()}
              </div>
              {orgData.activeOrg && (
                <div>
                  <span className="font-medium">Your Role:</span> {orgData.activeOrg.role}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No organization found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {orgData?.members?.length || 0} member(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : orgData?.members && orgData.members.length > 0 ? (
            <ul className="space-y-2">
              {orgData.members.map((member, index: number) => (
                <li key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{member.name || member.email}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.role || "Member"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No members found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
