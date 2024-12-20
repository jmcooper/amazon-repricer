import axios from 'axios'

import { fetchAmazonAccessToken } from './amazon-auth.js'
import { chunkArray } from './utils.js'

export async function getOffersForAsins(asinsArray) {
  const { accessToken } = await fetchAmazonAccessToken()

  const uniqueAsins = [...new Set(asinsArray)]
  const batches = chunkArray(uniqueAsins, 20)

  let aggregatedResults = []
  let first = true
  for (const asinsBatch of batches) {
    let retries = 0
    if (!first)
      await delay(6000)
    let result = await getOffersForAsinBatch(asinsBatch, accessToken)
    while (!result && retries < 2) {
      retries++
      console.log(`Re-fetching offers (retry # ${retries}) `)
      await delay(13000 * retries)
      result = await getOffersForAsinBatch(asinsBatch, accessToken)
    }
    aggregatedResults = aggregatedResults.concat(result)
    first = false
  }

  return aggregatedResults
}

export async function fetchFbaInventorySummaries() {
  const usaMarketplaceId = process.env.USA_MARKETPLACE_ID;
  const url = `https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?granularityType=Marketplace&granularityId=${usaMarketplaceId}&marketplaceIds=${usaMarketplaceId}&details=true`;

  const { accessToken } = await fetchAmazonAccessToken()

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-access-token': accessToken,
        'content-type': 'application/json',
      },
      cache: 'no-store', // Avoid static caching
    });

    if (!response.ok) {
      // console.error('Error fetching inventory summaries', response)
      throw new Error(`Error fetching inventory summaries: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return JSON-formatted inventory summaries
  } catch (error) {
    console.error('Error fetching inventory summaries:', error.message);
  }
}

async function getOffersForAsinBatch(asinsArrayBatch, accessToken) {
  console.log('getting batch size', asinsArrayBatch.length)
  const url = 'https://sellingpartnerapi-na.amazon.com/batches/products/pricing/v0/itemOffers';

  const marketplaceId = process.env.USA_MARKETPLACE_ID;  // Replace with your marketplace ID (US Marketplace example)

  const requestBody = {
    requests: asinsArrayBatch.map(asin => ({
      uri: `/products/pricing/v0/items/${asin}/offers`,
      method: 'GET',
      MarketplaceId: marketplaceId,
      ItemCondition: 'Used'
    }))
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,  // Replace with your access token
        'x-amz-access-token': accessToken,    // Replace with your Amazon access token
        'Content-Type': 'application/json'
      },
    });

    if (response.status !== 200) {
      throw new Error(`Error fetching offers: ${response.statusText}`);
    }

    return response.data.responses.map(r => r.body.payload);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

export async function updateItemPrice(sku, newPrice) {
  const { accessToken } = await fetchAmazonAccessToken()
  const url = encodeURI(`https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${process.env.SELLER_ID}/${sku}?marketplaceIds=${process.env.USA_MARKETPLACE_ID}&issueLocale=en_US`)
  const body = buildBodyForPriceUpdateRequest(newPrice)

  let response = { data: { status: '' } }
  let retries = 0
  try {
    while (response.data.status !== 'ACCEPTED' && retries < 3) {
      if (retries > 0) await delay(5000 * retries)
      try {
        retries++
        if (retries > 1) console.log(`Retrying price update for ${sku}. Retry # ${retries}`)
        response = await attemptPriceUpdate(url, body, accessToken)
      }
      catch (err) {
        console.log(`Error updating price for ${sku}`, err.code, err.status, err.message)
        if (retries > 2) throw err
      }
    }

    if (response.data.status !== 'ACCEPTED') {
      return { sku, success: false }
    }

    return { sku, success: true }
  } catch (err) {
    console.log('Error Updating Item Price', err.code, err.status, err.message)
    return { sku, success: false }
  }
}

async function attemptPriceUpdate(url, body, accessToken) {
  return await axios.patch(url, body, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
      'x-amz-marketplace-id': process.env.USA_MARKETPLACE_ID
    },
  })
}
function buildBodyForPriceUpdateRequest(newPrice) {
  return {
    productType: 'ABIS_BOOK',
    patches: [
      {
        op: 'replace',
        path: '/attributes/purchasable_offer',
        value: [
          {
            audience: "ALL",
            marketplace_id: process.env.USA_MARKETPLACE_ID,
            currency: "USD",
            our_price: [{ schedule: [{ value_with_tax: newPrice }] }]
          }
        ]
      }
    ]
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getInventory() {
  const { accessToken } = await fetchAmazonAccessToken();

  if (!accessToken) {
    console.error('Unable to retrieve access token');
    return;
  }

  // Example: Call the Listings Items API to get SKU, Title, Price, etc.
  const url = `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items?marketplaceIds=${process.env.USA_MARKETPLACE_ID}&includedData=issues,attributes,summaries,offers,fulfillmentAvailability`;

  const headers = {
    'x-amz-access-token': accessToken,
    'content-type': 'application/json',
    // Add other necessary headers here, including the AWS signature headers
  };

  try {
    fetch(url, {
      method,
      headers,
      cache: 'no-store', // Prevent caching
    }).then(r => console.log('response', r))
      .catch(e => console.lolg('error', e))

    const response = await fetch(url, {
      method,
      headers,
      cache: 'no-store', // Prevent caching
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error making SP-API request:', error);
  }
}