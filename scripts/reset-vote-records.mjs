import { writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const outputPath =
    process.argv[2] || path.resolve(process.cwd(), "data", "vote-records.json");

  await writeFile(
    outputPath,
    `${JSON.stringify({ records: [] }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Reset vote record file at ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
