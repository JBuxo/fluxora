"use client";

export function useAuth() {
  const token = process.env.NEXT_PUBLIC_DEV_TOKEN ?? "";
  return {
    token,
    authHeader: token ? `Bearer ${token}` : "",
  };
}
