import fs from 'fs';
import path from 'path';

export function findMostRecentReportFile(reportType) {
  const reportDirectory = path.join(process.cwd(), 'reports', reportType)

  const filenames = fs.readdirSync(reportDirectory).filter(file => file.endsWith('.tab'))

  if (filenames.length === 0) {
    console.log('No files found in the directory.')
    return null
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
    recentReportDate: mostRecentDate
  }
}

function dateFromFilename(filename) {
  const isoDate = filename.replace(/_/g, ':').replace('.tab', '')
  console.log('isoDate', isoDate)
  return new Date(isoDate);
}