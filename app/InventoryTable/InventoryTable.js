'use client'
import Image from "next/image";
import { useState, useEffect, useRef } from 'react'
import styles from './InventoryTable.module.scss'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getOffers } from '../actions'
import checkmark from './checkmark.png'

export default function InventoryTable({ products, cacheKey, pageCount }) {
  const [sortedProducts, setSortedProducts] = useState(products)
  const [keyedOffers, setKeyedOffers] = useState(null)
  const [updatedPricesBySku, setUpdatedPricesBySku] = useState({})
  const searchParams = useSearchParams()
  const pathName = usePathname()

  const currentPageNumber = searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 1
  const ageSortDirection = searchParams.get('ageSort') ?? 'desc'

  useEffect(() => {
    if (keyedOffers) {
      calculateAndSetListPrices()
    }
  }, [keyedOffers])

  useEffect(() => {
    async function fetchOffers() {
      const keyedOffersObject = await getOffers(products.map(p => p.asin))
      setKeyedOffers(keyedOffersObject)
    }
    setSortedProducts(products)
    fetchOffers()
  }, [products])

  function calculateAndSetListPrices() {
    const skuKeyedNewPrices = products.reduce((acc, p) => {
      const offers = keyedOffers[p.asin]
      const buyBoxPrice = offers?.usedBuyBoxPrice ?? null
      const twentyPercentBelowLowestFBAPrice = offers?.fbaOffers[0]?.amount * .8
      const fivePercentBelowLowestFBAPrice = offers?.fbaOffers[0]?.amount * .95
      const lowestFBAPrice = offers?.fbaOffers[0]?.amount
      const secondLowestFBAPrice = offers?.fbaOffers[1]?.amount ?? lowestFBAPrice
      const thirdLowestFBAPrice = offers?.fbaOffers[2]?.amount ?? secondLowestFBAPrice
      const fourthLowestFBAPrice = offers?.fbaOffers[3]?.amount ?? thirdLowestFBAPrice
      const highestFBAPrice = offers?.fbaOffers[offers?.fbaOffers.length - 1]?.amount

      let newPriceInfo = { newListPrice: p['your-price'] }

      if (!lowestFBAPrice && !buyBoxPrice) {
        newPriceInfo.alertLevel = 'alert'
        newPriceInfo.alertReason = 'Not Enough Offer Data'
      }
      else if (p['inv-age-365-plus-days'] + p['inv-age-91-to-180-days'] + p['inv-age-181-to-270-days'] + p['inv-age-271-to-365-days'] > 0) {
        newPriceInfo.newListPrice = lowestOf(twentyPercentBelowLowestFBAPrice, buyBoxPrice)
        newPriceInfo.ruleUsed = 'L20PFBA'
      } else {
        if (p['sales-rank'] > 3000000) {
          newPriceInfo.newListPrice = lowestOf(twentyPercentBelowLowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = 'L20PFBA'
        } else if (p['sales-rank'] > 2000000) {
          newPriceInfo.newListPrice = highestOf(twentyPercentBelowLowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = 'H20PFBA'
        } else if (p['sales-rank'] > 1000000) {
          newPriceInfo.newListPrice = highestOf(fivePercentBelowLowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = '5PFBA'
        } else if (p['sales-rank'] > 500000) {
          newPriceInfo.newListPrice = highestOf(lowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = 'LFBA'
        } else if (p['sales-rank'] > 100000) {
          newPriceInfo.newListPrice = highestOf(secondLowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = '2LFBA'
        } else {
          newPriceInfo.newListPrice = highestOf(thirdLowestFBAPrice, buyBoxPrice)
          newPriceInfo.ruleUsed = '3LFBA'
        }
        if (p['sales-rank'] < 1000000) {
          if (highestFBAPrice - lowestFBAPrice > 20 || fourthLowestFBAPrice - lowestFBAPrice > 10) {
            newPriceInfo.alertLevel = 'warning'
            newPriceInfo.alertReason = 'Check for gap in FBA Offers'
          }
        }
      }
      if (!isValidNumber(newPriceInfo.newListPrice)) {
        newPriceInfo.alertLevel = 'alert'
        newPriceInfo.alertReason = 'Missing price'
      }
      else if (p['your-price'] - newPriceInfo.newListPrice > 50) {
        newPriceInfo.alertLevel = 'alert'
        newPriceInfo.alertReason = 'Price dropped more than $50'
      } else if (p['your-price'] - newPriceInfo.newListPrice > 20) {
        newPriceInfo.alertReason = 'Price dropped more than $20'
        newPriceInfo.alertLevel = 'warning'
      }
      acc[p.sku] = newPriceInfo
      return acc
    }, {})
    setUpdatedPricesBySku(skuKeyedNewPrices)
  }

  function isValidNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function lowestOf(...args) {
    const values = args.filter(a => !!a)
    const lowest = Math.min(...values.filter(n => !isNaN(n) && n > 0))
    return Math.max(lowest, 9)
  }

  function highestOf(...args) {
    const values = args.filter(a => !!a)
    const highest = Math.max(...values.filter(n => !isNaN(n) && n > 0))
    return Math.max(highest, 9)
  }

  function handlePriceChange(event, sku) {
    console.log('pricechange')
    const newSkuePriceInfo = { ...updatedPricesBySku[sku] }
    newSkuePriceInfo.newListPrice = parseFloat(event.target.value)
    if (isValidNumber(newSkuePriceInfo.newListPrice))
      setUpdatedPricesBySku(prev => ({ ...prev, [sku]: newSkuePriceInfo }))
  }

  function updatePrice(sku, price) {
    setUpdatedPricesBySku(prev => ({ ...prev, [sku]: { ...prev[sku], newListPrice: price } }))
  }

  const ascendingArrow = (
    <svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="50,20 90,60 10,60" fill="#9eccf1" />
    </svg>
  )

  const descendingArrow = (
    <svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="50,60 10,20 90,20" fill="#9eccf1" />
    </svg>
  )

  const upArrow = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 20" width="11" height="16">
      <polygon points="7,0 0,10 14,10" fill="green" />
      <rect x="4" y="10" width="6" height="10" fill="green" />
    </svg>
  )

  const downArrow = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 20" width="11" height="16">
      <polygon points="7,20 0,10 14,10" fill="red" />
      <rect x="4" y="0" width="6" height="10" fill="red" />
    </svg>
  )

  function getPriceRuleText(rule) {
    switch (rule) {
      case 'L20PFBA':
        return '20% less than the lowest FBA offer OR Buy Box, whichever is lower.'
      case 'H20PFBA':
        return '20% less than the lowest FBA offer OR Buy Box, whichever is higher.'
      case '5PFBA':
        return '5% less than the lowest FBA offer OR Buy Box, whichever is higher'
      case 'LFBA':
        return 'Match the lowest FBA offer OR Buy Box, whichever is higher'
      case '2LFBA':
        return 'Match the 2nd lowest FBA offer OR Buy Box, whichever is higher'
      case '3LFBA':
        return 'Match the 3rd lowest FBA offer OR Buy Box, whichever is higher'
    }
  }

  function getPriceArrow(newPrice, oldPrice) {
    if (newPrice > oldPrice)
      return upArrow

    if (newPrice < oldPrice)
      return downArrow

    return null
  }

  function renderPagination() {
    const backButtonsDisabled = currentPageNumber === 1
    const forwardButtonsDisabled = currentPageNumber === pageCount
    return (
      <div className={styles.pagination}>
        <Link href={`${pathName}?page=1&ageSort=${ageSortDirection}`}><button className={styles.arrow} disabled={backButtonsDisabled}>&laquo;</button></Link>
        <Link href={`${pathName}?page=${currentPageNumber - 1}&ageSort=${ageSortDirection}`}><button className={styles.arrow} disabled={backButtonsDisabled}>&lsaquo;</button></Link>
        {[...Array(pageCount)].map((_, i) => (
          <Link href={`${pathName}?page=${i + 1}&ageSort=${ageSortDirection}`} key={i + 1}><button className={styles.page}>{i + 1}</button></Link>
        ))}
        <Link href={`${pathName}?page=${currentPageNumber + 1}&ageSort=${ageSortDirection}`}><button className={styles.arrow} disabled={forwardButtonsDisabled}>&rsaquo;</button></Link>
        <Link href={`${pathName}?page=${pageCount}&ageSort=${ageSortDirection}`}><button className={styles.arrow} disabled={forwardButtonsDisabled}>&raquo;</button></Link>
      </div>
    )
  }

  return (
    <>
      {renderPagination()}
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th className={styles.titleColumn}>Title</th>
              <th className={`${styles.center} ${styles.pointer}`}>
                <Link href={`${pathName}?page=${currentPageNumber}&ageSort=${ageSortDirection === 'desc' ? 'asc' : 'desc'}`}>
                  Max Age{ageSortDirection === 'desc' ? descendingArrow : ascendingArrow}
                </Link>
              </th>
              <th className={styles.right}>Rank</th>
              <th className={styles.right}>List Price</th>
              <th className={styles.left}>Rule</th>
              <th className={styles.spacer}>&nbsp;</th>
              <th className={styles.right}>FBA</th>
              <th className={styles.right}>Buy Box</th>
              <th className={styles.right}>FBM</th>
              <th className={styles.spacer}>&nbsp;</th>
              <th className={`${styles.right} ${styles.storageCost}`}>Storage Cost Next Month</th>
            </tr>
          </thead>
          {
            sortedProducts.map((product, index) => (
              <tbody key={index}>
                {updatedPricesBySku[product.sku] && updatedPricesBySku[product.sku].alertLevel
                  ? <>
                    <tr className={styles.alertPaddingTop}><td>&nbsp;</td></tr>
                    <tr className={`${styles.alertMessage} ${getAlertLevelClass(product.sku)}`}>
                      <td colSpan="12">{updatedPricesBySku[product.sku].alertReason}</td>
                    </tr>
                    <tr className={styles.alertPaddingBottom}><td>&nbsp;</td></tr>
                  </>
                  : null
                }
                < tr>
                  <td><a target="_blank" href={encodeURI(`https://sellercentral.amazon.com/myinventory/inventory?searchField=sku&sku=${product.sku}`)}>{product.sku}</a></td>
                  <td className={styles.titleColumn}>
                    <a target="_blank" href={`https://www.amazon.com/dp/${product.asin}`}>{product['product-name']}</a>
                  </td>
                  <td className={`${styles.center} ${getAgeColor(product)}`}>{getMaxAge(product)}</td>
                  <td className={`${styles.right} ${getSalesRankClass(product['sales-rank'])}`}>
                    {new Intl.NumberFormat('en-US').format(product['sales-rank'])}
                  </td>
                  <td>
                    <input className={styles.pointer} onChange={(e) => handlePriceChange(e, product.sku)} value={updatedPricesBySku?.[product.sku]?.newListPrice?.toFixed(2) || ''} />
                    {getPriceArrow(updatedPricesBySku?.[product.sku]?.newListPrice, product['your-price'])}
                    <br />
                    <div className={`${styles.strike} ${styles.right} ${styles.oldPrice}`}>
                      {formatCurrency(product['your-price'])}
                    </div>
                  </td>
                  <td className={styles.pricingRule} title={getPriceRuleText(updatedPricesBySku?.[product.sku]?.ruleUsed)}>
                    {updatedPricesBySku?.[product.sku]?.ruleUsed}
                  </td>
                  <td className={styles.spacer}>&nbsp;</td>
                  {
                    !keyedOffers || !keyedOffers?.[product.asin]
                      ? <td colSpan="3" className={styles.loading}>Loading offers...</td>
                      : <>
                        <td className={styles.offers}>
                          <ul>
                            <li>({keyedOffers[product.asin].numberOfFbaOffers} offers)</li>
                            {renderOffers(keyedOffers?.[product.asin]?.fbaOffers, product.sku)}
                          </ul>
                        </td>
                        <td className={`${styles.right}`}>
                          <div className={styles.buyBox}>
                            <span className={styles.price} onClick={(e) => updatePrice(product.sku, keyedOffers?.[product.asin]?.usedBuyBoxPrice)}>
                              {formatCurrency(keyedOffers?.[product.asin]?.usedBuyBoxPrice)} (U)
                            </span>
                            {keyedOffers?.[product.asin]?.wonBuyBox && <span> <Image height="25" width="25" layout="fixed" src={checkmark} alt="BuyBox Awarded" /></span>}
                          </div>
                          <div className={styles.gray}>{formatCurrency(keyedOffers?.[product.asin]?.newBuyBoxPrice)} (N)</div>
                        </td>
                        <td className={styles.offers}>
                          <ul>
                            <li>({keyedOffers[product.asin].numberOfFbmOffers} offers)</li>
                            {renderOffers(keyedOffers?.[product.asin]?.fbmOffers, product.sku)}
                          </ul>
                        </td>
                      </>
                  }
                  <td className={styles.spacer}></td>
                  <td className={styles.right}>
                    {formatCurrency(product['estimated-storage-cost-next-month'])}
                  </td>

                </tr>
              </tbody>
            ))
          }
        </table >
      </div >

      {renderPagination()}
    </>
  )

  function getAlertLevelClass(sku) {
    if (updatedPricesBySku?.[sku]?.alertLevel === 'alert')
      return styles.alert
    else if (updatedPricesBySku?.[sku]?.alertLevel === 'warning')
      return styles.warning
  }
  function renderOffers(offers, sku) {
    if (offers?.length > 0)
      return offers.map((o, i) => (
        <li key={i}>
          <span className={styles.price} onClick={(e) => updatePrice(sku, o.amount)}>
            {getConditionCode(o.condition)} - {formatCurrency(o.amount)}
          </span>
        </li>)
      )
    else
      return null
  }

  function getConditionCode(condition) {
    switch (condition) {
      case 'like_new':
        return 'LN'
      case 'very_good':
        return 'VG'
      case 'good':
        return 'G'
      case 'acceptable':
        return 'A'
      default:
        return condition
    }
  }

  function formatCurrency(amount) {
    if (!amount)
      return '-'
    return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  function getSalesRankClass(rank) {
    if (rank < 1000000) {
      return styles.green;
    } else if (rank < 2000000) {
      return styles.yellow;
    } else {
      return styles.red
    }
  }

  function getMaxAge(product) {
    //inv-age-0-to-90-days	inv-age-91-to-180-days	inv-age-181-to-270-days	inv-age-271-to-365-days	inv-age-365-plus-days
    if (product['inv-age-365-plus-days'] > 0) {
      return '365+'
    } else if (product['inv-age-271-to-365-days'] > 0) {
      return '271-365'
    } else if (product['inv-age-181-to-270-days'] > 0) {
      return '181-270'
    } else if (product['inv-age-91-to-180-days'] > 0) {
      return '91-180'
    } else if (product['inv-age-0-to-90-days'] > 0) {
      return '0-90'
    }
  }

  function getAgeColor(product) {
    //inv-age-0-to-90-days	inv-age-91-to-180-days	inv-age-181-to-270-days	inv-age-271-to-365-days	inv-age-365-plus-days
    if (product['inv-age-365-plus-days'] > 0 || product['inv-age-271-to-365-days'] > 0 || product['inv-age-181-to-270-days'] > 0) {
      return styles.red;
    } else if (product['inv-age-91-to-180-days'] > 0) {
      return styles.yellow;
    } else if (product['inv-age-0-to-90-days'] > 0) {
      return styles.green;
    }
  }
}