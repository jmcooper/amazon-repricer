import Image from "next/image"
import styles from "./Home.module.css"
import tabParser from 'papaparse'

import { getInventoryReport } from "./amazon/seller-api-reports";
// import { useState } from 'react'

// import { fetchFbaInventorySummaries } from "./amazon/seller-api"

/*
Amazon App ID: AMAZON_APP_ID
Seller Central Base URL: SELLER_CENTRAL_BASE_URL
Vendor Central Base URL: VENDOR_CENTRAL_BASE_URL


OAuth
https://sellercentral.amazon.com/apps/authorize/consent?application_id={your application ID}

*/
export default async function Home() {
  const inventoryReport = await getInventoryReport()
  const parseConfig = {
    delimiter: '\t',
    header: true,
    dynamicTyping: true
  }
  const records = tabParser.parse(inventoryReport, parseConfig).data
  console.log(records[0])

  return (
    <div className={styles.container}>
      <h1>Seller Inventory</h1>
      {records.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ASIN</th>
              <th>FNSKU</th>
              <th>SKU</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item, index) => (
              <tr key={index}>
                  <td>{item.asin}</td>
                  <td>{item.fnsku}</td>
                  <td>{item.sku}</td>
                <div className={`${styles.gridRow} ${styles.gridSpan}`}>
                  Title: {item['product-name']}
                </div>
                {/* <p>Price: {item.price ? item.price.amount : 'N/A'}</p>
                <p>Rank: {item.salesRankings ? item.salesRankings[0]?.rank : 'N/A'}</p> */}
              </li>
            ))}
          </tbody>
        </ul>
      ) : (
        <p>Loading inventory...</p>
      )}
    </div>
  );
}
