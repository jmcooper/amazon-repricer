import { sortByInventoryAge } from "./inventory-sort"

export const pageSize = 100

export function getPage(records, pageNumber, ageSortDirection) {

  records.sort(sortByInventoryAge(ageSortDirection))

  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = startIndex + pageSize

  return records.slice(startIndex, endIndex)
}