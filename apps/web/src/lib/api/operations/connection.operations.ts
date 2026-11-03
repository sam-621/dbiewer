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

export const CREATE_CONNECTION_MUTATION = graphql(`
  mutation CreateConnection($input: CreateConnectionInput!) {
    createConnection(input: $input) {
      apiErrors {
        code
        message
      }
      connection {
        ...CommonConnection
      }
    }
  }
`);

export const TEST_CONNECTION_MUTATION = graphql(`
  mutation TestConnection($input: TestConnectionInput!) {
    testConnection(input: $input) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`);
