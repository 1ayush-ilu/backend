import { Parser } from "@json2csv/plainjs";

export function toCSV(rows) {
  const parser = new Parser();
  return parser.parse(rows);
}
