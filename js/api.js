/**
 * TMDB (The Movie Database) API
 * 
 * This file contains functions for communication with the TMDB API.
 * To use the API, you need to register at https://www.themoviedb.org/
 * and obtain an API key.
 */

// API Configuration
let API_KEY = ''; // Will be set by the user
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p';

// Check if API key exists in local storage
function initApiKey() {
    const savedApiKey = localStorage.getItem('tmdb_api_key');
    if (savedApiKey) {
        API_KEY = savedApiKey;
        return true;
    }
    return false;
}

/**
 * Set the API key
 * @param {string} apiKey - The TMDB API key
 * @returns {boolean} - Whether the API key is valid
 */
async function setApiKey(apiKey) {
    try {
        // Test the API key with a simple request
        const response = await fetch(`${BASE_URL}/configuration?api_key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error('Invalid API key');
        }
        
        // Save the API key if valid
        API_KEY = apiKey;
        localStorage.setItem('tmdb_api_key', apiKey);
        return true;
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
}

/**
 * Check if the API key is set
 * @returns {boolean} - Whether the API key is set
 */
function hasApiKey() {
    return API_KEY !== '';
}

/**
 * Function to make requests to the TMDB API
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - Additional parameters for the request
 * @returns {Promise} - Promise with the response data
 */
async function fetchFromAPI(endpoint, params = {}) {
    // Check if API key is set
    if (!hasApiKey()) {
        throw new Error('API key is not set');
    }
    
    // Add the API key and language to the parameters
    const defaultParams = {
        api_key: API_KEY,
        language: 'en-US'
    };
    
    // Combine default parameters with provided parameters
    const queryParams = new URLSearchParams({
        ...defaultParams,
        ...params
    }).toString();
    
    // Build the complete URL
    const url = `${BASE_URL}${endpoint}?${queryParams}`;
    
    try {
        // Make the request
        const response = await fetch(url);
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`Request error: ${response.status} - ${response.statusText}`);
        }
        
        // Convert the response to JSON
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from API:', error);
        throw error;
    }
}

/**
 * Get the complete URL for an image
 * @param {string} path - Image path
 * @param {string} size - Image size (w92, w154, w185, w342, w500, w780, original)
 * @returns {string} - Complete image URL
 */
function getImageUrl(path, size = 'w500') {
    if (!path) {
        return 'assets/img/no-poster.png'; // Default image for when there is no poster
    }
    return `${IMG_BASE_URL}/${size}${path}`;
}

/**
 * Fetch popular movies
 * @param {number} page - Page number
 * @returns {Promise} - Promise with popular movies data
 */
async function getPopularMovies(page = 1) {
    return fetchFromAPI('/movie/popular', { page });
}

/**
 * Fetch movies by genre
 * @param {number} genreId - Genre ID
 * @param {number} page - Page number
 * @returns {Promise} - Promise with genre movies data
 */
async function getMoviesByGenre(genreId, page = 1) {
    return fetchFromAPI('/discover/movie', { 
        with_genres: genreId,
        page
    });
}

/**
 * Fetch movie details
 * @param {number} movieId - Movie ID
 * @returns {Promise} - Promise with movie details
 */
async function getMovieDetails(movieId) {
    return fetchFromAPI(`/movie/${movieId}`, { append_to_response: 'credits,videos' });
}

/**
 * Fetch available movie genres
 * @returns {Promise} - Promise with genres data
 */
async function getGenres() {
    return fetchFromAPI('/genre/movie/list');
}

/**
 * Fetch recently released movies
 * @param {number} page - Page number
 * @returns {Promise} - Promise with recently released movies data
 */
async function getNewReleases(page = 1) {
    // Get current date
    const today = new Date();
    
    // Calculate date from 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    // Format dates in YYYY-MM-DD format
    const fromDate = threeMonthsAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    return fetchFromAPI('/discover/movie', {
        'primary_release_date.gte': fromDate,
        'primary_release_date.lte': toDate,
        'sort_by': 'primary_release_date.desc',
        page
    });
}

/**
 * Clear the API key
 */
function clearApiKey() {
    API_KEY = '';
    localStorage.removeItem('tmdb_api_key');
}

// Export functions for use in other files
window.api = {
    initApiKey,
    setApiKey,
    hasApiKey,
    clearApiKey,
    getPopularMovies,
    getMoviesByGenre,
    getMovieDetails,
    getGenres,
    getNewReleases,
    getImageUrl
}; 