import { fetchAmazonAccessToken } from './amazon-auth'

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



/*
export async function getInventory() {
  const { accessToken } = await fetchAmazonAccessToken();

  if (!accessToken) {
    console.error('Unable to retrieve access token');
    return;
  }

  // Example: Call the Listings Items API to get SKU, Title, Price, etc.
  const inventoryPath = `/listings/2021-08-01/items?marketplaceIds=${process.env.AMAZON_SELLER_ID}`; // Use appropriate marketplace ID
  return await makeSellerPortalApiRequest(accessToken, inventoryPath);
}

// Function to make signed SP-API request using AWS signature v4
async function makeSellerPortalApiRequest(accessToken, path, method = 'GET') {
  const host = 'sellingpartnerapi-na.amazon.com';

  const url = `https://${host}${path}`;

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
*/