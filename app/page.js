import styles from "./Home.module.scss"

import { getInventoryReport } from "./amazon/seller-api-reports";
import InventoryTable from "./InventoryTable/InventoryTable";
import { parseReport } from "./amazon/report-parser";
import { getPage, pageSize } from "./pagination";

export default async function Home({ searchParams }) {
  const { reportText, reportFileName } = await getInventoryReport()
  const records = parseReport(reportText)

  const page = getPage(records, searchParams?.page ?? 1, searchParams?.ageSort ?? 'desc')

  return (
    <div className={styles.container}>
      <h1>My Inventory</h1>
      <InventoryTable products={page} cacheKey={reportFileName} pageCount={Math.ceil(records.length / pageSize)} />
    </div >
  );
}
