export const EARN = {
  get amazonTag() {
    return process.env.NEXT_PUBLIC_AMAZON_TAG || "freemoviefind-20";
  },
  get donationUrl() {
    return process.env.NEXT_PUBLIC_DONATION_URL || "";
  },
  get donationLabel() {
    return process.env.NEXT_PUBLIC_DONATION_LABEL || "Support Us";
  },
  get adsEnabled() {
    return process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  },
} as const;

export function amazonSearchUrl(title: string, tag?: string): string {
  const q = encodeURIComponent(`${title} movie`);
  const t = encodeURIComponent(tag || EARN.amazonTag);
  return `https://www.amazon.com/s?k=${q}&tag=${t}`;
}
