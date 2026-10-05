import { useMember } from "@/providers/member-state";

export function useColorScheme() {
  const { dark } = useMember();
  return dark ? "dark" : "light";
}
