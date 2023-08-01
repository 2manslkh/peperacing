import { ApolloClient, InMemoryCache } from '@apollo/client'

const APIURL = 'http://localhost:8000/subgraphs/name/argo/diamondsNFT'

export const client = new ApolloClient({
    uri: APIURL,
    cache: new InMemoryCache(),
})
