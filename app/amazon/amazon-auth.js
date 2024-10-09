export async function fetchAmazonAccessToken() {
  const url = 'https://api.amazon.com/auth/o2/token'

  // Ensure these environment variables are set in your .env.local file
  const refreshToken = process.env.AMAZON_REFRESH_TOKEN
  const clientId = process.env.AMAZON_CLIENT_ID
  const clientSecret = process.env.AMAZON_CLIENT_SECRET

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', refreshToken)
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params,
      cache: 'no-store' // Prevent static caching
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const data = await response.json()
    return { accessToken: data.access_token, expiresIn: data.expires_in }

  } catch (error) {
    console.error('Error fetching access token:', error.message)
    return null
  }
}


