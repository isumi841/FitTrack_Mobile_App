import { useMember } from "@/providers/member-state";

/**
 * Match the app preference. The provider defaults to light on server and client.
 */
export function useColorScheme() {
  const { dark } = useMember();
  return dark ? "dark" : "light";
}
