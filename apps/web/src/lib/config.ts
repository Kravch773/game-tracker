const remote = process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.API_URL?.trim() || "http://localhost:3001";
const local = remote.startsWith("http://localhost") || remote.startsWith("http://127.0.0.1");

export const apiUrl = typeof window === "undefined" || local ? remote : "/backend";

export function safeNext(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
