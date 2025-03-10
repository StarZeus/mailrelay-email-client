import { parse } from 'node-html-parser';

export function htmlToJson(html: string) {
  try {
    const root = parse(html);
    const result: Record<string, any> = {};

    // Process tables
    root.querySelectorAll('table').forEach((table, index) => {
      const tableData: Record<string, any> = {
        id: table.getAttribute('id') || `table_${index}`,
        headers: [],
        data: []
      };

      // Get headers first
      const headers: string[] = [];
      table.querySelectorAll('th').forEach(th => {
        const header = th.textContent?.trim() || '';
        headers.push(header);
        tableData.headers.push(header);
      });

      // If no headers found, try using first row as headers
      if (headers.length === 0) {
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('td').forEach(td => {
            const header = td.textContent?.trim() || '';
            headers.push(header);
            tableData.headers.push(header);
          });
        }
      }

      // Process rows into objects
      table.querySelectorAll('tr').forEach((tr, rowIndex) => {
        // Skip first row if we used it for headers
        if (headers.length === 0 || rowIndex > 0) {
          const cells = tr.querySelectorAll('td');
          if (cells.length > 0) {
            const rowData: Record<string, string> = {};
            cells.forEach((td, cellIndex) => {
              // Use header if available, otherwise use column_N
              const key = headers[cellIndex] || `column_${cellIndex + 1}`;
              rowData[key] = td.textContent?.trim() || '';
            });
            tableData.data.push(rowData);
          }
        }
      });

      result[tableData.id] = tableData;
    });

    // Process lists
    root.querySelectorAll('ul, ol').forEach((list, index) => {
      const listData: string[] = [];
      list.querySelectorAll('li').forEach(item => {
        listData.push(item.textContent?.trim() || '');
      });
      result[`list_${index}`] = listData;
    });

    return result;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return {};
  }
} 