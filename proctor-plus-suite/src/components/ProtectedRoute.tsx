import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { baseUrl } from "../constant/Url";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/auth/check`, {
          credentials: "include"
        });
        setAuth(res.ok);
      } catch {
        setAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (auth === null) return <p>Loading...</p>;
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}
