
// src/lib/graphql/client.ts

// This is a placeholder for your GraphQL client configuration.
// You would typically use a library like Apollo Client, urql, or a simple fetch wrapper.

const HASURA_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL || 'https://api.tremitinow.next2me.cloud/v1/graphql'; // Fallback for safety, but env var should be primary
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET; // Or appropriate auth headers

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

/**
 * Placeholder function for making GraphQL requests.
 * Replace this with your actual GraphQL client implementation.
 * 
 * @param query The GraphQL query string.
 * @param variables Optional variables for the query.
 * @returns Promise<GraphQLResponse<T>>
 */
export async function apiClient<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  if (!HASURA_ENDPOINT || HASURA_ENDPOINT.includes('YOUR_HASURA_ENDPOINT_HERE')) { // Check for placeholder
    console.error('Hasura endpoint is not configured correctly. Current endpoint:', HASURA_ENDPOINT);
    return { errors: [{ message: 'Hasura endpoint not configured or using placeholder.' }] };
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add admin secret or other auth headers if necessary
  // For client-side Hasura, you'd typically use JWT tokens passed via Authorization header
  // WARNING: Using admin secret on client-side is a security risk. 
  // This should only be done in server-side environments or secure contexts.
  if (HASURA_ADMIN_SECRET && typeof window === 'undefined') { // Example: only add if server-side
    headers['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }
  // Example for JWT token (you'd get this from your auth state)
  // const token = getAuthToken(); 
  // if (token) {
  //   headers['Authorization'] = `Bearer ${token}`;
  // }


  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      // Handle HTTP errors
      const errorBody = await response.text();
      console.error('GraphQL HTTP Error:', response.status, errorBody);
      return { errors: [{ message: `HTTP error: ${response.status} ${errorBody}` }] };
    }

    const result: GraphQLResponse<T> = await response.json();
    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
    }
    return result;

  } catch (error) {
    console.error('GraphQL Request Failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Check for "Failed to construct 'URL': Invalid URL" specifically if error is TypeError
    if (error instanceof TypeError && error.message.includes("Failed to construct 'URL'")) {
      console.error("Potential cause: HASURA_ENDPOINT might be invalid or undefined. Current value:", HASURA_ENDPOINT);
    }
    return { errors: [{ message: errorMessage }] };
  }
}

// Example of how you might get an auth token (placeholder)
// function getAuthToken(): string | null {
//   // Replace with your actual token retrieval logic, e.g., from AuthContext or localStorage
//   return localStorage.getItem('authToken'); 
// }
