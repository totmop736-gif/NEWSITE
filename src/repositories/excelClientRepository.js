const fs = require("fs/promises");
const path = require("path");
const xlsx = require("xlsx");
const { parseExcelDate } = require("../utils/dateUtils");

const HEADER_ALIASES = {
  fullName: ["\u0444\u0438\u043e"],
  bikeNumber: ["\u043d\u043e\u043c\u0435\u0440"],
  codeWord: ["\u043a\u043e\u0434\u043e\u0432\u043e\u0435 \u0441\u043b\u043e\u0432\u043e"],
  startDate: ["\u0434\u0430\u0442\u0430 \u043d\u0430\u0447\u0430\u043b\u0430 \u0430\u0440\u0435\u043d\u0434\u044b"],
  paidUntilDate: ["\u0434\u0430\u0442\u0430 \u0434\u043e \u043a\u043e\u0442\u043e\u0440\u043e\u0439 \u043e\u043f\u043b\u0430\u0447\u0435\u043d\u043e"],
  weeklyPrice: ["\u0441\u0443\u043c\u043c\u0430 \u043d\u0435\u0434\u0435\u043b\u044c\u043d\u043e\u0439 \u043e\u043f\u043b\u0430\u0442\u044b"]
};

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function toNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getCellValue(row, headerMap, aliases) {
  for (const alias of aliases) {
    const key = headerMap.get(normalizeHeader(alias));
    if (key && row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return null;
}

class ExcelClientRepository {
  constructor(options = {}) {
    const rootDir = options.rootDir || process.cwd();
    const explicitPath = options.excelPath || path.join(rootDir, "data", "Baza.xlsx");

    this.candidatePaths = [explicitPath, path.join(rootDir, "Baza.xlsx")];
  }

  async resolveExcelPath() {
    for (const candidate of this.candidatePaths) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch (_error) {
        continue;
      }
    }

    throw new Error("\u041d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u0444\u0430\u0439\u043b \u0431\u0430\u0437\u044b: \u043e\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044f data/Baza.xlsx");
  }

  async loadClients() {
    const excelPath = await this.resolveExcelPath();
    // Keep raw serial numbers to avoid timezone shifts from JS Date conversion.
    const workbook = xlsx.readFile(excelPath, { cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("Excel-\u0444\u0430\u0439\u043b \u043f\u0443\u0441\u0442\u043e\u0439: \u043b\u0438\u0441\u0442\u044b \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.");
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      defval: null,
      raw: true
    });

    return rows
      .map((row) => this.mapRowToClient(row))
      .filter((client) => client && client.fullName);
  }

  mapRowToClient(row) {
    const rowKeys = Object.keys(row);
    const headerMap = new Map(rowKeys.map((key) => [normalizeHeader(key), key]));

    const fullName = getCellValue(row, headerMap, HEADER_ALIASES.fullName);
    const bikeNumber = getCellValue(row, headerMap, HEADER_ALIASES.bikeNumber);
    const codeWord = getCellValue(row, headerMap, HEADER_ALIASES.codeWord);
    const startDate = parseExcelDate(getCellValue(row, headerMap, HEADER_ALIASES.startDate));
    const paidUntilDate = parseExcelDate(getCellValue(row, headerMap, HEADER_ALIASES.paidUntilDate));
    const weeklyPrice = toNumber(getCellValue(row, headerMap, HEADER_ALIASES.weeklyPrice));

    if (!fullName || !startDate || !paidUntilDate) {
      return null;
    }

    return {
      fullName: String(fullName).trim(),
      bikeNumber: String(bikeNumber || "").trim(),
      codeWord: String(codeWord || "").trim(),
      startDate,
      paidUntilDate,
      weeklyPrice
    };
  }

  async findByNameOrCode(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const clients = await this.loadClients();

    return (
      clients.find((client) => {
        const name = client.fullName.toLowerCase();
        const code = client.codeWord.toLowerCase();
        return name === normalizedQuery || code === normalizedQuery;
      }) || null
    );
  }
}

module.exports = {
  ExcelClientRepository
};
