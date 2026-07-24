import {
  buildFinalGradesReport,
  buildGroupReport,
  buildInstrumentReport,
  buildStudentReport,
  buildTaskReport
} from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generatePdfFromHtml } from '../utils/generatePDF.js';
import { renderReportCsv, renderReportXlsx } from '../utils/reportExport.js';
import { renderReportHtml } from '../utils/reportHtml.js';

function filenameForReport(report) {
  const source =
    report.student?.name ||
    report.group?.name ||
    report.task?.title ||
    report.instrument?.title ||
    report.type ||
    'reporte';
  const normalized = String(source)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return `${report.type}-${normalized || 'reporte'}`;
}

function sendHtml(res, report) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderReportHtml(report));
}

async function sendPdf(res, report) {
  const html = renderReportHtml(report);
  const pdf = await generatePdfFromHtml(html);
  const filename = filenameForReport(report);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
  res.send(pdf);
}

const UTF8_BOM = '﻿';

function sendCsv(res, report) {
  const csv = renderReportCsv(report);
  const filename = filenameForReport(report);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(UTF8_BOM + csv);
}

async function sendXlsx(res, report) {
  const buffer = await renderReportXlsx(report);
  const filename = filenameForReport(report);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(buffer);
}

export const printStudentReport = asyncHandler(async (req, res) => {
  const report = await buildStudentReport(req, req.validated.params.studentId);
  sendHtml(res, report);
});

export const pdfStudentReport = asyncHandler(async (req, res) => {
  const report = await buildStudentReport(req, req.validated.params.studentId);
  await sendPdf(res, report);
});

export const csvStudentReport = asyncHandler(async (req, res) => {
  const report = await buildStudentReport(req, req.validated.params.studentId);
  sendCsv(res, report);
});

export const xlsxStudentReport = asyncHandler(async (req, res) => {
  const report = await buildStudentReport(req, req.validated.params.studentId);
  await sendXlsx(res, report);
});

export const printGroupReport = asyncHandler(async (req, res) => {
  const report = await buildGroupReport(req, req.validated.params.groupId);
  sendHtml(res, report);
});

export const pdfGroupReport = asyncHandler(async (req, res) => {
  const report = await buildGroupReport(req, req.validated.params.groupId);
  await sendPdf(res, report);
});

export const csvGroupReport = asyncHandler(async (req, res) => {
  const report = await buildGroupReport(req, req.validated.params.groupId);
  sendCsv(res, report);
});

export const xlsxGroupReport = asyncHandler(async (req, res) => {
  const report = await buildGroupReport(req, req.validated.params.groupId);
  await sendXlsx(res, report);
});

export const printTaskReport = asyncHandler(async (req, res) => {
  const report = await buildTaskReport(req, req.validated.params.taskId);
  sendHtml(res, report);
});

export const pdfTaskReport = asyncHandler(async (req, res) => {
  const report = await buildTaskReport(req, req.validated.params.taskId);
  await sendPdf(res, report);
});

export const csvTaskReport = asyncHandler(async (req, res) => {
  const report = await buildTaskReport(req, req.validated.params.taskId);
  sendCsv(res, report);
});

export const xlsxTaskReport = asyncHandler(async (req, res) => {
  const report = await buildTaskReport(req, req.validated.params.taskId);
  await sendXlsx(res, report);
});

export const printFinalGradesReport = asyncHandler(async (req, res) => {
  const report = await buildFinalGradesReport(req, req.validated.params.groupId);
  sendHtml(res, report);
});

export const pdfFinalGradesReport = asyncHandler(async (req, res) => {
  const report = await buildFinalGradesReport(req, req.validated.params.groupId);
  await sendPdf(res, report);
});

export const csvFinalGradesReport = asyncHandler(async (req, res) => {
  const report = await buildFinalGradesReport(req, req.validated.params.groupId);
  sendCsv(res, report);
});

export const xlsxFinalGradesReport = asyncHandler(async (req, res) => {
  const report = await buildFinalGradesReport(req, req.validated.params.groupId);
  await sendXlsx(res, report);
});

export const printInstrumentReport = asyncHandler(async (req, res) => {
  const report = await buildInstrumentReport(req, req.validated.params.instrumentId);
  sendHtml(res, report);
});

export const pdfInstrumentReport = asyncHandler(async (req, res) => {
  const report = await buildInstrumentReport(req, req.validated.params.instrumentId);
  await sendPdf(res, report);
});

export const csvInstrumentReport = asyncHandler(async (req, res) => {
  const report = await buildInstrumentReport(req, req.validated.params.instrumentId);
  sendCsv(res, report);
});

export const xlsxInstrumentReport = asyncHandler(async (req, res) => {
  const report = await buildInstrumentReport(req, req.validated.params.instrumentId);
  await sendXlsx(res, report);
});
