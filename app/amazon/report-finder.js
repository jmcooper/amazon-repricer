import fs from 'fs';
import path from 'path';
import { parseReport } from './report-parser.js';

export function getInventoryPlanningReportRecordsByFilename(filename) {
  const reportFilepath = path.join(process.cwd(), 'reports', 'inventory-planning', filename)

  return parseReport(fs.readFileSync(reportFilepath, 'utf8'))
}

export function findMostRecentReportFile(reportType) {
  const reportDirectory = path.join(process.cwd(), 'reports', reportType)

  const filenames = fs.readdirSync(reportDirectory).filter(file => file.endsWith('.tab'))

  if (filenames.length === 0) {
    console.log('No files found in the directory.')
    return {}
  }

  let mostRecentFile = filenames[0]
  let mostRecentDate = dateFromFilename(mostRecentFile)

  filenames.forEach(filename => {
    const fileDate = dateFromFilename(filename)
    if (fileDate > mostRecentDate) {
      mostRecentDate = fileDate
      mostRecentFile = filename
    }
  })

  return {
    recentReportFilepath: path.join(reportDirectory, mostRecentFile),
    recentReportDate: mostRecentDate,
    recentReportFilename: mostRecentFile
  }
}

function dateFromFilename(filename) {
  const isoDate = filename.replace(/_/g, ':').replace('.tab', '')
  return new Date(isoDate);
}