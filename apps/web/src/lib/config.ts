export const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.API_URL?.trim() || "http://localhost:3001";

export function safeNext(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
