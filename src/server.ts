import express, { Request, Response } from "express"; /*importo el f */
import puppeteer from "puppeteer";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.post("/export-pdf", async (req: Request, res: Response) => {
  const { html } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();

  const buffer = Buffer.from(pdf);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=export.pdf");
  res.setHeader("Content-Length", buffer.length);
  res.end(buffer);
});

app.post("/export-png", async (req: Request, res: Response) => {
  const { html } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.setViewport({ width: 1200, height: 800 });

  const screenshot = await page.screenshot({ fullPage: true });

  await browser.close();

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", "attachment; filename=export.png");
  res.send(screenshot);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});