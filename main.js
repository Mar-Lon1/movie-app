// Define the global TMDB API key parameter used to authorize and fetch movie endpoints
const API_KEY = "489f4d0d06b374fa5e789c40525167ff";
// Define the default regional scope to customize user experience in the header indicator
const COUNTRY = "Ghana";

// Declare global cache variable to store and look up movies' human-readable genres list
let genresList = [];
// Declare application state holding the active categorization tab selected by user
let currentTab = "popular";
// Declare application state tracking active sub-genre filtering selection
let currentGenreId = null;
// Declare variable holding references to movies saved locally by the user in local storage
let watchlist = JSON.parse(localStorage.getItem("lonMovieWatchlist")) || [];
// Declare variable to hold the spotlight movie object for quick details inspections
let spotlightMovie = null;
// Declare reference pointer for search debounce timer to prevent redundant API calls
let searchDebounceTimer = null;

// Cache the DOM elements after DOM content finishes loading to ensure nodes are available
const searchInput = document.getElementById("searchInput");
// Cache the clear search cross button reference
const clearSearch = document.getElementById("clearSearch");
// Cache the geographical text container displaying user region context
const countryIndicator = document.getElementById("countryIndicator");
// Cache the badge count indicator displaying watchlist size in the nav bar
const watchlistCount = document.getElementById("watchlistCount");
// Cache the spotlight hero section container
const heroSection = document.getElementById("heroSection");
// Cache the background backdrop image element of the hero showcase
const heroBackdrop = document.getElementById("heroBackdrop");
// Cache the title element header of the spotlight showcase
const heroTitle = document.getElementById("heroTitle");
// Cache the rating score indicator of the spotlight movie
const heroRating = document.getElementById("heroRating");
// Cache the release year element of the spotlight movie
const heroYear = document.getElementById("heroYear");
// Cache the genre listings label of the spotlight movie
const heroGenres = document.getElementById("heroGenres");
// Cache the summary overview block of the spotlight movie
const heroOverview = document.getElementById("heroOverview");
// Cache the inspector button opening spotlight movie's full details modal
const heroDetailsBtn = document.getElementById("heroDetailsBtn");
// Cache the watchlist adding/removing trigger button in the hero
const heroWatchlistBtn = document.getElementById("heroWatchlistBtn");
// Cache the icon inside the hero watchlist button to animate changes
const heroWatchlistIcon = document.getElementById("heroWatchlistIcon");
// Cache the text label inside the hero watchlist button to toggle states
const heroWatchlistText = document.getElementById("heroWatchlistText");
// Cache the title label of the browse section to match selections
const sectionTitle = document.getElementById("sectionTitle");
// Cache the horizontal navigation elements for genre filter buttons
const genresContainer = document.getElementById("genresContainer");
// Cache the grid layout containing the active listing of movie items
const moviesGrid = document.getElementById("moviesGrid");
// Cache the overlay container explaining search/watchlist empty states
const emptyState = document.getElementById("emptyState");
// Cache the message text explaining empty states
const emptyStateText = document.getElementById("emptyStateText");
// Cache the main overlay modal element structure
const detailsModal = document.getElementById("detailsModal");
// Cache the button element enabling dismissals of the modal
const closeModalBtn = document.getElementById("closeModalBtn");
// Cache the backdrop banner image in the details modal
const modalBackdrop = document.getElementById("modalBackdrop");
// Cache the poster preview element in the details modal
const modalPoster = document.getElementById("modalPoster");
// Cache the movie title header in the details modal
const modalTitle = document.getElementById("modalTitle");
// Cache the subtitle tagline element in the details modal
const modalTagline = document.getElementById("modalTagline");
// Cache the rating metric element in the details modal
const modalRating = document.getElementById("modalRating");
// Cache the runtime length text in the details modal
const modalRuntime = document.getElementById("modalRuntime");
// Cache the release date container in the details modal
const modalRelease = document.getElementById("modalRelease");
// Cache the genres section wrapper in the details modal
const modalGenres = document.getElementById("modalGenres");
// Cache the long overview text container in the details modal
const modalOverview = document.getElementById("modalOverview");
// Cache the add/remove watchlist button inside the details modal
const modalWatchlistBtn = document.getElementById("modalWatchlistBtn");
// Cache the icon in the modal watchlist button to toggle heart states
const modalWatchlistIcon = document.getElementById("modalWatchlistIcon");
// Cache the text label in the modal watchlist button to update labels
const modalWatchlistText = document.getElementById("modalWatchlistText");
// Cache the cast cards list wrapper in the details modal
const modalCast = document.getElementById("modalCast");
// Cache the similar movies grid container in the details modal
const modalSimilar = document.getElementById("modalSimilar");

// Trigger the application setup sequence immediately when DOM is fully parsed
document.addEventListener("DOMContentLoaded", () => {
    // Invoke initial loading sequence
    init();
});

// Primary asynchronous startup handler initializing metadata, listeners, and views
async function init() {
    // Configure the localized regional indicator in header using the COUNTRY state
    countryIndicator.textContent = `Trending in ${COUNTRY}`;
    // Fetch external genre names list mapping from TMDB API
    await fetchGenres();
    // Build initial list of active genre filter buttons dynamically in UI
    renderGenrePills();
    // Fetch and draw details for the hero top spotlight display
    await fetchFeaturedMovie();
    // Load default popular movies list to grid
    await loadTabMovies("popular");
    // Update the watchlist header indicator size matching local storage
    updateWatchlistCount();
    // Bind all user interactive click and search inputs listeners
    setupEventListeners();
}

// Fetch helper targeting standard TMDB JSON request endpoints with API authorizations
async function fetchFromTMDB(endpoint, queryParams = {}) {
    // Try executing HTTP fetch request
    try {
        // Build base search query parameters with auth API Key
        const params = new URLSearchParams({ api_key: API_KEY, ...queryParams });
        // Send request fetch promise to TMDB servers
        const response = await fetch(`https://api.themoviedb.org/3/${endpoint}?${params.toString()}`);
        // Read response body stream as JavaScript object format
        const data = await response.json();
        // Return structured dataset properties
        return data;
    } catch (error) {
        // Output failure report to diagnostic console
        console.error("TMDB API fetch exception: ", error);
        // Return empty null object to fail safely
        return null;
    }
}

// Fetch the complete lists of official movie genres names from database
async function fetchGenres() {
    // Query TMDB official movie genre lists endpoints
    const data = await fetchFromTMDB("genre/movie/list");
    // Validate if data response exists with genres list
    if (data && data.genres) {
        // Cache the movie genres in the global genresList variable
        genresList = data.genres;
    }
}

// Fetch trending movie lists to randomly choose one as a hero banner
async function fetchFeaturedMovie() {
    // Load trending movies list from popular endpoint
    const data = await fetchFromTMDB("movie/popular");
    // Confirm dataset has valid results listing
    if (data && data.results && data.results.length > 0) {
        // Save the first popular movie item to state
        spotlightMovie = data.results[0];
        // Render hero elements with spotlight movie properties
        renderHero(spotlightMovie);
    }
}

// Write spotlight hero sections parameters with selected movie values
function renderHero(movie) {
    // Check if movie contains a valid backdrop image path
    if (movie.backdrop_path) {
        // Set background styling image pointing to TMDB standard high res image path
        heroBackdrop.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${movie.backdrop_path}')`;
    } else {
        // Use default Unsplash placeholder color styling if no backdrop exists
        heroBackdrop.style.backgroundImage = `url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000')`;
    }
    // Set text display content to movie's primary title name
    heroTitle.textContent = movie.title || "No Title Available";
    // Round user rating numeric value to single decimal precision
    heroRating.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";
    // Parse full date stamp to extract year slice representation
    heroYear.textContent = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";
    // Resolve genre label string names matching TMDB numeric category keys
    heroGenres.textContent = getGenreNames(movie.genre_ids).join(", ") || "General Content";
    // Inject summary plot text details into hero view
    heroOverview.textContent = movie.overview || "No synopsis available for this feature spotlight.";
    // Update the hero card's watchlist button icons/labels to match saved status
    updateWatchlistButton(movie.id, heroWatchlistIcon, heroWatchlistText);
}

// Loop genre array ids and translate them into friendly comma text formats
function getGenreNames(genreIds) {
    // Verify parameters existence
    if (!genreIds) return [];
    // Filter out missing references and return matches
    return genreIds
        .map(id => {
            // Find single match inside cached genresList
            const match = genresList.find(g => g.id === id);
            // Return match name or null if missing
            return match ? match.name : null;
        })
        // Filter out null matches
        .filter(name => name !== null);
}

// Generate dynamic filter pill navigation buttons for all major movie genres
function renderGenrePills() {
    // Clear initial markup in container
    genresContainer.innerHTML = "";
    // Create element node container for 'All' default genre reset filter
    const allPill = document.createElement("button");
    // Assign structural utility styling representing inactive/active states
    allPill.className = "genre-pill px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 bg-violet-600/20 text-violet-300 border border-violet-500/20 hover:bg-violet-600 hover:text-white";
    // Add text label
    allPill.textContent = "All Genres";
    // Bind click trigger executing reset parameters filter
    allPill.addEventListener("click", () => {
        // Set global genre tracking state to empty value
        currentGenreId = null;
        // Highlight this tab as selected and dim other selections
        updateGenrePillActiveState(allPill);
        // Refresh active movie grid
        refreshGrid();
    });
    // Append default pill button to containers parent
    genresContainer.appendChild(allPill);

    // Loop through individual parsed genre entries
    genresList.forEach(genre => {
        // Create pill button wrapper element
        const pill = document.createElement("button");
        // Establish style classes
        pill.className = "genre-pill px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white";
        // Assign text label representation of genre category name
        pill.textContent = genre.name;
        // Connect event listener tracking specific genre filters selection
        pill.addEventListener("click", () => {
            // Save selection to current index filter pointer
            currentGenreId = genre.id;
            // Set style layout accentuating selected tags
            updateGenrePillActiveState(pill);
            // Refresh main listings display
            refreshGrid();
        });
        // Append child node to browse layout
        genresContainer.appendChild(pill);
    });
}

// Highlight the selected genre pill dynamically and reset sibling indicators
function updateGenrePillActiveState(selectedPill) {
    // Gather all child nodes with genre pill identifier
    const pills = genresContainer.querySelectorAll(".genre-pill");
    // Loop pills array
    pills.forEach(pill => {
        // Strip active highlight styles and restore default dark layouts
        pill.classList.remove("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
        // Re-inject baseline styles back
        pill.classList.add("bg-white/5", "text-slate-400", "border-white/5");
    });
    // Strip default classes from selected active element target
    selectedPill.classList.remove("bg-white/5", "text-slate-400", "border-white/5");
    // Inject accent purple gradients highlighting active state selection
    selectedPill.classList.add("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
}

// Asynchronously load movie content lists based on active tab identifiers
async function loadTabMovies(tabName) {
    // Update active tab parameter
    currentTab = tabName;
    // Set grid visual feedback wrapper visibility to default loading skeleton state
    showLoadingSkeletons();
    // Declare movies array buffer
    let movies = [];
    // Evaluate the matching case mapping chosen tab names
    switch (tabName) {
        // Handle standard popular feeds
        case "popular":
            // Fetch popular movies
            const popData = await fetchFromTMDB("movie/popular");
            // Set values from response
            movies = popData ? popData.results : [];
            // Update section title text
            sectionTitle.textContent = "Trending Movies";
            // Break from case evaluation
            break;
        // Handle high rating scores listing
        case "top_rated":
            // Fetch top rated movies
            const topData = await fetchFromTMDB("movie/top_rated");
            // Set values from response
            movies = topData ? topData.results : [];
            // Update section title text
            sectionTitle.textContent = "Top Rated Selection";
            // Break from case evaluation
            break;
        // Handle future launches
        case "upcoming":
            // Fetch upcoming releases
            const upData = await fetchFromTMDB("movie/upcoming");
            // Set values from response
            movies = upData ? upData.results : [];
            // Update section title text
            sectionTitle.textContent = "Coming Soon";
            // Break from case evaluation
            break;
        // Handle local storage watchlist values
        case "watchlist":
            // Directly copy array from state
            movies = watchlist;
            // Update section title text
            sectionTitle.textContent = "My Saved Watchlist";
            // Break from case evaluation
            break;
    }
    // Set global movie listings buffer cache on the window object for filtering access
    window.currentMoviesCache = movies;
    // Refresh display layout grid
    refreshGrid();
}

// Re-render display grid mapping category values and active genre filters
function refreshGrid() {
    // Access cache buffer or return empty
    let movies = window.currentMoviesCache || [];
    // Check if user filtered results down by a specific genre tag
    if (currentGenreId !== null) {
        // Filter elements keeping only matching values in lists
        movies = movies.filter(movie => {
            // Confirm details genre_ids key exists
            if (movie.genre_ids) {
                // Check if target genre exists inside array
                return movie.genre_ids.includes(currentGenreId);
            }
            // Fallback to genres sub-object mapping from modal
            if (movie.genres) {
                // Check if target genre exists inside internal array
                return movie.genres.some(g => g.id === currentGenreId);
            }
            // Return false if metadata is missing
            return false;
        });
    }
    // Render the final filtered collection inside movies grid layout
    renderMoviesGrid(movies);
}

// Clean movies grid and draw movie cards
function renderMoviesGrid(movies) {
    // Clear movie layout inner markup elements
    moviesGrid.innerHTML = "";
    // Check if the input movies array is empty
    if (!movies || movies.length === 0) {
        // Adjust empty state description labels matching watchlist vs searches
        if (currentTab === "watchlist") {
            // Set specific empty text for watchlist
            emptyStateText.textContent = "Your watchlist is currently empty. Explore trending movies and click the heart icon to add them here!";
        } else {
            // Set generic search/filter empty status text
            emptyStateText.textContent = "No movies match your chosen filter. Try exploring other tabs or adjust your filters.";
        }
        // Remove hidden utility classes to display the empty panel element
        emptyState.classList.remove("hidden");
        // Exit function execution early
        return;
    }
    // Ensure the empty state warning panel elements are hidden
    emptyState.classList.add("hidden");

    // Loop through individual movie item elements in dataset
    movies.forEach(movie => {
        // Create wrapper card item button element
        const card = document.createElement("div");
        // Establish css classes
        card.className = "relative aspect-[2/3] group overflow-hidden rounded-2xl bg-slate-900 border border-white/5 cursor-pointer shadow-lg hover:shadow-violet-900/20 hover:border-violet-500/30 transition-all duration-300 hover:scale-[1.03]";
        // Set dynamic data element tracking unique ID
        card.dataset.id = movie.id;
        
        // Define poster image path mapping TMDB database URL
        const posterSrc = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        // Declare inner element layout buffer variable
        let posterHTML = "";
        // Check if poster path is valid
        if (posterSrc) {
            // Draw standard responsive image block
            posterHTML = `<img src="${posterSrc}" alt="${movie.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />`;
        } else {
            // Use custom CSS placeholder styling with movie name text if poster is missing
            posterHTML = `
                <div class="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 flex flex-col items-center justify-center p-4 text-center">
                    <i class="fa-solid fa-film text-3xl text-violet-500 mb-2"></i>
                    <span class="text-xs font-bold text-slate-300">${movie.title}</span>
                </div>
            `;
        }

        // Establish circular rating badge styling properties
        const ratingScore = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";
        // Check if watchlist contains this movie ID
        const activeWatchlist = isInWatchlist(movie.id);
        // Setup icon class based on status
        const watchlistIconClass = activeWatchlist ? "fa-solid fa-heart text-rose-500" : "fa-regular fa-heart text-white";

        // Assign core HTML structural inner blueprint for cards
        card.innerHTML = `
            <!-- The poster image block -->
            ${posterHTML}
            <!-- Overlay visual darkening mask appearing on hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-85 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <!-- Action Row at top containing watchlist heart shortcuts -->
                <div class="absolute top-3 right-3 z-10">
                    <button class="watchlist-card-btn w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 border border-white/10 hover:scale-110">
                        <i class="${watchlistIconClass}"></i>
                    </button>
                </div>
                <!-- Content info containing title metadata -->
                <div class="flex flex-col gap-1.5">
                    <!-- Rating and Year line items -->
                    <div class="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
                        <span class="flex items-center gap-0.5 text-yellow-400">
                            <i class="fa-solid fa-star text-[9px]"></i>
                            <span>${ratingScore}</span>
                        </span>
                        <span>•</span>
                        <span>${movie.release_date ? movie.release_date.substring(0, 4) : "N/A"}</span>
                    </div>
                    <!-- Movie Title -->
                    <h3 class="text-xs md:text-sm font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors duration-300">${movie.title}</h3>
                </div>
            </div>
        `;

        // Add event listener to open details modal when clicking anywhere on card
        card.addEventListener("click", () => {
            // Launch details fetch and loading sequences
            openMovieDetails(movie.id);
        });

        // Query inner card watchlist shortcut button
        const cardWatchBtn = card.querySelector(".watchlist-card-btn");
        // Bind stop propagation click to prevent card details click
        cardWatchBtn.addEventListener("click", (event) => {
            // Stop bubble click event from reaching card parent element
            event.stopPropagation();
            // Toggle watchlist parameters targeting current movie
            toggleWatchlist(movie);
        });

        // Append card element into grid layout container
        moviesGrid.appendChild(card);
    });
}

// Generate animated skeleton loading cards elements inside moviesGrid
function showLoadingSkeletons() {
    // Clear movie layout inner markup elements
    moviesGrid.innerHTML = "";
    // Hide empty state elements
    emptyState.classList.add("hidden");
    // Generate repeated loading cards block in grid
    for (let i = 0; i < 10; i++) {
        // Create div card placeholder element
        const skeleton = document.createElement("div");
        // Inject layout animate pulse styling
        skeleton.className = "animate-pulse bg-white/5 border border-white/5 rounded-2xl overflow-hidden aspect-[2/3] flex flex-col justify-end p-4 gap-2";
        // Set inline layout templates
        skeleton.innerHTML = `
            <div class="h-4 bg-white/10 rounded w-3/4"></div>
            <div class="h-3 bg-white/10 rounded w-1/2"></div>
        `;
        // Append card placeholder back to grid container
        moviesGrid.appendChild(skeleton);
    }
}

// Connect layout tab elements clicking actions
function setupEventListeners() {
    // Gather all categories navbar buttons
    const tabs = document.querySelectorAll(".category-tab");
    // Loop individual buttons in layout
    tabs.forEach(tab => {
        // Bind click execution switches
        tab.addEventListener("click", () => {
            // Parse category from DOM id attribute
            const tabName = tab.id.replace("tab-", "");
            // Update selected buttons styling layouts
            updateActiveTabState(tab);
            // Load and draw matching datasets
            loadTabMovies(tabName);
        });
    });

    // Set search bar input text tracking
    searchInput.addEventListener("input", (e) => {
        // Capture input value
        const query = e.target.value.trim();
        // Check if query contains content
        if (query.length > 0) {
            // Show clear close button
            clearSearch.classList.remove("hidden");
        } else {
            // Hide clear close button
            clearSearch.classList.add("hidden");
        }
        // Set active search timeout debounce handler
        clearTimeout(searchDebounceTimer);
        // Establish 400ms buffer before execution
        searchDebounceTimer = setTimeout(() => {
            // Execute TMDB Search API Call
            executeSearch(query);
        }, 400);
    });

    // Clear search bar contents and reload popular items on click
    clearSearch.addEventListener("click", () => {
        // Reset input value to empty string
        searchInput.value = "";
        // Hide clear close button
        clearSearch.classList.add("hidden");
        // Reload default popular tab
        loadTabMovies(currentTab);
    });

    // Bind clicking listener to spotlight detail inspect triggers
    heroDetailsBtn.addEventListener("click", () => {
        // Confirm spotlight movie reference pointer exists
        if (spotlightMovie) {
            // Launch details fetch and loading sequences
            openMovieDetails(spotlightMovie.id);
        }
    });

    // Bind clicking listener to spotlight watchlist triggers
    heroWatchlistBtn.addEventListener("click", () => {
        // Confirm spotlight movie reference pointer exists
        if (spotlightMovie) {
            // Execute toggle operation
            toggleWatchlist(spotlightMovie);
            // Redraw watchlist indicator button states in hero section
            updateWatchlistButton(spotlightMovie.id, heroWatchlistIcon, heroWatchlistText);
        }
    });

    // Bind dismiss action details click
    closeModalBtn.addEventListener("click", () => {
        // Run close modal procedure
        closeMovieDetailsModal();
    });

    // Dismiss details modal when clicking outside contents frame
    detailsModal.addEventListener("click", (e) => {
        // Confirm target elements match modal outer overlay background wrapper
        if (e.target === detailsModal) {
            // Dismiss details modal
            closeMovieDetailsModal();
        }
    });

    // Click watchlist button directly in nav bar to open watchlist tab
    document.getElementById("watchlistNavBtn").addEventListener("click", () => {
        // Query tab element targeting watchlist view
        const watchlistTab = document.getElementById("tab-watchlist");
        // Force active layout switches styling
        updateActiveTabState(watchlistTab);
        // Execute datasets loading procedures
        loadTabMovies("watchlist");
    });
}

// Adjust navigation tabs highlight parameters reflecting user selection
function updateActiveTabState(selectedTab) {
    // Gather all tabs elements in navigation menu
    const tabs = document.querySelectorAll(".category-tab");
    // Loop individual elements
    tabs.forEach(tab => {
        // Strip active highlight violet colors
        tab.classList.remove("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
        // Re-inject dimmed default styles
        tab.classList.add("text-slate-400", "hover:text-white", "hover:bg-white/5");
    });
    // Strip default classes from selected active element target
    selectedTab.classList.remove("text-slate-400", "hover:text-white", "hover:bg-white/5");
    // Inject accent purple gradients highlighting active tab selection
    selectedTab.classList.add("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
}

// Asynchronously execute TMDB search query and draw search outputs
async function executeSearch(query) {
    // Check if query is empty
    if (!query) {
        // Restore active category lists
        loadTabMovies(currentTab);
        // Stop execution
        return;
    }
    // Update active tab label text to indicate search mode
    sectionTitle.textContent = `Search Results for "${query}"`;
    // Update grids visual feedback loading skeleton layouts
    showLoadingSkeletons();
    
    // Call TMDB API search endpoint
    const data = await fetchFromTMDB("search/movie", { query: query });
    // Cache the search movies results on the global window cache object
    window.currentMoviesCache = data ? data.results : [];
    // Reset active genre tracking so we search globally
    currentGenreId = null;
    // Clear active status styling on all genre pills
    resetGenrePillsHighlight();
    // Render layout grids using query responses
    refreshGrid();
}

// Reset all genre pill button styles to default state
function resetGenrePillsHighlight() {
    // Gather all child nodes with genre pill identifier
    const pills = genresContainer.querySelectorAll(".genre-pill");
    // Loop pills array
    pills.forEach((pill, index) => {
        // Strip active highlight styles and restore default dark layouts
        pill.classList.remove("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
        // If it is the first pill, restore its active color theme, otherwise restore default dark layout
        if (index === 0) {
            // Set first pill back to active
            pill.classList.add("bg-violet-600", "text-white", "shadow-md", "shadow-violet-950/50");
        } else {
            // Set all other pills back to default style
            pill.classList.add("bg-white/5", "text-slate-400", "border-white/5");
        }
    });
}

// Request complete metadata, cast members, and similar recommendations
async function openMovieDetails(movieId) {
    // Call TMDB movie details endpoint appending credits and similar listings
    const movie = await fetchFromTMDB(`movie/${movieId}`, { append_to_response: "credits,similar" });
    // Check if dataset returns details successfully
    if (movie) {
        // Draw details modal container nodes parameters
        renderMovieDetailsModal(movie);
        // Show details modal overlay container by updating opacity classes
        detailsModal.classList.remove("opacity-0", "pointer-events-none");
        // Enable click interactions and pointer events
        detailsModal.classList.add("opacity-100", "pointer-events-auto");
        // Disable body scroll background to allow scrolling inside modal container
        document.body.classList.add("overflow-hidden");
    }
}

// Reset modal container details, remove visibilities, restore main window scrolls
function closeMovieDetailsModal() {
    // Hide details modal container by updating opacity classes
    detailsModal.classList.remove("opacity-100", "pointer-events-auto");
    // Enable background layout visibility
    detailsModal.classList.add("opacity-0", "pointer-events-none");
    // Restore default body scrolling parameters
    document.body.classList.remove("overflow-hidden");
}

// Assemble elements inner content layouts inside modal display
function renderMovieDetailsModal(movie) {
    // Check if movie contains a valid backdrop image path
    if (movie.backdrop_path) {
        // Draw backdrop image block URL path
        modalBackdrop.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${movie.backdrop_path}')`;
    } else {
        // Set solid dark background fallback
        modalBackdrop.style.backgroundImage = "none";
        // Apply default colors
        modalBackdrop.classList.add("bg-slate-950");
    }

    // Set poster image path if exists
    if (movie.poster_path) {
        // Set source attribute to TMDB poster URL path
        modalPoster.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        // Show poster image block
        modalPoster.classList.remove("hidden");
    } else {
        // Hide poster block if missing
        modalPoster.classList.add("hidden");
    }

    // Write title heading
    modalTitle.textContent = movie.title || "No Title Available";
    // Write tagline subtitle
    modalTagline.textContent = movie.tagline || "";
    // Write score text
    modalRating.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";
    // Write movie duration format length
    modalRuntime.textContent = movie.runtime ? `${movie.runtime} min` : "N/A";
    // Write full release date
    modalRelease.textContent = movie.release_date || "Unknown Release Date";
    // Write summary plot paragraph text
    modalOverview.textContent = movie.overview || "No synopsis available for this title.";

    // Clear initial genre tags container
    modalGenres.innerHTML = "";
    // Verify genres dataset list exists
    if (movie.genres) {
        // Loop individual movie genres
        movie.genres.forEach(genre => {
            // Create span pill element
            const badge = document.createElement("span");
            // Set styles classes
            badge.className = "bg-violet-900/30 text-violet-300 border border-violet-800/30 px-3 py-1 rounded-full text-xs font-semibold";
            // Add label
            badge.textContent = genre.name;
            // Append badge child
            modalGenres.appendChild(badge);
        });
    }

    // Update watchlist button icons/labels inside details modal matching saved status
    updateWatchlistButton(movie.id, modalWatchlistIcon, modalWatchlistText);
    
    // Clear and re-bind event listener on modal watchlist toggle button
    const newModalWatchlistBtn = modalWatchlistBtn.cloneNode(true);
    // Replace old button node structure to clear previous event listeners
    modalWatchlistBtn.parentNode.replaceChild(newModalWatchlistBtn, modalWatchlistBtn);
    // Re-cache dynamic reference pointer
    const updatedModalWatchlistBtn = document.getElementById("modalWatchlistBtn");
    // Connect new click event handler
    updatedModalWatchlistBtn.addEventListener("click", () => {
        // Toggle watchlist parameters targeting current movie
        toggleWatchlist(movie);
        // Query dynamic icon element inside new button container
        const modalIcon = updatedModalWatchlistBtn.querySelector("#modalWatchlistIcon");
        // Query dynamic text element inside new button container
        const modalText = updatedModalWatchlistBtn.querySelector("#modalWatchlistText");
        // Redraw watchlist indicator button states in modal
        updateWatchlistButton(movie.id, modalIcon, modalText);
    });

    // Clear cast lists elements inner content
    modalCast.innerHTML = "";
    // Check if credits cast entries exist
    if (movie.credits && movie.credits.cast && movie.credits.cast.length > 0) {
        // Extract top 4 cast actors
        const topCast = movie.credits.cast.slice(0, 4);
        // Loop actors items
        topCast.forEach(actor => {
            // Create cast card wrapper element
            const actorCard = document.createElement("div");
            // Set layout classes
            actorCard.className = "flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-xl";
            
            // Build profile avatar path
            const profileUrl = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null;
            // Set profile HTML representation
            const avatarHTML = profileUrl 
                ? `<img src="${profileUrl}" alt="${actor.name}" class="w-10 h-10 rounded-full object-cover border border-white/10" />`
                : `<div class="w-10 h-10 rounded-full bg-violet-950 flex items-center justify-center text-xs font-bold text-violet-300 border border-white/10"><i class="fa-solid fa-user"></i></div>`;
            
            // Assemble inner HTML structure for actor cards
            actorCard.innerHTML = `
                ${avatarHTML}
                <div class="flex flex-col min-w-0">
                    <span class="text-xs font-bold text-white truncate">${actor.name}</span>
                    <span class="text-[10px] text-slate-400 truncate">${actor.character || "Actor"}</span>
                </div>
            `;
            // Append actor card node
            modalCast.appendChild(actorCard);
        });
    } else {
        // Write empty status message if cast is missing
        modalCast.innerHTML = `<p class="text-xs text-slate-500 col-span-2">Cast list is currently unavailable.</p>`;
    }

    // Clear similar movies grid container elements inner content
    modalSimilar.innerHTML = "";
    // Check if similar movies entries exist
    if (movie.similar && movie.similar.results && movie.similar.results.length > 0) {
        // Extract top 4 recommended movies
        const recommendations = movie.similar.results.slice(0, 4);
        // Loop recommended movies
        recommendations.forEach(similarMovie => {
            // Create recommendation card wrapper element
            const similarCard = document.createElement("div");
            // Set layout classes
            similarCard.className = "group cursor-pointer flex flex-col gap-1 bg-white/5 border border-white/5 p-1.5 rounded-xl transition-all duration-300 hover:bg-white/10";
            
            // Build poster image path
            const posterUrl = similarMovie.poster_path ? `https://image.tmdb.org/t/p/w185${similarMovie.poster_path}` : null;
            // Set poster HTML representation
            const posterHTML = posterUrl 
                ? `<img src="${posterUrl}" alt="${similarMovie.title}" class="w-full aspect-[2/3] object-cover rounded-lg border border-white/10 group-hover:scale-[1.02] transition-transform duration-300" />`
                : `<div class="w-full aspect-[2/3] bg-violet-950/20 flex flex-col items-center justify-center text-center p-2 rounded-lg border border-white/10"><i class="fa-solid fa-film text-lg text-violet-500/60 mb-1"></i><span class="text-[9px] text-slate-400 line-clamp-2">${similarMovie.title}</span></div>`;
            
            // Assemble inner HTML structure for similar movies
            similarCard.innerHTML = `
                ${posterHTML}
                <span class="text-[10px] font-bold text-white line-clamp-1 mt-1 group-hover:text-violet-400 transition-colors">${similarMovie.title}</span>
            `;
            // Bind click event handler to load recommended movie details inside modal directly
            similarCard.addEventListener("click", () => {
                // Fetch and render the new movie details inside same modal
                openMovieDetails(similarMovie.id);
            });
            // Append recommendation card node
            modalSimilar.appendChild(similarCard);
        });
    } else {
        // Write empty status message if recommendations are missing
        modalSimilar.innerHTML = `<p class="text-xs text-slate-500 col-span-2">No recommendations available.</p>`;
    }
}

// Add or remove target movie item from user watchlist array
function toggleWatchlist(movie) {
    // Search index location matching target movie id
    const index = watchlist.findIndex(m => m.id === movie.id);
    // Check if item was found
    if (index > -1) {
        // Remove item from saved watchlist array
        watchlist.splice(index, 1);
    } else {
        // Push target movie object into watchlist array
        watchlist.push(movie);
    }
    // Update local storage values using updated watchlist
    localStorage.setItem("lonMovieWatchlist", JSON.stringify(watchlist));
    // Update counts badge
    updateWatchlistCount();
    
    // Update state of buttons across watchlist grid layout and cards
    updateWatchlistButton(movie.id, heroWatchlistIcon, heroWatchlistText);
    
    // Check if user is currently looking at watchlist tab
    if (currentTab === "watchlist") {
        // Force refresh listing using updated values in cache
        window.currentMoviesCache = watchlist;
        // Refresh grid
        refreshGrid();
    } else {
        // If not in watchlist tab, find card element matching target movie ID
        const card = moviesGrid.querySelector(`[data-id="${movie.id}"]`);
        // Check if card element exists in grid
        if (card) {
            // Query heart button icon inside card
            const heartIcon = card.querySelector(".watchlist-card-btn i");
            // Check if card is currently saved in watchlist
            const isSaved = isInWatchlist(movie.id);
            // Toggle classes on card's heart shortcut icon
            if (isSaved) {
                // Highlight heart icon
                heartIcon.className = "fa-solid fa-heart text-rose-500";
            } else {
                // Clear heart highlight styling
                heartIcon.className = "fa-regular fa-heart text-white";
            }
        }
    }
}

// Check if a specific movie exists within watchlist records
function isInWatchlist(movieId) {
    // Return boolean evaluation checking id matches
    return watchlist.some(m => m.id === movieId);
}

// Redraw target indicator watchlist buttons state and text contents
function updateWatchlistButton(movieId, iconEl, textEl) {
    // Confirm elements exist
    if (!iconEl || !textEl) return;
    // Check if target movie ID is in watchlist
    const isSaved = isInWatchlist(movieId);
    // Check status condition
    if (isSaved) {
        // Swap icon to solid checked heart indicator
        iconEl.className = "fa-solid fa-heart text-rose-500";
        // Swap label text to watchlist saved confirmation
        textEl.textContent = "In Watchlist";
    } else {
        // Swap icon to hollow plus sign indicator
        iconEl.className = "fa-solid fa-plus text-white";
        // Swap label text to watchlist add action
        textEl.textContent = "My Watchlist";
    }
}

// Read size of local watchlist array and update counts badge in header
function updateWatchlistCount() {
    // Assign text content to size of watchlist array
    watchlistCount.textContent = watchlist.length;
}
