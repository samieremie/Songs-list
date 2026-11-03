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

function parseISO(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const capitalize = (text) => text.charAt(0).toLocaleUpperCase("ro") + text.slice(1);

// "Luni, 9 noiembrie"
export function formatServiceDate(isoDate) {
  const text = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseISO(isoDate));
  return capitalize(text);
}

// "Luni"
export function formatWeekday(isoDate) {
  return capitalize(
    new Intl.DateTimeFormat("ro-RO", { weekday: "long" }).format(parseISO(isoDate))
  );
}

// "9 noiembrie"
export function formatDayMonth(isoDate) {
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long" }).format(
    parseISO(isoDate)
  );
}

export function daysUntil(isoDate, now = new Date()) {
  return -daysSince(isoDate, now);
}

// "azi", "mâine", "în 6 zile", "în 20 de zile"
export function untilLabel(isoDate, now = new Date()) {
  const days = daysUntil(isoDate, now);
  if (days <= 0) return "azi";
  if (days === 1) return "mâine";
  return `în ${count(days, "o zi", "zile")}`;
}

// The next given weekday (0 = Sunday, 1 = Monday...), today included.
export function nextWeekday(weekday, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + ((weekday - date.getDay() + 7) % 7));
  return todayISO(date);
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
