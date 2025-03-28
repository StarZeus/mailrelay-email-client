import csvParser from 'csv-parser';
import * as xlsx from 'xlsx';
import { Readable } from 'stream';

function detectDelimiter(content: string): string {
  const commonDelimiters = [',', ';', '\t', '|'];
  const lines = content.split('\n').slice(0, 5); // Check first 5 lines
  const delimiterCounts = new Map<string, number>();

  // Count occurrences of each delimiter in each line
  lines.forEach(line => {
    commonDelimiters.forEach(delimiter => {
      // For tab, check both actual tab character and \t string
      if (delimiter === '\t') {
        // Count actual tab characters (charCode 9)
        const actualTabCount = Array.from(line).filter(c => c.charCodeAt(0) === 9).length;
        // Count \t string occurrences
        const stringTabCount = (line.match(/\\t/g) || []).length;
        const totalTabCount = actualTabCount + stringTabCount;
        
        delimiterCounts.set(
          delimiter,
          (delimiterCounts.get(delimiter) || 0) + totalTabCount
        );
      } else {
        // For other delimiters, use regex
        const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const count = (line.match(new RegExp(escapedDelimiter, 'g')) || []).length;
        delimiterCounts.set(
          delimiter,
          (delimiterCounts.get(delimiter) || 0) + count
        );
      }
    });
  });

  // Find the delimiter with the most consistent count across lines
  let bestDelimiter = ',';
  let maxConsistency = 0;

  delimiterCounts.forEach((count, delimiter) => {
    const consistency = count / lines.length;
    if (consistency > maxConsistency && consistency > 0) {
      maxConsistency = consistency;
      bestDelimiter = delimiter;
    }
  });

  return bestDelimiter;
}

export async function parseAttachmentsToJson(attachmentData: { fileName: string; data: Buffer }[], sampleOnly?: boolean): Promise<{ fileName: string; data: any[] }[]> {
    const parsedData = [];

    attachmentData = Array.isArray(attachmentData) ? (attachmentData as { fileName: string, data: Buffer }[]).sort((a, b) => a.fileName.localeCompare(b.fileName)) : attachmentData;

    for (const attachment of attachmentData) {
      const { fileName, data } = attachment;

      const fileNameParts = fileName.split('.')
      let fileExtension = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : 'csv';

      try{
        if (fileExtension === 'csv') {
          const csvData = [];
          const content = data.toString('utf-8');
          const delimiter = detectDelimiter(content);
          
          await new Promise((resolve, reject) => {
            const parser = csvParser({
              separator: delimiter,
              skipLines: 0
            });
            const stream = Readable.from(content, { encoding: 'utf-8' });
            stream.pipe(parser);
            parser.on('data', (row) => csvData.push(row));
            parser.on('end', () => resolve(csvData));
            parser.on('error', reject);
          });
          parsedData.push({ fileName, data: sampleOnly ? csvData.slice(0, 1) : csvData });
        } else if (fileExtension === 'xlsx') {
          const workbook = xlsx.read(data, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json(sheet);
          parsedData.push({ fileName, data: sampleOnly ? jsonData.slice(0, 1) : jsonData });
        } else if (fileExtension === 'json') {
          const jsonData = JSON.parse(data.toString('utf-8'));
          const formattedData = Array.isArray(jsonData) ? jsonData : [jsonData];
          parsedData.push({ fileName, data: sampleOnly ? formattedData.slice(0, 1) : formattedData });
        } else {
          parsedData.push({ fileName, data: [] }); // Unsupported file type
        }
      }catch(error){
        console.error(`Error while processing ${fileName}`)
      }
    }

    return parsedData;
  }