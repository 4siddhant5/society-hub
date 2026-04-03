import { useState, useEffect } from "react";
import { getUser } from "../services/auth";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getUser().then((u) => { setUser(u); setLoading(false); });
  }, []);
  return { user, loading, setUser };
};
