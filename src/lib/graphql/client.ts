
// src/lib/graphql/client.ts

import { auth } from '@/lib/firebase/config'; // Import Firebase auth instance

const HASURA_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL || 'https://api.tremitinow.next2me.cloud/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

/**
 * Client for making GraphQL requests to Hasura.
 * Includes Firebase ID token for authenticated users.
 *
 * @param query The GraphQL query string.
 * @param variables Optional variables for the query.
 * @returns Promise<GraphQLResponse<T>>
 */
export async function apiClient<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  if (!HASURA_ENDPOINT || HASURA_ENDPOINT.includes('YOUR_HASURA_ENDPOINT_HERE') || HASURA_ENDPOINT === 'https://api.tremitinow.next2me.cloud/v1/graphqlundefined') {
    const errorMsg = 'Hasura endpoint is not configured correctly or is using a placeholder/default. Current endpoint: ' + HASURA_ENDPOINT;
    console.error("[apiClient] Error: " + errorMsg);
    return { errors: [{ message: errorMsg }] };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get Firebase ID token for the current user
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log("[apiClient] Current user found (uid:", currentUser.uid,"). Attempting to get ID token.");
    try {
      const token = await currentUser.getIdToken();
      console.log("[apiClient] Firebase ID Token obtained. Setting Authorization header.");
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error("[apiClient] Error getting Firebase ID token:", error);
    }
  } else {
    console.log("[apiClient] No current Firebase user found (auth.currentUser is null). Token will not be sent via user session.");
    if (HASURA_ADMIN_SECRET && typeof window === 'undefined') {
      // This condition means it's running on the server (typeof window === 'undefined')
      // and an admin secret is available.
      console.log("[apiClient] Using Hasura Admin Secret as fallback for server-side request.");
      headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
    } else {
      console.log("[apiClient] No user token and no admin secret fallback for this context (e.g., client-side unauthenticated, or server-side without admin secret).");
    }
  }

  console.log("[apiClient] Making fetch request to:", HASURA_ENDPOINT, "with headers:", Object.keys(headers));


  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const httpErrorMsg = `GraphQL HTTP Error: ${response.status} ${errorBody}`;
      console.error("[apiClient] " + httpErrorMsg);
      return { errors: [{ message: httpErrorMsg }] };
    }

    const result: GraphQLResponse<T> = await response.json();
    if (result.errors) {
      console.error(
        "[apiClient] GraphQL query/mutation failed. This is an error response from the Hasura server. Potential causes: permissions issues for the current role, invalid data, or schema mismatches. Check Hasura logs and permissions for the role and table involved. GraphQL Errors:",
        JSON.stringify(result.errors, null, 2)
      );
    }
    return result;

  } catch (error) {
    let errorMessage = 'Unknown error occurred during GraphQL request.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[apiClient] GraphQL Request Failed:', errorMessage, error);
    if (error instanceof TypeError && errorMessage.includes("Failed to construct 'URL'")) {
      console.error("[apiClient] Potential cause: HASURA_ENDPOINT might be invalid or undefined. Current value:", HASURA_ENDPOINT);
    }
    return { errors: [{ message: errorMessage }] };
  }
}
