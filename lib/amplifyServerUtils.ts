"use server";

import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";
import amplifyConfig from "./amplify";

const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig
});

export async function authGetCurrentUser() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
    return currentUser;
  } catch (error) {
    console.error('authGetCurrentUser error:', error);
    return null;
  }
}

export async function authGetSession() {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    return session;
  } catch (error) {
    console.error('authGetSession error:', error);
    return null;
  }
}

export async function fetchAppData() {
  try {
    const session = await authGetSession();
    
    if (!session?.tokens?.idToken) {
      return null;
    }

    const token = session.tokens.idToken.toString();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/app-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error in fetchAppData:', error);
    return null;
  }
}
