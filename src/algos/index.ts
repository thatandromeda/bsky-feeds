import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as skybrarians from './skybrarians'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos = {
  [skybrarians.shortname]: {
    handler: <AlgoHandler>skybrarians.handler,
  },
}

export default algos
