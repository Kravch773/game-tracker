export function youtubeIdOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = parsed.pathname.startsWith("/embed/")
        ? parsed.pathname.split("/")[2] ?? ""
        : parsed.searchParams.get("v") ?? "";
    }
    return /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
