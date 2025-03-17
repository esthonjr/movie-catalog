/**
 * UI (User Interface)
 * 
 * This file contains functions for manipulating the user interface.
 */

// DOM Elements
const elements = {
    moviesGrid: document.getElementById('movies-grid'),
    loading: document.getElementById('loading'),
    genreFilters: document.getElementById('genre-filters'),
    paginationControls: document.getElementById('pagination-controls'),
    modal: document.getElementById('movie-modal'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.querySelector('.close-modal')
};

/**
 * Creates a movie card element
 * @param {Object} movie - Movie data
 * @returns {HTMLElement} - Movie card element
 */
function createMovieCard(movie) {
    // Extract the movie year from the release date
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.dataset.id = movie.id;
    
    // Set the card's inner HTML
    card.innerHTML = `
        <img src="${window.api.getImageUrl(movie.poster_path)}" alt="${movie.title}" class="movie-poster">
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-year">${releaseYear}</div>
            <div class="movie-rating">
                <span>★</span>
                ${movie.vote_average.toFixed(1)}
            </div>
        </div>
    `;
    
    // Add click event to open the modal with movie details
    card.addEventListener('click', () => {
        showMovieDetails(movie.id);
    });
    
    return card;
}

/**
 * Displays movies in the grid
 * @param {Array} movies - List of movies
 */
function displayMovies(movies) {
    // Clear the movies grid
    elements.moviesGrid.innerHTML = '';
    
    // Check if there are movies to display
    if (movies.length === 0) {
        elements.moviesGrid.innerHTML = '<div class="no-results">No movies found</div>';
        return;
    }
    
    // Create and add movie cards to the grid
    const fragment = document.createDocumentFragment();
    movies.forEach(movie => {
        fragment.appendChild(createMovieCard(movie));
    });
    
    elements.moviesGrid.appendChild(fragment);
}

/**
 * Displays pagination controls
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {Function} callback - Function to call when clicking a page button
 */
function displayPagination(currentPage, totalPages, callback) {
    // Clear pagination controls
    elements.paginationControls.innerHTML = '';
    
    // Limit the total number of pages to avoid overloading the interface
    const maxPages = Math.min(totalPages, 500);
    
    // Create fragment to add buttons
    const fragment = document.createDocumentFragment();
    
    // Previous page button
    const prevButton = document.createElement('button');
    prevButton.className = `page-btn prev ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            callback(currentPage - 1);
        }
    });
    fragment.appendChild(prevButton);
    
    // Determine which pages to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(maxPages, startPage + 4);
    
    // Adjust the range if near the beginning or end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page button
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'page-btn';
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => callback(1));
        fragment.appendChild(firstPageButton);
        
        // Add ellipsis if there's a jump
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            fragment.appendChild(ellipsis);
        }
    }
    
    // Buttons for pages in the range
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => callback(i));
        fragment.appendChild(pageButton);
    }
    
    // Last page button
    if (endPage < maxPages) {
        // Add ellipsis if there's a jump
        if (endPage < maxPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            fragment.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'page-btn';
        lastPageButton.textContent = maxPages;
        lastPageButton.addEventListener('click', () => callback(maxPages));
        fragment.appendChild(lastPageButton);
    }
    
    // Next page button
    const nextButton = document.createElement('button');
    nextButton.className = `page-btn next ${currentPage === maxPages ? 'disabled' : ''}`;
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === maxPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < maxPages) {
            callback(currentPage + 1);
        }
    });
    fragment.appendChild(nextButton);
    
    // Add buttons to pagination controls
    elements.paginationControls.appendChild(fragment);
}

/**
 * Displays genre filters
 * @param {Array} genres - List of genres
 * @param {number|null} activeGenreId - ID of the active genre
 * @param {Function} callback - Function to call when clicking a genre button
 */
function displayGenreFilters(genres, activeGenreId, callback) {
    // Clear genre filters
    elements.genreFilters.innerHTML = '';
    
    // Create fragment to add buttons
    const fragment = document.createDocumentFragment();
    
    // Button for all genres
    const allGenresButton = document.createElement('button');
    allGenresButton.className = `genre-btn ${activeGenreId === null ? 'active' : ''}`;
    allGenresButton.textContent = 'All';
    allGenresButton.addEventListener('click', () => callback(null));
    fragment.appendChild(allGenresButton);
    
    // Buttons for each genre
    genres.forEach(genre => {
        const genreButton = document.createElement('button');
        genreButton.className = `genre-btn ${activeGenreId === genre.id ? 'active' : ''}`;
        genreButton.textContent = genre.name;
        genreButton.dataset.id = genre.id;
        genreButton.addEventListener('click', () => callback(genre.id));
        fragment.appendChild(genreButton);
    });
    
    // Add buttons to genre filters
    elements.genreFilters.appendChild(fragment);
}

/**
 * Displays movie details in the modal
 * @param {number} movieId - Movie ID
 */
async function showMovieDetails(movieId) {
    try {
        // Display the modal with a loading message
        elements.modalBody.innerHTML = '<div class="loading">Loading movie details...</div>';
        elements.modal.style.display = 'block';
        
        // Fetch movie details
        const movie = await window.api.getMovieDetails(movieId);
        
        // Format release date
        const releaseDate = movie.release_date 
            ? new Date(movie.release_date).toLocaleDateString('en-US')
            : 'Unknown date';
        
        // Format movie runtime
        const runtime = movie.runtime 
            ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`
            : 'Unknown duration';
        
        // Format movie genres
        const genres = movie.genres.map(genre => 
            `<span class="movie-detail-genre">${genre.name}</span>`
        ).join('');
        
        // Format movie cast (first 5 actors)
        const cast = movie.credits && movie.credits.cast 
            ? movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ')
            : 'Unknown cast';
        
        // Format movie directors
        const directors = movie.credits && movie.credits.crew 
            ? movie.credits.crew
                .filter(crew => crew.job === 'Director')
                .map(director => director.name)
                .join(', ')
            : 'Unknown director';
        
        // Fill the modal with movie details
        elements.modalBody.innerHTML = `
            <div class="movie-detail">
                <img src="${window.api.getImageUrl(movie.poster_path)}" alt="${movie.title}" class="movie-detail-poster">
                <div class="movie-detail-info">
                    <div class="movie-detail-header">
                        <h2 class="movie-detail-title">${movie.title}</h2>
                        <div class="movie-rating">
                            <span>★</span>
                            ${movie.vote_average.toFixed(1)}
                        </div>
                    </div>
                    <div class="movie-detail-meta">
                        <span>${releaseDate}</span>
                        <span>${runtime}</span>
                    </div>
                    <div class="movie-detail-genres">
                        ${genres}
                    </div>
                    <p class="movie-detail-overview">${movie.overview || 'No description available.'}</p>
                    <div class="movie-detail-credits">
                        <p><strong>Director:</strong> ${directors}</p>
                        <p><strong>Cast:</strong> ${cast}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        // Display an error message in the modal
        elements.modalBody.innerHTML = `
            <div class="error">
                <p>An error occurred while loading movie details.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Shows the loading indicator
 */
function showLoading() {
    elements.loading.style.display = 'block';
}

/**
 * Hides the loading indicator
 */
function hideLoading() {
    elements.loading.style.display = 'none';
}

// Add event to close the modal
elements.closeModal.addEventListener('click', () => {
    elements.modal.style.display = 'none';
});

// Close the modal when clicking outside the content
window.addEventListener('click', (event) => {
    if (event.target === elements.modal) {
        elements.modal.style.display = 'none';
    }
});

// Export functions for use in other files
window.ui = {
    displayMovies,
    displayPagination,
    displayGenreFilters,
    showMovieDetails,
    showLoading,
    hideLoading
}; 