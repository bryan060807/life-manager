import SupabaseAuth from "./SupabaseAuth";
import MainTaskTracker from "./MainTaskTracker";
import { useState } from "react";

export default function TaskTracker() {
  const [user, setUser] = useState<any>(null);

  return !user ? (
    <SupabaseAuth onAuthChange={setUser} />
  ) : (
    <MainTaskTracker user={user} />
  );
}
