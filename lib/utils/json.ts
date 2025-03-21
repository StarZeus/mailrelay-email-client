import csvParser from 'csv-parser';
import * as xlsx from 'xlsx';
import { Readable } from 'stream';

export async function parseAttachmentsToJson(attachmentData: { fileName: string; data: Buffer }[], sampleOnly?: boolean): Promise<{ fileName: string; data: any[] }[]> {
    const parsedData = [];

    attachmentData = Array.isArray(attachmentData) ? (attachmentData as { fileName: string, data: Buffer }[]).sort((a, b) => a.fileName.localeCompare(b.fileName)) : attachmentData;

    for (const attachment of attachmentData) {
      const { fileName, data } = attachment;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        const csvData = [];
        await new Promise((resolve, reject) => {
          const parser = csvParser();
          const stream = Readable.from(data.toString('utf-8'), { encoding: 'utf-8' });
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
    }

    return parsedData;
  }