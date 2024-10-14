import tabParser from 'papaparse'

export function parseReport(reportText) {
  const parseConfig = {
    delimiter: '\t',
    header: true,
  }
  const records = tabParser.parse(reportText, parseConfig).data

  return records.map(r => convertTypes(r))
}

function convertTypes(r) {
  const ints = [
    'inv-age-0-to-90-days',
    'inv-age-365-plus-days',
    'inv-age-91-to-180-days',
    'inv-age-181-to-270-days',
    'inv-age-271-to-365-days'
  ]

  const floats = [
    'your-price',
    'sales-rank',
  ]

  const newRecord = { ...r }
  ints.forEach(i => newRecord[i] = parseInt(r[i]))
  floats.forEach(i => newRecord[i] = parseFloat(r[i]))

  return newRecord
}