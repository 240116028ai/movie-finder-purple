import './style.css';

const form = document.querySelector('#search-form');
const titleInput = document.querySelector('#movie-title');
const statusLine = document.querySelector('#status');
const resultCard = document.querySelector('#movie-result');
const resultTitle = document.querySelector('#result-title');
const resultRating = document.querySelector('#result-rating');
const resultPlot = document.querySelector('#result-plot');
const watchlistButton = document.querySelector('#watchlist-button');

let currentMovie = null;

function setStatus(message, type = '') {
  statusLine.textContent = message;
  statusLine.className = `status${type ? ` status-${type}` : ''}`;
}

function isValidMovie(movie) {
  return (
    typeof movie?.Title === 'string' &&
    movie.Title.trim() !== '' &&
    typeof movie?.Year === 'string' &&
    movie.Year.trim() !== '' &&
    typeof movie?.imdbRating === 'string' &&
    movie.imdbRating.trim() !== '' &&
    movie.imdbRating !== 'N/A' &&
    typeof movie?.Plot === 'string' &&
    movie.Plot.trim() !== ''
  );
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();

  currentMovie = null;
  resultCard.hidden = true;
  watchlistButton.hidden = true;

  if (!title) {
    setStatus('Please enter a movie title.', 'error');
    titleInput.focus();
    return;
  }

  const apiKey = import.meta.env.VITE_OMDB_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    setStatus('Add your OMDb API key to the local .env file to search.', 'error');
    return;
  }

  setStatus('Loading...', 'loading');

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${encodeURIComponent(apiKey)}`,
    );
    if (!response.ok) {
      throw new Error(`Movie search failed (HTTP ${response.status}).`);
    }

    const movie = await response.json();
    if (movie.Response === 'False') {
      throw new Error(movie.Error || 'No movie was found. Try another title.');
    }
    if (!isValidMovie(movie)) {
      throw new Error('The movie result is missing required details.');
    }

    currentMovie = {
      title: movie.Title.trim(),
      year: movie.Year.trim(),
      rating: movie.imdbRating.trim(),
    };
    resultTitle.textContent = `${currentMovie.title} (${currentMovie.year})`;
    resultRating.textContent = currentMovie.rating;
    resultPlot.textContent = movie.Plot.trim();
    resultCard.hidden = false;
    watchlistButton.hidden = false;
    setStatus('Movie found. Enjoy the details!', 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Something went wrong while searching.', 'error');
  }
});

watchlistButton.addEventListener('click', async () => {
  if (
    !currentMovie ||
    !currentMovie.title.trim() ||
    !currentMovie.year.trim() ||
    !currentMovie.rating.trim()
  ) {
    setStatus('Search for a valid movie before adding it to your watchlist.', 'error');
    return;
  }

  watchlistButton.disabled = true;
  setStatus('Saving to your watchlist...', 'loading');

  try {
    const payload = {
      title: currentMovie.title,
      year: currentMovie.year,
      rating: currentMovie.rating,
    };
    const response = await fetch('http://localhost:3001/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Could not save to watchlist (HTTP ${response.status}).`);
    }

    setStatus('Added to your watchlist!', 'success');
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'Something went wrong while saving to your watchlist.',
      'error',
    );
  } finally {
    watchlistButton.disabled = false;
  }
});
