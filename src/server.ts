import express, { Request, Response } from "express"; /*importo el framework para crear el servidor HTTP */
import puppeteer from "puppeteer"; //importo la libreria Puppeteer 
import path from "path"; 

const app = express(); //creo la instancia de la aplicación
const PORT = 3000; //num de puerto donde va a escuchar el servidor

app.use(express.json({ limit: "10mb" })); //middleware
/* le dice a Express que cuando llegue un request 
con Content-Type: application/json, parsee el body automáticamente y lo deje disponible en req.body. 
El limit: "10mb" permite que el HTML pegado pueda ser relativamente grande. */
app.use(express.static(path.join(__dirname, "../public"))); //middleware
/*le dice a Express que sirva archivos estáticos (HTML, CSS, JS) desde la carpeta public. 
Gracias a esto, cuando abrís localhost:3000 en el browser, 
Express te devuelve automáticamente el index.html. __dirname es la carpeta donde está el archivo 
actual (src/), y ../public sube un nivel y entra a public */

//Endpoint PDF 
app.post("/export-pdf", async (req: Request, res: Response) => { //escucha peticiones POST en la ruta /export-pdf
  const { html } = req.body; //recibe el html cargado desde el usuario

  const browser = await puppeteer.launch(); //abre una instancia del browser Chromium headless
  const page = await browser.newPage(); //abre una pestaña nueva dentro de ese browser

  await page.setContent(html, { waitUntil: "networkidle0" }); // carga el HTML directamente en la página (sin necesidad de una URL)
  //waitUntil: "networkidle0" → espera hasta que no haya más requests de red pendientes, 
  //asegurando que el HTML esté completamente renderizado antes de exportar

  const pdf = await page.pdf({ format: "A4", printBackground: true }); //le dice a Puppeteer que genere el PDF de lo que tiene renderizado

  await browser.close(); //libera memoria, sino cada request dejaría un proceso de Chromium abierto

  const buffer = Buffer.from(pdf); 
  /*convierte el resultado de Puppeteer a un Buffer de Node.js 
  (necesario en Windows para que los bytes lleguen bien). */

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=export.pdf"); //le dice al browser que descargue el archivo
  res.setHeader("Content-Length", buffer.length); // el tamaño del archivo en bytes, para que el browser sepa cuándo terminó de recibirlo
  res.end(buffer); //envía los bytes y cierra la respuesta
});

//Endpoint PNG 
app.post("/export-png", async (req: Request, res: Response) => {
  const { html } = req.body;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.setViewport({ width: 1200, height: 800 }); //define el tamaño de la "ventana" del browser headless

  const screenshot = await page.screenshot({ fullPage: true }); //captura una imagen de toda la página, no solo la parte visible en el viewport

  await browser.close();

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", "attachment; filename=export.png");
  res.send(screenshot);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});