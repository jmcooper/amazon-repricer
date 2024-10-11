export function sortByInventoryAge(sortDirection) {
  return (a, b) => {
    const aAge = getOldestAgeBucket(a)
    const bAge = getOldestAgeBucket(b)

    if (aAge > bAge) return sortDirection == 'desc' ? -1 : 1;
    if (aAge < bAge) return sortDirection == 'desc' ? 1 : -1;
    return 0;
  }

  function getOldestAgeBucket(record) {
    if (record['inv-age-365-plus-days'] > 0) return 5
    else if (record['inv-age-271-to-365-days'] > 0) return 4
    else if (record['inv-age-181-to-270-days'] > 0) return 3
    else if (record['inv-age-91-to-180-days'] > 0) return 2
    else if (record['inv-age-0-to-90-days'] > 0) return 1

    return 0
  }
}