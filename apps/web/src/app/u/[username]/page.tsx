import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileBoard } from "@/components/ProfileBoard";
import { t } from "@gametracker/shared";
import { getLibrary, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const { username } = await params;
  const name = decodeURIComponent(username);
  return pageMetadata({
    title: name,
    description: t("meta.profile", { username: name }),
    path: `/u/${encodeURIComponent(name)}`,
  });
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ list?: string }>;
}) {
  await applyLocale();
  const { username } = await params;
  const { list } = await searchParams;
  const [library, me] = await Promise.all([getLibrary(username), getMe()]);
  if (!library) notFound();

  const mine = me?.username.toLowerCase() === library.user.username.toLowerCase();

  return <ProfileBoard library={library} email={mine && me ? me.email : null} initialTab={list} />;
}
