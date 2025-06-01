/**
 * MongoDB API client
 * This file provides functions to interact with the MongoDB backend API
 */

// Backend API endpoints
const API_BASE_URL = 'http://localhost:3001/api';
const USERS_ENDPOINT = `${API_BASE_URL}/users`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

/**
 * Saves a username to MongoDB via the backend API
 * @param username The username to save
 * @returns Promise that resolves to true if successful
 */
export async function saveUsername(username: string): Promise<boolean> {
  try {
    // Make the API request to save the username
    const response = await fetch(USERS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    // Parse the JSON response
    const data = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error('Error saving to MongoDB:', data.message || 'Unknown error');
      return false;
    }

    // Log successful save
    console.log(`Username ${username} saved to MongoDB with ID: ${data.data?.id}`);
    return true;
  } catch (error) {
    console.error('Error connecting to backend API:', error);
    return false;
  }
}

/**
 * Tests the MongoDB connection via the backend API
 * @returns Promise that resolves to true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Call the health endpoint to check connection
    const response = await fetch(HEALTH_ENDPOINT);
    
    // Parse the JSON response
    const data = await response.json();
    
    // Check if the connection is successful
    if (!response.ok || data.status !== 'ok') {
      throw new Error(data.message || 'Health check failed');
    }

    console.log('Successfully connected to MongoDB via backend API!');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}
