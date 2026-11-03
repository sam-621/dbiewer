import { graphql } from '../codegen';

export const GET_CONNECTION_SCHEMA_QUERY = graphql(`
  query GetConnectionSchema($connectionId: ID!) {
    connectionSchema(connectionId: $connectionId) {
      apiErrors {
        code
        message
      }
      schemas {
        name
        tables {
          name
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        views {
          name
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        functions {
          name
          arguments
          kind
        }
      }
    }
  }
`);
