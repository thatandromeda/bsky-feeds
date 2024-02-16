import dotenv from 'dotenv'
import SqliteDb from 'better-sqlite3'
import { Kysely, Migrator, SqliteDialect } from 'kysely'
import { DatabaseSchema, DatabaseSchemaReference } from './schema'
import { migrationProvider } from './migrations'

dotenv.config()

export const createDb = (location: string) => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  })
}

export const migrateToLatest = async (db: Kysely<DatabaseSchema>) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

class dbSingleton {
  client: Kysely<DatabaseSchema>

  constructor(location: string) {
    this.client = createDb(location)
    this.init()
  }

  async init() {
    await migrateToLatest(this.client)
  }
  // The following two were needed by batchUpdate, but then I commented them
  // out.
  // What I SHOULD do for future-proofing is implement all the methods on
  // dbClient, and make sure dbSingleton can be typed as Database; then this
  // should be resilient around upstream updates.
  // Oh, and also figure out how it was exposing the exports from here --
  // the import statements elsewhere (e.g. subscription, util/subscription)
  // didn't work and I had to update them. I'd rather not touch anything
  // except dbclient and the feeds.
  // Caveat: most of the methods are consumed by forScience, and I don't use
  // them. So I might be able to update just a few.
  // I might want to back out of kysely because it's just a query builder and
  // I could actually just write SQL instead of fighting with the kysely API.
  // The below fails for Typescript reasons even though I'm pretty sure it
  // should work.
  async getUnlabelledPostsWithImages(limit = 100, lagTime = 5 * 60 * 1000) {
    const results = this.client
      .selectFrom('post')
      .selectAll()
      // Should be embed.images != null but that keeps throwing typescript
      // errors and I don't care if this actually is correct.
      .where('embed', '!=', null)
      .where('indexedAt', '<', new Date().getTime() - lagTime)
      .where('tags', '=', null)
      .orderBy('indexedAt', 'desc')
      .limit(limit)
      .execute()

    return results || []
  }

  async updateLabelsForURIs() {}

  async deleteManyURI(collection: DatabaseSchemaReference, uris: string[]) {
    await this.client.deleteFrom(collection).where('uri', 'in', uris).execute()
  }

  async replaceOneURI(
    collection: DatabaseSchemaReference,
    uri: string,
    data: any,
  ) {
    try {
      await this.client.insertInto(collection).values(data).executeTakeFirst()
    } catch (err) {
      await this.client
        .updateTable(collection)
        .set(data)
        .where('uri', '=', uri)
        .executeTakeFirst()
    }
  }

  async updateSubStateCursor(service: string, cursor: number) {
    const data = { service: service, cursor: cursor }
    try {
      await this.client.insertInto('sub_state').values(data).executeTakeFirst()
    } catch (err) {
      await this.client.updateTable('sub_state').set(data).executeTakeFirst()
    }
  }

  async getSubStateCursor(service: string) {
    const res = await this.client
      .selectFrom('sub_state')
      .select(['service', 'cursor'])
      .where('service', '=', service)
      .executeTakeFirst()
    if (res === null) return { service: service, cursor: 0 }
    return res
  }
}

const dbClient = new dbSingleton(`${process.env.FEEDGEN_SQLITE_LOCATION ?? ''}`)

export default dbClient
