import dotenv from 'dotenv'
import { DatabasePool, createPool, sql } from 'slonik'

dotenv.config()

interface TransactionHistoryEntry {
  // ISO format is fine
  timestamp: string
  direction: 'in' | 'out'
  // Different assets have different decimals. We store everything in absolute
  // value, but we want use decimals in the CSV report.
  volume: string
  symbol: string
}

type TransactionHistory = TransactionHistoryEntry[]

async function retrieveDataForUser(db: DatabasePool, id: string): Promise<TransactionHistory> {
  const result = db.many(sql.unsafe`
  select ...
  `)

  return []
}

async function main() {
  const e = process.env
  const pool = await createPool(`postgres://${e.PGUSER}:${e.PGPASSWORD}@${e.PGHOST}:${e.PGPORT}/${e.PGDATABASE}`)

  const result = await pool.oneFirst(sql.unsafe`select 'Hello!'`)
  console.dir(result)

  // This user ID actually exists
  // await retrieveDataForUser(pool, '3728e292-f556-4e71-9203-c8969ec1090b')

  await pool.end()
}

main().then()