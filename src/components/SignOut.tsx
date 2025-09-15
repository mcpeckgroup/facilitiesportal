"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignOut() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
    >
      Sign Out
    </button>
  );
}
