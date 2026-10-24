// IGDB serves the same cover in several sizes; big cover slots use the double-size one so it stays sharp.
export function sharpCover(url: string): string {
  return url.replace("/t_cover_big/", "/t_cover_big_2x/");
}
