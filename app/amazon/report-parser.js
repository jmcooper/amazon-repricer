import tabParser from 'papaparse'

export function parseReport(reportText) {
  const parseConfig = {
    delimiter: '\t',
    header: true,
  }
  return tabParser.parse(reportText, parseConfig).data
}