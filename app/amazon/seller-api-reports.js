import { fetchAmazonAccessToken } from './amazon-auth.js'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { findMostRecentReportFile } from './report-finder.js'

async function getReport(reportType, cacheDir) {
  const cachedFileInfo = findMostRecentReportFile(cacheDir);

  const cachedReport = getCachedReport(cachedFileInfo)
  if (cachedReport) return cachedReport

  console.log(`Retrieving fresh ${cacheDir} report`);
  const { accessToken } = await fetchAmazonAccessToken()
  try {
    clearOffersCache()

    const reportId = await requestReport(reportType, accessToken)

    const reportDocumentId = await waitForReportAndReturnDocumentId(accessToken, reportId)

    const reportText = await downloadReport(accessToken, reportDocumentId)

    const reportFileName = writeReportTextToFile(reportDocumentId, reportText)

    return { reportText, reportFileName }
  } catch (error) {
    console.error('Error requesting report:', error.message);
  }
}

export async function getInventoryAgeDataReport() {
  return await getReport('GET_FBA_INVENTORY_AGED_DATA', 'inventory-age')
}

export async function getInventoryReport() {
  return await getReport('GET_FBA_INVENTORY_PLANNING_DATA', 'inventory-planning')
}

async function getReportStatus(accessToken, reportId) {
  console.log('getting report status')
  const url = `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports/${reportId}`;

  try {
    const response = await axios.get(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (response.status !== 200) {
      throw new Error(`Error fetching report status: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching report status:', error.message);
  }
}

export async function downloadReport(accessToken, reportDocumentId) {
  const url = `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${reportDocumentId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.log('Error downloading report', response)
      throw new Error(`Error downloading report: ${response.statusText}`);
    }

    const data = await response.json();
    const downloadUrl = data.url;

    console.log('Downloading Report')
    // Fetch the actual report content from the download URL
    const reportResponse = await fetch(downloadUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const reportText = await reportResponse.text();
    return reportText;
  } catch (error) {
    console.error('Error downloading report:', error.message)
  }
}

export function writeReportTextToFile(reportText, extension) {
  const ext = extension ?? 'tab'
  console.log('Writing report to disk', reportText.substr(0, 20))
  const reportsDir = path.join(process.cwd(), 'reports', 'inventory-planning')
  const isoDateFormattedForValidFilename = new Date().toISOString().replace(/[:]/g, '_')
  const fileName = `${isoDateFormattedForValidFilename}.${ext}`
  const filePath = path.join(reportsDir, fileName)

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  try {
    fs.writeFileSync(filePath, reportText, 'utf8')
    return fileName
  } catch (err) {
    console.error('Error writing the file:', err)
  }
}

function getCachedReport({ recentReportFilepath, recentReportDate, recentReportFilename }) {
  const twentyFourHours = 24 * 60 * 60 * 1000
  if ((new Date() - recentReportDate) <= (twentyFourHours) ? true : false) {
    console.log('Returning cached file:', recentReportFilepath)
    const reportText = fs.readFileSync(recentReportFilepath, 'utf8')
    return { reportText, reportFileName: recentReportFilename }
  }
  return null
}

async function requestReport(reportType, accessToken) {
  const url = 'https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports'
  const body = { reportType, marketplaceIds: ['ATVPDKIKX0DER'], };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Error requesting report: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  return data.reportId;
}

async function waitForReportAndReturnDocumentId(accessToken, reportId) {
  let reportStatus = 'IN_PROGRESS';
  let reportDocumentId = null;

  while (reportStatus === 'IN_PROGRESS' || reportStatus === 'IN_QUEUE') {
    const statusResponse = await getReportStatus(accessToken, reportId)
    reportStatus = statusResponse.processingStatus

    console.log(statusResponse, reportStatus)
    reportDocumentId = statusResponse.reportDocumentId;
    if (reportStatus === 'FATAL') {
      throw new Error('Report request failed with FATAL status.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  return reportDocumentId
}

function clearOffersCache() {
  const cacheDir = path.join(process.cwd(), 'reports', 'offers-cache')

  try {
    const files = fs.readdirSync(cacheDir)

    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(cacheDir, file))
        console.log(`${file} cache was deleted`)
      }
    })
  } catch (err) {
    console.error('Error clearing offer cache:', err)
  }
}