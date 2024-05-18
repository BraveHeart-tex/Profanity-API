import fs from "fs";
import csv from "csv-parser";
import { Index } from "@upstash/vector";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

type Row = {
  text: string;
};

async function parseCSV(filePath: string): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const rows: Row[] = [];

    fs.createReadStream(filePath).pipe(
      csv({ separator: "," })
        .on("data", (row) => {
          rows.push(row);
        })
        .on("error", (error) => reject(error))
        .on("end", () => resolve(rows))
    );
  });
}

const STEP = 30;

const seed = async () => {
  const data = await parseCSV("./trainning_dataset.csv");

  for (let i = 0; i < data.length; i += STEP) {
    const chunk = data.slice(i, i + STEP);

    const formatted = chunk.map((row, batchIndex) => ({
      data: row.text,
      id: i + batchIndex,
      metadata: { text: row.text },
    }));

    await index.upsert(formatted);
  }
};

seed();
