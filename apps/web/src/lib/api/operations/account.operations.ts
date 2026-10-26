import { graphql } from '../codegen';

export const GET_ME_QUERY = graphql(`
  query GetMe {
    me {
      user {
        id
        name
        email
        image
      }
      workspace {
        id
        name
      }
    }
  }
`);
