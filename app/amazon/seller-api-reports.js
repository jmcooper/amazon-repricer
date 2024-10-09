import { fetchAmazonAccessToken } from './amazon-auth.js'
import axios from 'axios'
import fs from 'fs';
import path from 'path';

export async function getInventoryReport() {
  const url = 'https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports';
  const { accessToken } = await fetchAmazonAccessToken()

  const body = { reportType: 'GET_FBA_INVENTORY_PLANNING_DATA', marketplaceIds: ['ATVPDKIKX0DER'], };

  try {
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
      console.log(response)
      throw new Error(`Error requesting report: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const reportId = data.reportId;

    let reportStatus = 'IN_PROGRESS';
    let reportDocumentId = null;

    while (reportStatus === 'IN_PROGRESS' || reportStatus === 'IN_QUEUE') {
      const statusResponse = await getReportStatus(accessToken, reportId)
      reportStatus = statusResponse.processingStatus

      console.log(statusResponse, reportStatus)
      if (reportStatus === 'DONE') {
        reportDocumentId = statusResponse.reportDocumentId;
      } else if (reportStatus === 'FATAL') {
        throw new Error('Report request failed with FATAL status.');
      }
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    const report = await downloadReport(accessToken, reportDocumentId)

    return report

  } catch (error) {
    console.error('Error requesting report:', error.message);
  }
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

    // Fetch the actual report content from the download URL
    const reportResponse = await fetch(downloadUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const reportText = await reportResponse.text();
    return reportText; // The content of the report (CSV format)
  } catch (error) {
    console.error('Error downloading report:', error.message);
  }
}

export function writeReportTextToFile(reportDocumentId, reportText) {
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, `report-${reportDocumentId}.txt`);

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  try {
    fs.writeFileSync(filePath, reportText);
    console.log(`Report successfully written to ${filePath}`);
  } catch (err) {
    console.error('Error writing the file:', err);
  }
}
