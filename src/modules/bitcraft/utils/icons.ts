const ICON_BASE = "https://bitjita.com/";

/** Get the full icon URL for a BitCraft item/cargo */
export function getIconUrl(iconAssetName: string): string {
  if (!iconAssetName) return "";
  return `${ICON_BASE}${iconAssetName}.webp`;
}
