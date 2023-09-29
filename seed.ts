import { faker } from '@faker-js/faker'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

interface Asset {
  id: string
  name: string
  symbol: string
  decimals: number
}

const availableAssets: Asset[] = [
  { id: '0D4C8043-5C33-4289-BD89-A53190D19044', name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  { id: '5621E725-EC39-4428-A6C8-8BC465347D1A', name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  { id: 'EEFCBA25-6020-4350-87A4-3FDD3ADE9A5C', name: 'Solana', symbol: 'SOL', decimals: 18 },
]

interface User {
  id: string
  firstName: string
  lastName: string
}

const availableUsers: User[] = [
  { id: '3728E292-F556-4E71-9203-C8969EC1090B', firstName: 'Lucas', lastName: 'Santoni' },
  { id: '84511A0E-6B97-49CC-98FB-065D5879B133', firstName: 'Antoine', lastName: 'Scalia' },
]

type Direction = 'in' | 'out'

interface Transaction {
  id: string
  userId: string
  timestamp: string
  direction: Direction
  volume: number
  assetId: string
}

function generateRandomTransactionForUser(user: User): Transaction {
  return {
    id: faker.string.uuid(),
    userId: user.id,
    timestamp: faker.date.between({ from: '2020-01-01T00:00:00.000Z', to: '2023-09-15T12:30:00.000Z' }).toISOString(),
    direction: faker.helpers.arrayElement(['in', 'out']),
    volume: faker.number.int({min: 1, max: 1_000_000 }),
    assetId: faker.helpers.arrayElement(availableAssets).id
  }
}

async function createTransactionHistoryForUser(db: Client, user: User, transactionsCount: number) {
  console.log(`${transactionsCount} transactions to insert`)

  for (let i = 0; i < transactionsCount; i++) {
    const transaction = generateRandomTransactionForUser(user)

    await db.query(`
    insert into transaction(id, user_id, timestamp, direction, volume, asset_id)
    values ($1, $2, $3, $4, $5, $6)
    `, [
      transaction.id,
      transaction.userId,
      transaction.timestamp,
      transaction.direction,
      transaction.volume,
      transaction.assetId
    ])

    console.log(`done ${i + 1}/${transactionsCount}`)
  }
}

async function createUsersIfNotExist(db: Client) {
  for (const user of availableUsers) {
    await db.query(`
    insert into "user"(id, first_name, last_name)
    values ($1, $2, $3)
    on conflict do nothing
    `, [
      user.id,
      user.firstName,
      user.lastName
    ])
  }
}

async function createAssetsIfNotExist(db: Client) {
  for (const asset of availableAssets) {
    await db.query(`
    insert into asset(id, name, symbol, decimals)
    values ($1, $2, $3, $4)
    on conflict do nothing
    `, [
      asset.id,
      asset.name,
      asset.symbol,
      asset.decimals
    ])
  }
}

async function main() {
  const client = new Client()
  await client.connect()
  console.log('connected')

  await client.query('begin')
  console.log('begin')

  await client.query(`
  drop table if exists transaction;
  drop table if exists asset;
  drop table if exists "user";

  drop type if exists direction;

  create table if not exists asset (
    id uuid unique not null,
    name text not null,
    symbol text not null,
    decimals numeric not null
  )
  ;

  create table if not exists "user" (
    id uuid unique not null,
    first_name text not null,
    last_name text not null
  )
  ;

  create type direction as enum ('in', 'out')
  ;

  create table if not exists transaction (
    id uuid unique not null,
    user_id uuid not null references "user"(id),
    "timestamp" timestamptz not null,
    direction direction not null,
    volume numeric not null,
    asset_id uuid not null references asset(id)
  )
  ;
  `)
  console.log('schema ok')

  await createUsersIfNotExist(client)
  console.log('users created')

  await createAssetsIfNotExist(client)
  console.log('assets created')

  await client.query('truncate transaction')

  await createTransactionHistoryForUser(client, availableUsers[0], 1000)
  await createTransactionHistoryForUser(client, availableUsers[1], 10_000)
  console.log('transactions inserted')

  await client.query('commit')
  console.log('commit')

  await client.end()
}

main().then()