// IGDB serves the same cover in several sizes; big cover slots use the double-size one so it stays sharp.
export function sharpCover(url: string): string {
  return url.replace("/t_cover_big/", "/t_cover_big_2x/");
}

// Stored screenshots are the medium IGDB size; wide slots ask IGDB for a bigger copy of the same image.
export function screenshotAt(url: string, size: "t_screenshot_huge" | "t_1080p"): string {
  return url.replace("/t_screenshot_med/", `/${size}/`);
}
