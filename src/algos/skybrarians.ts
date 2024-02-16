import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AlgoManager } from '../addn/algoManager'
import { AppContext } from '../config'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { Post } from '../db/schema'
import getListMembers from '../addn/getListMembers'

// max 15 chars
export const shortname = 'skybrarians'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  let builder = ctx.db.client
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const [indexedAt, cid] = params.cursor.split('::')
    if (!indexedAt || !cid) {
      throw new InvalidRequestError('malformed cursor')
    }
    const timeStr = new Date(parseInt(indexedAt, 10)).getTime()
    builder = builder
      .where((eb) =>
        eb.or([
          eb('post.indexedAt', '<', timeStr),
          eb('post.indexedAt', '=', timeStr),
        ]),
      )
      .where('post.cid', '<', cid)
  }
  const res = await builder.execute()

  const feed = res.map((row) => ({
    post: row.uri,
  }))

  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
  }

  return {
    cursor,
    feed,
  }
}

export class manager extends AlgoManager {
  public name: string = shortname
  public authorList: string[] = []

  public async periodicTask() {
    const lists: string[] = `${process.env.FEEDGEN_LISTS}`.split('|')

    for (const list of lists) {
      const members = await getListMembers(list, this.agent)
      // May be nonunique but that doesn't matter for the include below
      this.authorList = [...this.authorList, ...members]
    }
  }

  public async filter_post(post: Post): Promise<Boolean> {
    if (post.text.toLowerCase().includes(`${process.env.FEEDGEN_SYMBOL}`)) {
      if (this.authorList.includes(post.author)) {
        return true
      }
    }
    return false
  }
}
