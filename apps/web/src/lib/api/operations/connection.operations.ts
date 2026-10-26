import { graphql } from '../codegen';

export const COMMON_CONNECTION_FRAGMENT = graphql(`
  fragment CommonConnection on Connection {
    id
    name
    host
    port
    database
    username
    hasPassword
    sslMode
  }
`);

export const GET_CONNECTIONS_QUERY = graphql(`
  query GetConnections {
    connections {
      items {
        ...CommonConnection
      }
    }
  }
`);
