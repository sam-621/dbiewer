import { graphql } from '../codegen';

export const GET_HEALTH_QUERY = graphql(`
  query GetHealth {
    health
  }
`);
