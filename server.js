const express = require("express");
const path = require("path");
const { ExcelClientRepository } = require("./src/repositories/excelClientRepository");
const { RentCheckService } = require("./src/services/rentCheckService");

const app = express();
const PORT = process.env.PORT || 3000;

const clientRepository = new ExcelClientRepository({
  rootDir: __dirname,
  excelPath: path.join(__dirname, "data", "Baza.xlsx")
});
const rentCheckService = new RentCheckService({ clientRepository });

app.use(express.json());
app.use(express.static(__dirname));

app.post("/check-rent", async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();

    if (!query) {
      return res.status(400).json({ error: "Введите ФИО или кодовое слово." });
    }

    const result = await rentCheckService.checkRent(query, new Date());

    if (!result) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    return res.json(result);
  } catch (error) {
    // Keep logs explicit for easier backend diagnostics.
    console.error(error);
    return res.status(500).json({ error: "Внутренняя ошибка сервера." });
  }
});

app.listen(PORT, () => {
  console.log(`Happybike server started on http://localhost:${PORT}`);
});
