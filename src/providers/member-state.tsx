import { createContext, useContext, useState, type ReactNode } from "react";

function useMemberState() {
  const [dark, setDark] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [name, setName] = useState("Nimal");
  const [language, setLanguage] = useState("English");
  const [signedOut, setSignedOut] = useState(false);
  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  return {
    dark,
    setDark,
    favorites,
    toggleFavorite,
    reminders,
    setReminders,
    notifications,
    setNotifications,
    name,
    setName,
    language,
    setLanguage,
    signedOut,
    setSignedOut,
  };
}
const MemberContext = createContext<ReturnType<typeof useMemberState> | null>(
  null,
);
export function MemberProvider({ children }: { children: ReactNode }) {
  const state = useMemberState();
  return (
    <MemberContext.Provider value={state}>{children}</MemberContext.Provider>
  );
}
export function useMember() {
  const value = useContext(MemberContext);
  if (!value) throw new Error("MemberProvider is required");
  return value;
}
