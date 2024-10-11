'use server'
import fs from 'fs'
import path from 'path'
import { getOffersForAsins } from "./amazon/seller-api"

export async function getOffers(records, pageNumberForCaching, sortOrderForCaching) {
  const pageNumber = pageNumberForCaching ?? 1
  const sortOrder = sortOrderForCaching ?? 'desc'
  const cachedOffers = getRecentlyCachedOffers(pageNumber, sortOrder)

  if (cachedOffers) return cachedOffers;

  const offers = await getOffersForAsins(records.map(r => r.asin))
  const keyedOffers = offers.filter(o => !!o)
    .reduce((acc, o) => { acc[o.ASIN] = transformOffer(o); return acc; }, {})

  cacheKeyedOffers(keyedOffers, pageNumber, sortOrderForCaching)

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

function getRecentlyCachedOffers(pageNumberForCaching, sortOrderForCaching) {
  const cacheFilepathForPage = path.join(process.cwd(), 'reports', 'offers-cache', `page${pageNumberForCaching}-sort${sortOrderForCaching}-cache.json`)
  let cachedOffers = null
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
    //No file cache available
    return null
  }
}

function cacheKeyedOffers(keyedOffers, pageNumberForCaching, sortOrderForCaching) {
  const cacheFilepathForPage = path.join(process.cwd(), 'reports', 'offers-cache', `page${pageNumberForCaching}-sort${sortOrderForCaching}-cache.json`)
  fs.writeFileSync(cacheFilepathForPage, JSON.stringify(keyedOffers), 'utf8')
}
