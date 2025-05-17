
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
 * This query is for the list of pages.
 */
export const GET_PAGES_QUERY = `
  query GetPagesList($limit: Int = 20, $offset: Int = 0) {
    groups(order_by: {title: asc}, limit: $limit, offset: $offset) {
      id
      title
      category: groups_category_group_category_id {
        id
        category
      }
    }
  }
`;

/**
 * Fetches a single "page" by its ID (from 'groups_by_pk').
 * This query is for the detail view of a page.
 */
export const GET_PAGE_BY_ID_QUERY = `
query GetPageById($id: Int!) {
  groups_by_pk(id: $id) {
    active
    additional_btn_text
    additional_url
    address
    avatar
    btn_info_text
    can_publish_on_fb
    can_send_notification
    category # This is an integer ID for the category
    cover
    created_at
    email
    description
    exclude_from_map_bounce
    group_categories # This seems like a text/json field based on your schema
    facebook
    id
    instagram
    lat
    lng
    old_firebasePageId
    phone
    private
    title
    updated_at
    web
    group_categories_2 { # This is the relational link for categories
      id # ID of the group_categories_2 entry
      category:group_categories_2_group_category {
        id
        category
      }
    }
  }
}
`;

/**
 * Fetches requests from the 'form_requests' table.
 * Orders by ID descending.
 */
export const GET_REQUESTS_QUERY = `
  query getAllRequests($limit: Int = 20, $offset: Int = 0) {
    form_requests(order_by: {id: desc}, limit: $limit, offset: $offset) {
      id
      email
      notes
      page_name 
      created_at
      category: category_detail {
        category
      }
    }
  }
`;

/**
 * Mutation to remove a user by their primary key (DB ID).
 */
export const REMOVE_USER_MUTATION = `
  mutation removeUser($id: Int!) {
    delete_users_by_pk(id: $id) {
      id
    }
  }
`;

/**
 * Mutation to update a user's status by their primary key (DB ID).
 */
export const UPDATE_USER_STATUS_MUTATION = `
  mutation updateUserStatus($id: Int!, $status: String!) {
    update_users_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
      id
      status
    }
  }
`;

/**
 * Fetches aggregated statistics for the dashboard.
 */
export const GET_DASHBOARD_STATS_QUERY = `
  query getDashboardStats {
    users: users_aggregate(where: {role: {_eq: "user"}}) {
      aggregate {
        count
      }
    }
    operators: users_aggregate(where: {role: {_eq: "operator"}}) {
      aggregate {
        count
      }
    }
    pages: groups_aggregate {
      aggregate {
        count
      }
    }
    posts: posts_aggregate {
      aggregate {
        count
      }
    }
    requests: form_requests_aggregate {
      aggregate {
        count
      }
    }
  }
`;

// Mutation to update a group (page)
export const UPDATE_PAGE_MUTATION = `
  mutation updateGroup($id: Int!, $data: groups_set_input!) {
    update_groups_by_pk(pk_columns: {id: $id}, _set: $data) {
      id
    }
  }
`;

// Mutation to delete all categories for a group from group_categories_2
export const DELETE_GROUP_CATEGORY_MUTATION = `
  mutation deleteGroupCategory2($group: Int!) {
    delete_group_categories_2(where: {group: {_eq: $group}}) {
      affected_rows
    }
  }
`;

// Mutation to insert a category for a group into group_categories_2
export const INSERT_GROUP_CATEGORY_MUTATION = `
  mutation insertGroupCategory2($data: group_categories_2_insert_input!) {
    insert_group_categories_2_one(object: $data) {
      id
    }
  }
`;

// Query to get all group categories
export const GET_CATEGORIES_QUERY = `
  query getCategories {
    group_categories(order_by: {category: asc}) {
      id
      category
    }
  }
`;

// Query to get vehicle permissions
export const GET_VEHICLE_PERMISSIONS_QUERY = `
  query GetVehiclePermissions($limit: Int = 20, $offset: Int = 0) {
    vehicle_permissions(order_by: {id: desc}, limit: $limit, offset: $offset) {
      id
      user # This is likely the user ID who submitted, or is associated.
      created_at
      email
      end_date
      first_name
      last_name
      model
      plate
      start_date
      status
      url
    }
  }
`;

// Query to get user details by database ID for the user's requests page
export const GET_USER_FOR_REQUESTS_PAGE_QUERY = `
  query GetUserForRequestsPage($id: Int!) {
    users_by_pk(id: $id) {
      id
      first_name
      last_name
      email
    }
  }
`;

// Query to get form_requests by email
export const GET_REQUESTS_BY_EMAIL_QUERY = `
  query GetRequestsByEmail($email: String!, $limit: Int = 20, $offset: Int = 0) {
    form_requests(
      where: {email: {_eq: $email}}
      order_by: {created_at: desc}
      limit: $limit
      offset: $offset
    ) {
      id
      email
      page_name
      notes
      created_at
      category: category_detail {
        category
      }
    }
  }
`;
