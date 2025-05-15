
// src/lib/pages.ts
import type { Page } from '@/types';
import { apiClient } from './graphql/client';
import { 
  GET_PAGE_BY_ID_QUERY, 
  UPDATE_PAGE_MUTATION,
  DELETE_GROUP_CATEGORY_MUTATION,
  INSERT_GROUP_CATEGORY_MUTATION,
  GET_CATEGORIES_QUERY
} from './graphql/queries';

// Function to fetch a single page by its ID
export async function getPageByID(id: number): Promise<Page | null> {
  try {
    const response = await apiClient<{ groups_by_pk: any }>(GET_PAGE_BY_ID_QUERY, { id });
    console.log('pageIddd', response);
    if (response.errors || !response.data || !response.data.groups_by_pk) {
      console.error("GraphQL errors fetching page by ID:", response.errors);
      return null;
    }
    
    const g = response.data.groups_by_pk;
    const fetchedPage: Page = {
      id: g.id,
      title: g.title,
      description: g.description,
      active: g.active,
      can_send_notification: g.can_send_notification,
      can_publish_on_fb: g.can_publish_on_fb,
      additional_btn_text: g.additional_btn_text,
      additional_url: g.additional_url,
      btn_info_text: g.btn_info_text,
      facebook: g.facebook,
      instagram: g.instagram,
      email: g.email,
      phone: g.phone,
      avatar: g.avatar,
      cover: g.cover,
      created_at: g.created_at,
      // Mapper for group_categories_2 to match the Page type
      group_categories_2: g.group_categories_2?.map((gc: any) => ({
        category: gc.category_fk // Assuming category_fk holds the category object { id, category }
      })) || [],
      // Keep other metadata fields if any
      metadata: { // Example, adjust as per actual fields in groups table if needed for generic metadata
        address: g.address, // Assuming address is a field you might want in metadata
      }
    };
    return fetchedPage;
  } catch (error) {
    console.error("Failed to fetch page by ID:", error);
    return null;
  }
}

// Function to update a page
export async function updatePage(id: number, data: Partial<Page>): Promise<boolean> {
  try {
    // Prepare data for Hasura groups_set_input
    // We need to strip out fields not directly on the 'groups' table or handle them separately
    const { group_categories_2, metadata, ...groupData } = data;

    const response = await apiClient(UPDATE_PAGE_MUTATION, { id, data: groupData });
    if (response.errors || !response.data?.update_groups_by_pk) {
      console.error("GraphQL errors updating page:", response.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to update page:", error);
    return false;
  }
}

// Function to delete all categories for a group
export async function deleteGroupCategory(groupId: number): Promise<boolean> {
  try {
    const response = await apiClient(DELETE_GROUP_CATEGORY_MUTATION, { group: groupId });
    if (response.errors) {
      console.error("GraphQL errors deleting group categories:", response.errors);
      return false;
    }
    // affected_rows can be 0 if there were no categories to delete, which is not an error
    return true; 
  } catch (error) {
    console.error("Failed to delete group categories:", error);
    return false;
  }
}

// Function to insert a category for a group
export async function insertGroupCategory(groupId: number, categoryId: number): Promise<boolean> {
  try {
    const data = { group: groupId, category: categoryId };
    const response = await apiClient(INSERT_GROUP_CATEGORY_MUTATION, { data });
    if (response.errors || !response.data?.insert_group_categories_2_one) {
      console.error("GraphQL errors inserting group category:", response.errors);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to insert group category:", error);
    return false;
  }
}

// Function to get all categories
export async function getCategories(): Promise<{ id: number; category: string }[]> {
  try {
    const response = await apiClient<{ group_categories: { id: number; category: string }[] }>(GET_CATEGORIES_QUERY);
    if (response.errors || !response.data || !response.data.group_categories) {
      console.error("GraphQL errors fetching categories:", response.errors);
      return [];
    }
    return response.data.group_categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}
