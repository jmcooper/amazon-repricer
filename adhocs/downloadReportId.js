import dotenv from 'dotenv'
import { fetchAmazonAccessToken } from './app/amazon/amazon-auth.js'
import { getInventoryReport, downloadReport, writeReportTextToFile } from './app/amazon/seller-api-reports.js'


dotenv.config()

const reportId = 'amzn1.spdoc.1.4.na.85c432ce-3b2d-4303-b146-522d70b37f3c.T3TYFZBZS3HHU9.2650'
const { accessToken } = await fetchAmazonAccessToken()
const reportText = await downloadReport(accessToken, reportId)

writeReportTextToFile(reportId, reportText)