/**
 * App (Application)
 * 
 * This file contains the main application logic.
 */

// DOM elements for API key handling
const apiKeyElements = {
    input: document.getElementById('api-key-input'),
    saveButton: document.getElementById('save-api-key'),
    status: document.getElementById('api-key-status'),
    section: document.querySelector('.api-key-section'),
    changeButton: document.getElementById('change-api-key')
};

// Application state
const state = {
    currentPage: 1,
    totalPages: 0,
    activeGenreId: null,
    genres: [],
    currentView: 'popular', // 'popular' or 'releases'
    apiKeySet: false
};

/**
 * Initializes the application
 */
async function init() {
    try {
        // Setup API key handling
        setupApiKeyHandling();
        
        // Check if API key is already saved
        if (window.api.initApiKey()) {
            state.apiKeySet = true;
            updateApiKeyUI(true);
            await loadInitialData();
        } else {
            // Show API key input section
            updateApiKeyUI(false);
        }
    } catch (error) {
        console.error('Error initializing the application:', error);
        showError('An error occurred while initializing the application. Please try again later.');
    }
}

/**
 * Sets up API key input handling
 */
function setupApiKeyHandling() {
    // Add event listener to save button
    apiKeyElements.saveButton.addEventListener('click', async () => {
        const apiKey = apiKeyElements.input.value.trim();
        
        if (!apiKey) {
            apiKeyElements.status.textContent = 'Please enter an API key';
            apiKeyElements.status.className = 'api-key-status error';
            return;
        }
        
        // Show loading state
        apiKeyElements.saveButton.disabled = true;
        apiKeyElements.saveButton.textContent = 'Validating...';
        apiKeyElements.status.textContent = '';
        
        try {
            // Validate and save API key
            const isValid = await window.api.setApiKey(apiKey);
            
            if (isValid) {
                state.apiKeySet = true;
                updateApiKeyUI(true);
                await loadInitialData();
            } else {
                apiKeyElements.status.textContent = 'Invalid API key. Please check and try again.';
                apiKeyElements.status.className = 'api-key-status error';
            }
        } catch (error) {
            apiKeyElements.status.textContent = 'Error validating API key: ' + error.message;
            apiKeyElements.status.className = 'api-key-status error';
        } finally {
            // Reset button state
            apiKeyElements.saveButton.disabled = false;
            apiKeyElements.saveButton.textContent = 'Save Key';
        }
    });
    
    // Add event listener to change API key button
    apiKeyElements.changeButton.addEventListener('click', () => {
        // Clear the API key
        window.api.clearApiKey();
        
        // Reset the input field
        apiKeyElements.input.value = '';
        
        // Update UI
        state.apiKeySet = false;
        updateApiKeyUI(false);
        
        // Scroll to the top to show the API key input
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Updates the API key UI based on whether the key is set
 * @param {boolean} isSet - Whether the API key is set
 */
function updateApiKeyUI(isSet) {
    if (isSet) {
        // Show success message
        apiKeyElements.status.textContent = 'API key is set and valid!';
        apiKeyElements.status.className = 'api-key-status success';
        
        // Minimize the API key section
        apiKeyElements.section.style.display = 'none';
    } else {
        // Show API key input
        apiKeyElements.section.style.display = 'block';
        
        // Update loading message
        const genreFilters = document.getElementById('genre-filters');
        if (genreFilters) {
            genreFilters.innerHTML = '<div class="loading-genres">Enter your API key to load genres</div>';
        }
        
        // Clear movies grid and pagination
        const moviesGrid = document.getElementById('movies-grid');
        const paginationControls = document.getElementById('pagination-controls');
        
        if (moviesGrid) {
            moviesGrid.innerHTML = '';
        }
        
        if (paginationControls) {
            paginationControls.innerHTML = '';
        }
    }
}

/**
 * Loads initial data after API key is set
 */
async function loadInitialData() {
    try {
        // Update loading message
        const genreFilters = document.getElementById('genre-filters');
        if (genreFilters) {
            genreFilters.innerHTML = '<div class="loading-genres">Loading genres...</div>';
        }
        
        // Load genres
        await loadGenres();
        
        // Load popular movies
        await loadMovies();
        
        // Add events to menu links
        setupMenuEvents();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('An error occurred while loading data. Please check your API key or try again later.');
    }
}

/**
 * Loads movie genres
 */
async function loadGenres() {
    try {
        // Fetch genres from API
        const data = await window.api.getGenres();
        
        // Store genres in state
        state.genres = data.genres;
        
        // Display genre filters
        window.ui.displayGenreFilters(state.genres, state.activeGenreId, handleGenreClick);
    } catch (error) {
        console.error('Error loading genres:', error);
        throw error;
    }
}

/**
 * Loads movies based on current state
 */
async function loadMovies() {
    try {
        // Show loading indicator
        window.ui.showLoading();
        
        let data;
        
        // Fetch movies based on current state
        if (state.activeGenreId) {
            // Movies by genre
            data = await window.api.getMoviesByGenre(state.activeGenreId, state.currentPage);
        } else if (state.currentView === 'releases') {
            // New releases
            data = await window.api.getNewReleases(state.currentPage);
        } else {
            // Popular movies
            data = await window.api.getPopularMovies(state.currentPage);
        }
        
        // Update state
        state.totalPages = data.total_pages;
        
        // Display movies
        window.ui.displayMovies(data.results);
        
        // Display pagination
        window.ui.displayPagination(state.currentPage, state.totalPages, handlePageClick);
        
        // Hide loading indicator
        window.ui.hideLoading();
    } catch (error) {
        console.error('Error loading movies:', error);
        window.ui.hideLoading();
        showError('An error occurred while loading movies. Please try again later.');
        throw error;
    }
}

/**
 * Handles click on a genre button
 * @param {number|null} genreId - ID of the clicked genre
 */
function handleGenreClick(genreId) {
    // Update state
    state.activeGenreId = genreId;
    state.currentPage = 1;
    
    // Update genre filters
    window.ui.displayGenreFilters(state.genres, state.activeGenreId, handleGenreClick);
    
    // Load movies with the new filter
    loadMovies();
}

/**
 * Handles click on a page button
 * @param {number} page - Clicked page number
 */
function handlePageClick(page) {
    // Update state
    state.currentPage = page;
    
    // Load movies from the new page
    loadMovies();
    
    // Scroll to the top of the page
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Sets up menu link events
 */
function setupMenuEvents() {
    // Get menu links
    const menuLinks = document.querySelectorAll('.menu a');
    
    // Add click event to each link
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Remove 'active' class from all links
            menuLinks.forEach(l => l.classList.remove('active'));
            
            // Add 'active' class to clicked link
            link.classList.add('active');
            
            // Determine view based on link text
            if (link.textContent === 'New Releases') {
                state.currentView = 'releases';
            } else if (link.textContent === 'Popular') {
                state.currentView = 'popular';
            } else {
                // Home - show popular movies
                state.currentView = 'popular';
            }
            
            // Reset state
            state.currentPage = 1;
            state.activeGenreId = null;
            
            // Update genre filters
            window.ui.displayGenreFilters(state.genres, state.activeGenreId, handleGenreClick);
            
            // Load movies for the new view
            loadMovies();
        });
    });
}

/**
 * Displays an error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Add element to document body
    document.body.appendChild(errorElement);
    
    // Remove element after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(errorElement);
        }, 500);
    }, 5000);
}

// Add CSS styles for error message
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        max-width: 80%;
        text-align: center;
        animation: fadeIn 0.3s;
    }
    
    .error-message.fade-out {
        animation: fadeOut 0.5s;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -20px); }
    }
`;
document.head.appendChild(errorStyles);

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 