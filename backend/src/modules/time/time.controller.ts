import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import * as timeService from './time.service';
import { CreateTimeEntrySchema, UpdateTimeEntrySchema, TimeEntryFiltersSchema } from './time.schema';
import { renderPDF } from '../documents/pdfRenderer';

function quoteCsv(value: unknown) {
  const stringValue = value == null ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export const getTimeEntries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = TimeEntryFiltersSchema.parse(req.query);
  const result = await timeService.getTimeEntries(filters, req.user!);
  res.json({ status: 'success', data: result.items, pagination: result.pagination });
});

export const getTimeEntryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const entry = await timeService.getTimeEntryById(req.params.id, req.user!);
  res.json({ status: 'success', data: entry });
});

export const createTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = CreateTimeEntrySchema.parse(req.body);
  const entry = await timeService.createTimeEntry(input, req.user!);
  res.status(201).json({ status: 'success', data: entry });
});

export const updateTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = UpdateTimeEntrySchema.parse(req.body);
  const entry = await timeService.updateTimeEntry(req.params.id, input, req.user!);
  res.json({ status: 'success', data: entry });
});

export const deleteTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await timeService.deleteTimeEntry(req.params.id, req.user!);
  res.json({ status: 'success', message: 'Time entry deleted successfully' });
});

export const getTimeSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { employeeId, startDate, endDate } = req.query as Record<string, string>;
  const summary = await timeService.getTimeSummary(employeeId, startDate, endDate, req.user!);
  res.json({ status: 'success', data: summary });
});

export const generateDefaultTimeEntries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { date } = req.body as { date: string };
  if (!date) {
    res.status(400).json({ status: 'error', message: 'Date is required' });
    return;
  }
  const result = await timeService.generateDefaultTimeEntries(date, req.user!);
  res.json({ status: 'success', data: result });
});

export const clockIn = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { time } = req.body as { time?: string };
  const entry = await timeService.clockIn(req.user!, time);
  res.status(200).json({ status: 'success', data: entry });
});

export const clockOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { time } = req.body as { time?: string };
  const entry = await timeService.clockOut(req.user!, time);
  res.status(200).json({ status: 'success', data: entry });
});

export const recordTimeAction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { action, time, employeeId, date } = req.body as { action: string; time?: string; employeeId?: string; date?: string };
  const entry = await timeService.recordTimeAction(req.user!, action, time, employeeId, date);
  res.status(200).json({ status: 'success', data: entry });
});

export const exportTimeEntries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = TimeEntryFiltersSchema.parse(req.query);
  const rows = await timeService.exportTimeEntries(filters, req.user!);

  if (filters.format === 'pdf') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport de Temps</title>
        <style>
          body { font-family: sans-serif; font-size: 12px; color: #333; }
          h1 { color: #1e3a8a; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; color: #1e3a8a; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .summary { margin-top: 20px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Rapport de Temps de Travail</h1>
        <p>Généré le: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Entrée</th>
              <th>Sortie</th>
              <th>Réelles</th>
              <th>Prévues</th>
              <th>Sup.</th>
              <th>Déficit</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${row.employee_name}</td>
                <td>${row.date}</td>
                <td>${row.clock_in || ''}</td>
                <td>${row.clock_out || ''}</td>
                <td>${row.total_hours ?? ''}</td>
                <td>${row.expected_hours ?? ''}</td>
                <td>${row.overtime}</td>
                <td>${row.deficit}</td>
                <td>${row.source}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const pdfBuffer = await renderPDF(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="time-report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
    return;
  }

  // Default to CSV
  const headers = [
    'Employé',
    'Date',
    'Entrée',
    'Sortie',
    'Heures réelles',
    'Heures prévues',
    'Heures sup.',
    'Déficit',
    'Source',
    'Raison',
    'Créé le',
  ];

  const csv = [headers.map(quoteCsv).join(',')]
    .concat(rows.map((row) => [
      row.employee_name,
      row.date,
      row.clock_in || '',
      row.clock_out || '',
      row.total_hours?.toString() ?? '',
      row.expected_hours?.toString() ?? '',
      row.overtime.toString(),
      row.deficit.toString(),
      row.source,
      row.reason || '',
      row.created_at,
    ].map(quoteCsv).join(',')))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="time-report-${Date.now()}.csv"`);
  res.send(csv);
});
