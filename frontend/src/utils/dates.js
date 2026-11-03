import { plural as count } from "./text";

const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date as YYYY-MM-DD in the user's local time zone.
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysSince(isoDate, now = new Date()) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / DAY_MS);
}

export function isRecent(isoDate, now = new Date()) {
  if (!isoDate) return false;
  const days = daysSince(isoDate, now);
  return days >= 0 && days < 30;
}

// "azi", "ieri", "acum 5 zile", "acum o săptămână", "acum 3 luni"...
export function sungAgo(isoDate, now = new Date()) {
  const days = daysSince(isoDate, now);
  if (days <= 0) return "azi";
  if (days === 1) return "ieri";
  if (days < 7) return `acum ${count(days, "o zi", "zile")}`;
  if (days < 30) return `acum ${count(Math.floor(days / 7), "o săptămână", "săptămâni")}`;
  if (days < 365) return `acum ${count(Math.floor(days / 30), "o lună", "luni")}`;
  return `acum ${count(Math.floor(days / 365), "un an", "ani")}`;
}
