'use server'
import fs from 'fs'
import path from 'path'
import { getOffersForAsins } from "./amazon/seller-api"

export async function getOffers(asins) {
  const cachedOffers = getRecentlyCachedOffers()

  const asinsWithNoCachedOffers = asins.filter(a => !cachedOffers[a])

  if (asinsWithNoCachedOffers.length === 0)
    return cachedOffers

  const fetchedOffers = await getOffersForAsins(asinsWithNoCachedOffers)
  const keyedOffers = fetchedOffers.filter(o => !!o)
    .reduce((acc, o) => { acc[o.ASIN] = transformOffer(o); return acc; }, {})

  const allOffers = { ...cachedOffers, ...keyedOffers }
  cacheOffers(allOffers)

  return keyedOffers
}

function transformOffer(offer) {
  let usedBuyBoxPrice = null
  if (offer?.Summary?.BuyBoxPrices?.length > 0) {
    const usedOffer = offer.Summary.BuyBoxPrices.find(bb => bb.condition === 'Used')
    usedBuyBoxPrice = usedOffer?.ListingPrice?.Amount
  }

  let newBuyBoxPrice = null
  if (offer?.Summary?.BuyBoxPrices?.length > 0) {
    const newOffer = offer.Summary.BuyBoxPrices.find(bb => bb.condition === 'New')
    newBuyBoxPrice = newOffer?.ListingPrice?.Amount
  }

  const fbaOffers = offer?.Offers?.filter(o => o.IsFulfilledByAmazon)
    .map(fbaOffer => ({ amount: fbaOffer?.ListingPrice?.Amount, condition: fbaOffer.SubCondition }))
    .sort((a, b) => a.amount - b.amount)

  const fbmOffers = offer?.Offers?.filter(o => !o.IsFulfilledByAmazon)
    .map(fbaOffer => ({ amount: fbaOffer?.ListingPrice?.Amount, condition: fbaOffer.SubCondition }))
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 10)

  const numberOfFbaOffers = offer?.Summary?.NumberOfOffers?.find(n => n.condition === 'used' && n.fulfillmentChannel === 'Amazon')?.OfferCount
  const numberOfFbmOffers = offer?.Summary?.NumberOfOffers?.find(n => n.condition === 'used' && n.fulfillmentChannel === 'Merchant')?.OfferCount

  const fbaBuyBoxOffer = offer?.Offers?.filter(o => o.IsFulfilledByAmazon && o.IsBuyBoxWinner)

  const wonBuyBox = fbaBuyBoxOffer?.SellerId === process.env.SELLER_ID

  return {
    asin: offer.ASIN,
    usedBuyBoxPrice,
    newBuyBoxPrice,
    wonBuyBox,
    fbaOffers,
    fbmOffers,
    numberOfFbaOffers,
    numberOfFbmOffers
  }
}

function getRecentlyCachedOffers() {
  const cacheFilepathForPage = path.join(process.cwd(), 'reports', `offers-cache.json`)
  let cachedOffers = {}
  try {
    const stats = fs.statSync(cacheFilepathForPage)
    const fileAgeInHours = (Date.now() - new Date(stats.mtime).getTime()) / (1000 * 60 * 60)
    if (fileAgeInHours < 2) {
      const cacheFileContents = fs.readFileSync(cacheFilepathForPage, 'utf8')
      cachedOffers = JSON.parse(cacheFileContents)
    }
    return cachedOffers
  }
  catch {
    return {}
  }
}

function cacheOffers(keyedOffers) {
  if (!keyedOffers || Object.keys(keyedOffers).length === 0) return

  const cacheFilepathForPage = path.join(process.cwd(), 'reports', 'offers-cache.json')
  fs.writeFileSync(cacheFilepathForPage, JSON.stringify(keyedOffers), 'utf8')
}
