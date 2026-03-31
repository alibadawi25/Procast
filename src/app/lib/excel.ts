import type { Workbook } from 'exceljs';

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function downloadWorkbook(workbook: Workbook, filename: string): Promise<void> {
  const fileBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([fileBuffer], { type: XLSX_MIME_TYPE });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}
