
// src/lib/graphql/queries.ts

/**
 * Fetches users by a specific role.
 */
export const GET_USERS_BY_ROLE_QUERY = `
  query GetUsersByRole($role: String!, $limit: Int = 20, $offset: Int = 0) {
    users(where: {role: {_eq: $role}}, order_by: {created_at: desc}, limit: $limit, offset: $offset) {
      id
      firebaseId
      first_name
      last_name
      email
      avatar
      role
      status
      created_at
    }
  }
`;

/**
 * Fetches a user by their Firebase ID.
 */
export const GET_USER_BY_FIREBASE_ID = `
  query GetUserByFirebaseId($firebaseId: String!) {
    users(where: {firebaseId: {_eq: $firebaseId}}) {
      id
      firebaseId
      first_name
      last_name
      email
      avatar
      role
      status
      auth_complete
      born
      cover
      notifications_enabled
      phone
      sex
      step
      created_at
    }
  }
`;

/**
 * Fetches posts, including author and group details.
 * Limits to 20 posts, ordered by creation date.
 */
export const GET_POSTS_QUERY = `
  query GetPosts($limit: Int = 20, $offset: Int = 0) {
    posts(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      id
      title
      content # Consider fetching only a summary if full content is large
      created_at
      media
      tags
      author: posts_user_user_id {
        id
        first_name
        last_name
        avatar
      }
      group: posts_group_group_id {
        id
        title
        avatar
      }
    }
  }
`;

/**
 * Fetches "pages" (mapped from the 'groups' table).
 */
export const GET_PAGES_QUERY = `
  query GetPages($limit: Int = 10, $offset: Int = 0) {
    groups(order_by: {title: asc}, limit: $limit, offset: $offset) {
      id
      title
      description
      created_at
      address
      phone
      email
      web
      avatar
      cover
      # Add any other fields from 'groups' you want as metadata
    }
  }
`;

/**
 * Fetches a single "page" by its ID (from 'groups_by_pk').
 */
export const GET_PAGE_BY_ID_QUERY = `
  query GetPageById($id: Int!) {
    groups_by_pk(id: $id) {
      id
      title
      description
      created_at
      address
      phone
      email
      web
      avatar
      cover
      # Add any other fields from 'groups' you want as metadata
    }
  }
`;

/**
 * Fetches requests from the 'form_requests' table.
 */
export const GET_REQUESTS_QUERY = `
  query GetRequests($limit: Int = 20, $offset: Int = 0) {
    form_requests(order_by: {created_at: desc}, limit: $limit, offset: $offset) {
      id
      email
      notes
      page_name 
      created_at
      category_detail {
        category
      }
    }
  }
`;

