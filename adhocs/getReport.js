import dotenv from 'dotenv'
import { fetchAmazonAccessToken } from '../app/amazon/amazon-auth.js'
import { getInventoryReport, downloadReport, writeReportTextToFile } from '../app/amazon/seller-api-reports.js'


dotenv.config()

const reportText = await getInventoryReport()
const formattedDate = getCurrentFormattedDate();
writeReportTextToFile(formattedDate, reportText)


function getCurrentFormattedDate() {
  const now = new Date().toISOString(); // Returns format: 2024-10-07T14:30:00.000Z

  const datePart = now.slice(0, 10);  // yyyy-MM-dd
  const timePart = now.slice(11, 16); // hh:mm

  return `${datePart}-${timePart.replace(':', '-')}`;
}

