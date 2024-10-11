import dotenv from 'dotenv'
import { getInventoryAgeDataReport, getInventoryReport, downloadReport, writeReportTextToFile } from '../app/amazon/seller-api-reports.js'
import { getOffersForAsins } from '../app/amazon/seller-api.js'

dotenv.config()


getInventoryAgeDataReport();



async function getOffers() {
  const asins = [
    '1118073746', '1598166220',
    '1609075811', '1640951830',
    '1583712380', 'B0019T5H4K',
    'B003XNBZK0', '1581572638',
    '0692992677', '1118006720',
    '0823056538', '1483350975',
    '1555178790', '1591166829',
    '1781162646', '1737900408',
    '1629727784', '0060882085',
    '1737900408', 'B000YQWQZ2'
  ]

  const offers = await getOffersForAsins(asins)
  console.log(offers[0].Summary.BuyBoxPrices)
}


