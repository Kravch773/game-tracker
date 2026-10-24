import { t, type GameSummary } from "@gametracker/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameResult } from "@/components/GameResult";
import { Icon, IconBadge } from "@/components/Icon";
import { getCompanyGames } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

const ROLES = ["developer", "publisher"] as const;
type CompanyRole = (typeof ROLES)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string; name: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const { role, name } = await params;
  const company = decodeURIComponent(name).trim();
  if (!isRole(role) || !company) {
    return pageMetadata({ title: "GameTracker", description: t("meta.description"), path: "/companies", index: false });
  }
  return pageMetadata({
    title: company,
    description: t("meta.company", { name: company }),
    path: `/companies/${role}/${encodeURIComponent(company)}`,
  });
}

export default async function CompanyPage({ params }: { params: Promise<{ role: string; name: string }> }) {
  await applyLocale();
  const { role, name } = await params;
  const company = decodeURIComponent(name).trim();
  if (!isRole(role) || company.length < 2 || company.length > 120) notFound();

  const games = await getCompanyGames(role, company);
  return (
    <main>
      <a href="/" className="-my-3 inline-flex h-11 items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow" />
        {t("common.backToSearch")}
      </a>
      <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {role === "developer" ? t("game.developerGames") : t("game.publisherGames")}
      </p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name={role === "developer" ? "building" : "users"} tone="bg-sky-300/10 text-sky-300" size="lg" />
        {company}
      </h1>
      <GameGrid games={games} />
    </main>
  );
}

function GameGrid({ games }: { games: GameSummary[] }) {
  if (games.length === 0) return <p className="mt-8 text-muted">{t("game.companyEmpty")}</p>;
  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <li key={game.id}>
          <GameResult game={game} />
        </li>
      ))}
    </ul>
  );
}

function isRole(role: string): role is CompanyRole {
  return ROLES.includes(role as CompanyRole);
}
