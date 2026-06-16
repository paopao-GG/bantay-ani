import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function fmtPh(v: number) {
  return v.toFixed(2);
}

export function fmtMoist(v: number) {
  return `${v.toFixed(1)}%`;
}

export function fmtRssi(v: number) {
  return `${v} dBm`;
}

export function fmtTimeShort(ts: string) {
  return format(parseISO(ts), "HH:mm");
}

export function fmtDateTime(ts: string) {
  return format(parseISO(ts), "yyyy-MM-dd HH:mm:ss");
}

export function fmtRelative(ts: string) {
  return `${formatDistanceToNowStrict(parseISO(ts))} ago`;
}
