import * as fs from "fs";
import cheerio from "cheerio";
import puppeteer from "puppeteer";
import * as path from "path";

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Removes the vat from the price
 * @param price
 * @param vatRate
 * @returns price without vat
 */
export function calcPriceWithoutVat(price: number, vatRate: number) {
  return Math.round((price / (1 + vatRate / 100)) * 100) / 100;
}

export function calcVat(price: number, vatRate: number) {
  return price - calcPriceWithoutVat(price, vatRate);
}

export function calcMatrah(sum: number, percent: number) {
  return sum / (percent / 100);
}

export function createDirectory(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export async function convertAllHTMLFilesToPDF(date: string) {
  const htmlFolderPath = `./html/${date}/`;
  const pdfFolderPath = `./pdf/${date}/`;
  try {
    createDirectory(pdfFolderPath);

    const htmlFiles = await fs.promises.readdir(htmlFolderPath, {
      withFileTypes: true,
    });

    for (const file of htmlFiles) {
      if (file.isFile() && path.extname(file.name) === ".html") {
        const htmlFilePath = path.join(htmlFolderPath, file.name);
        const outputPDFPath = path.join(
          pdfFolderPath,
          `${path.basename(file.name, ".html")}.pdf`
        );

        try {
          await convertHTMLToPDF(htmlFilePath, outputPDFPath);
          console.log(`Converted ${htmlFilePath} to ${outputPDFPath}`);
        } catch (error) {
          console.error(`Error converting ${htmlFilePath}: ${error}`);
        }
      }
    }
  } catch (error) {
    console.error("Error reading HTML folder:", error);
  }
}

async function convertHTMLToPDF(htmlFilePath: string, outputPDFPath: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const fileURL = `file://${path.resolve(htmlFilePath)}`;
  await page.goto(fileURL, { waitUntil: "networkidle0" });

  await page.pdf({ path: outputPDFPath, format: "A4" });

  await browser.close();
}

export function renameHTMLFiles(folderPath: string) {
  // const folderPath = `./html/${date}`; // Replace with the actual folder path containing HTML files

  // Read and process each file in the folder
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading the folder:", err);
      return;
    }

    console.log(files.length, "files");

    files.forEach((file, index) => {
      const filePath = `${folderPath}/${file}`;

      // Read the content of each file
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        // Load the HTML content using Cheerio
        const $ = cheerio.load(data);

        // Extract the innerText from the desired element (e.g., td > span)
        const innerText = $(
          "#customerPartyTable > tbody > tr > td > table > tbody > tr:nth-child(1) > td > span"
        )
          .parent()
          .parent()
          .next()
          .text()
          .trim();

        const timeInnerText = $(
          "#despatchTable > tbody > tr:nth-child(5) > td:nth-child(2)"
        )
          .text()
          .trim()
          .replace(" ", " ")
          .split(" ")[1]!
          .replace(":", ".");

        // Append the innerText to the file name (without the extension)
        const newFileName = `${innerText}-${timeInnerText}.html`.replace(
          " ",
          " "
        );

        // Write the updated content to a new file
        fs.rename(
          `${folderPath}/${file}`,
          `${folderPath}/${newFileName}`,
          (err) => {
            if (err) {
              console.error(`Error writing file ${newFileName}:`, err);
              return;
            }
            console.log(
              `Successfully renamed ${file} as ${newFileName} ${index}`
            );
          }
        );
      });
    });
  });
}

export function getDate() {
  return new Date().toLocaleDateString("TR").replace(/\./gi, "-");
}

export function getDirectories(folderPath: string) {
  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}
