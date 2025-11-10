import { createServerRunner } from "@aws-amplify/adapter-nextjs"
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from "aws-amplify/auth/server"
import { cookies } from "next/headers"
import amplifyConfig from "./amplify"

export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
})

export async function authGetCurrentUser() {
  try {
    const currentUser = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    })
    return currentUser
  } catch (error) {
    return null
  }
}

export async function authFetchUserAttributes() {
  try {
    const userAttributes = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchUserAttributes(contextSpec),
    })
    return userAttributes
  } catch (error) {
    return null
  }
}
