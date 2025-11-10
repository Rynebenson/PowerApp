import NavigationClient from "./NavigationClient"
import { fetchAppData } from "@/lib/amplifyServerUtils"

export default async function Navigation() {
  const appData = await fetchAppData()
  return <NavigationClient />
}