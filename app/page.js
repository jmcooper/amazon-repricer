import Image from "next/image"
import styles from "./page.module.css"
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
  const filteredSummaries = [];
  console.log(inventoryReport)
  // const listings = await fetchFbaInventorySummaries()

  // let filteredSummaries = []
  // if (listings && listings.payload && listings.payload.inventorySummaries) {
  //   filteredSummaries = listings.payload.inventorySummaries.filter(s => s.inventoryDetails.fulfillableQuantity > 0)
  // } else {
  //   console.error('No inventory data received');
  // }

  return (
    <div>
      <h1>Seller Inventory</h1>
      {filteredSummaries.length > 0 ? (
        <ul>
          {filteredSummaries.map((item, index) => (
            <li key={index}>
              <p>ASIN: {item.asin}</p>
              <p>FNSKU: {item.fnSku}</p>
              <p>SKU: {item.sellerSku}</p>
              <p>Title: {item.productName}</p>
              {/* <p>Price: {item.price ? item.price.amount : 'N/A'}</p>
              <p>Rank: {item.salesRankings ? item.salesRankings[0]?.rank : 'N/A'}</p> */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading inventory...</p>
      )}
    </div>
  );
}
