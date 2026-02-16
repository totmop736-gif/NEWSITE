const xlsx = require("xlsx");

const MS_IN_WEEK = 1000 * 60 * 60 * 24 * 7;

function normalizeDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseExcelDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Use UTC components to avoid timezone-driven day shift for Date values from Excel.
    return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }

  if (typeof value === "number") {
    const parts = xlsx.SSF.parse_date_code(value);
    if (!parts || !parts.y || !parts.m || !parts.d) {
      return null;
    }

    return new Date(parts.y, parts.m - 1, parts.d);
  }

  if (typeof value === "string") {
    const [day, month, year] = value.trim().split(".");
    if (!day || !month || !year) {
      return null;
    }

    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function toRuDateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("ru-RU");
}

function weeksBetween(fromDate, toDate) {
  const from = normalizeDate(fromDate);
  const to = normalizeDate(toDate);
  if (!from || !to) {
    return 0;
  }

  const diffMs = to.getTime() - from.getTime();
  const weeks = Math.floor(diffMs / MS_IN_WEEK);
  return weeks > 0 ? weeks : 0;
}

function overdueWeeksCeil(paidUntilDate, currentDate) {
  const paidUntil = normalizeDate(paidUntilDate);
  const current = normalizeDate(currentDate);
  if (!paidUntil || !current) {
    return 0;
  }

  const diffMs = current.getTime() - paidUntil.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / MS_IN_WEEK);
}

module.exports = {
  parseExcelDate,
  toRuDateString,
  weeksBetween,
  overdueWeeksCeil
};
