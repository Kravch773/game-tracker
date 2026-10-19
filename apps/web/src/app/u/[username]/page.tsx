import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileBoard } from "@/components/ProfileBoard";
import { getLibrary, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `${decodeURIComponent(username)} · GameTracker` };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  await applyLocale();
  const { username } = await params;
  const [library, me] = await Promise.all([getLibrary(username), getMe()]);
  if (!library) notFound();

  const mine = me?.username.toLowerCase() === library.user.username.toLowerCase();

  return <ProfileBoard library={library} email={mine && me ? me.email : null} />;
}
