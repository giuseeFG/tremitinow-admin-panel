
// src/lib/graphql/client.ts

import { auth } from '@/lib/firebase/config'; // Import Firebase auth instance

// This is a placeholder for your GraphQL client configuration.
// You would typically use a library like Apollo Client, urql, or a simple fetch wrapper.

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
    console.error(errorMsg);
    return { errors: [{ message: errorMsg }] };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get Firebase ID token for the current user
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error("Error getting Firebase ID token:", error);
      // Optionally, you might want to prevent the request or handle this error differently
    }
  } else if (HASURA_ADMIN_SECRET && typeof window === 'undefined') { 
    // Fallback to admin secret if no user is logged in AND if server-side + secret is present
    // WARNING: Using admin secret on client-side is generally a security risk.
    // This condition ensures it's only added if no user token is available and it's a server-side context.
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }


  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      // Handle HTTP errors
      const errorBody = await response.text();
      const httpErrorMsg = `GraphQL HTTP Error: ${response.status} ${errorBody}`;
      console.error(httpErrorMsg);
      return { errors: [{ message: httpErrorMsg }] };
    }

    const result: GraphQLResponse<T> = await response.json();
    if (result.errors) {
      console.error(
        'GraphQL query/mutation failed. This is an error response from the Hasura server. Potential causes: permissions issues for the current role, invalid data, or schema mismatches. Check Hasura logs and permissions for the role and table involved. GraphQL Errors:',
        JSON.stringify(result.errors, null, 2) // Stringify for better readability in console
      );
    }
    return result;

  } catch (error) {
    let errorMessage = 'Unknown error occurred during GraphQL request.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('GraphQL Request Failed:', errorMessage, error);
    // Check for "Failed to construct 'URL': Invalid URL" specifically if error is TypeError
    if (error instanceof TypeError && errorMessage.includes("Failed to construct 'URL'")) {
      console.error("Potential cause: HASURA_ENDPOINT might be invalid or undefined. Current value:", HASURA_ENDPOINT);
    }
    return { errors: [{ message: errorMessage }] };
  }
}

// Example of how you might get an auth token (placeholder)
// function getAuthToken(): string | null {
//   // Replace with your actual token retrieval logic, e.g., from AuthContext or localStorage
//   return typeof window !== 'undefined' ? localStorage.getItem('authToken') : null; 
// }

