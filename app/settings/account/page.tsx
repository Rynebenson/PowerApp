"use client";

import { useEffect, useState } from "react";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function AccountPage() {
  const [user, setUser] = useState<{
    name?: string;
    email?: string;
    picture?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isThirdParty, setIsThirdParty] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const [attributes, session] = await Promise.all([
          fetchUserAttributes(),
          fetchAuthSession()
        ]);

        const identities = session.tokens?.idToken?.payload?.identities as string[];
        setIsThirdParty(!!identities && identities.length > 0);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = session.tokens?.idToken?.toString();

        const response = await fetch(`${apiUrl}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUser({ ...attributes, ...profile });
        } else {
          setUser(attributes);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-md border border-zinc-200 dark:border-zinc-800">
      <div>
        <h2 className="text-2xl font-bold">Account</h2>
        <p className="text-muted-foreground">
          Manage your personal account settings.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            {isThirdParty
              ? "Your account is managed by a third-party provider"
              : "Your account details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              {user?.picture && (
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <img src={user.picture} height={64} width={64} alt="Profile" className="w-16 h-16 rounded-full" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={user?.name || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              </div>
              {isThirdParty && (
                <p className="text-xs text-muted-foreground">
                  This account is managed by a third-party provider. To update your information, please visit your provider&apos;s settings.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
