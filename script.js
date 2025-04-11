document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const generationSelect = document.getElementById('generation-select');
    const pokemonListElement = document.getElementById('pokemon-list');
    const pokemonListTitle = document.getElementById('pokemon-list-title');
    const pokemonCard = document.getElementById('pokemon-card');

    // State & Constants
    let activeListItem = null;
    let currentGenerationId = null; // Track the currently loaded generation
    const MAX_STAT_VALUE = 255;
    const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/";

    // --- UI Update Functions ---
    function showLoadingState(area = 'card') {
        if (area === 'card') {
             pokemonCard.innerHTML = '<p class="loading">Loading Pokémon...</p>';
             pokemonCard.classList.remove('fade-in', 'fade-out');
        } else if (area === 'list') {
            pokemonListTitle.textContent = `Loading Generation...`;
            pokemonListElement.innerHTML = '<p class="loading">Loading list...</p>';
        }
    }

    function showErrorState(message = "An error occurred.", area = 'card') {
         if (area === 'card') {
            pokemonCard.innerHTML = `<p class="error">${message}</p>`;
             pokemonCard.classList.remove('fade-in', 'fade-out');
        } else if (area === 'list') {
            pokemonListTitle.textContent = `Error`;
            pokemonListElement.innerHTML = `<p class="error">${message}</p>`;
            pokemonCard.innerHTML = '';
        }
    }

    function resetCardStructure() {
         pokemonCard.innerHTML = `
            <span class="pokemon-number" id="pokemon-number"></span>
            <h2 class="pokemon-name" id="pokemon-name"></h2>
            <div class="pokemon-image-container">
                 <img id="pokemon-image" src="" alt="Pokemon Sprite">
            </div>
            <div class="pokemon-types" id="pokemon-types"></div>
            <p class="pokemon-description" id="pokemon-description"></p>
            <div class="pokemon-stats" id="pokemon-stats"></div>
        `;
    }

    // --- Helper Functions --- 
     function createTypeSpans(typesData) {
        return typesData.map(typeInfo => {
            const typeName = typeInfo.type.name;
            const typeClass = `type-${typeName.toLowerCase()}`;
            return `<span class="type ${typeClass}">${typeName}</span>`;
        }).join('');
    }
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function createStatsHtml(statsData) {
        let statsHtml = '<h3>Base Stats</h3>';
        const statNames = {
            'hp': 'HP', 'attack': 'Attack', 'defense': 'Defense',
            'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', 'speed': 'Speed'
        };

        statsData.forEach(statInfo => {
            const statKey = statInfo.stat.name;
            const statValue = statInfo.base_stat;
            const statName = statNames[statKey] || statKey;
            const barWidth = Math.min(100, (statValue / MAX_STAT_VALUE) * 100);
            const statClass = statKey.toLowerCase();

            statsHtml += `
                <div class="stat-item">
                    <span class="stat-label">${statName}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar ${statClass}" style="width: ${barWidth}%;"></div>
                    </div>
                    <span class="stat-value">${statValue}</span>
                </div>
            `;
        });
        return statsHtml;
    }

    function findEnglishFlavorText(flavorTextEntries) {
        const versionPreferences = ['red', 'blue', 'yellow', 'firered', 'leafgreen', 'sword', 'shield', 'scarlet', 'violet', 'x', 'y', 'sun', 'moon']; // Expanded preferences
        let bestMatch = null;

        if (!flavorTextEntries || flavorTextEntries.length === 0) {
             return "No description available.";
        }

        for (const entry of flavorTextEntries) {
            if (entry.language.name === 'en') {
                const version = entry.version.name;
                const cleanedText = entry.flavor_text.replace(/[\n\f\r]/g, ' ').replace('POKéMON', 'Pokémon'); 
                if (versionPreferences.includes(version)) {
                     return cleanedText; 
                }
                if (!bestMatch) { 
                    bestMatch = cleanedText;
                }
            }
        }
        return bestMatch || "No English description available.";
    }

    function extractIdFromUrl(url) {
        // Extracts the ID from a PokéAPI URL (like .../pokemon-species/1/)
        return url.split('/').filter(Boolean).pop();
    }


    // --- Core Logic Functions ---

    async function displayPokemon(pokemonIdOrName) {
        // If the function is called without an identifier, do nothing or show placeholder
        if (!pokemonIdOrName) {
            resetCardStructure(); // Ensure card is reset
            pokemonCard.innerHTML = '<p class="loading">Select a Pokémon from the list.</p>';
            return;
        }
        showLoadingState('card');

        try {
            const response = await fetch(`${POKEAPI_BASE_URL}pokemon/${pokemonIdOrName}`);
             if (!response.ok) throw new Error(`Pokémon not found (${response.status})`);
            const pokemonData = await response.json();

            const speciesResponse = await fetch(pokemonData.species.url);
             if (!speciesResponse.ok) throw new Error(`Species data not found (${speciesResponse.status})`);
            const speciesData = await speciesResponse.json();

            // Data Extraction
            const id = pokemonData.id;
            const name = pokemonData.name;
             const imageUrl = pokemonData.sprites.versions['generation-v']['black-white']?.animated?.front_default
                           || pokemonData.sprites.other['official-artwork']?.front_default
                           || pokemonData.sprites.front_default
                           || 'placeholder.png'; // Add a placeholder image URL if needed
            const types = pokemonData.types;
            const stats = pokemonData.stats;
            const description = findEnglishFlavorText(speciesData.flavor_text_entries);

            // Update UI
            resetCardStructure(); // Reset card HTML

            // Re-select elements within the reset card
            const numberEl = document.getElementById('pokemon-number');
            const nameEl = document.getElementById('pokemon-name');
            const imageEl = document.getElementById('pokemon-image');
            const typesEl = document.getElementById('pokemon-types');
            const descriptionEl = document.getElementById('pokemon-description');
            const statsEl = document.getElementById('pokemon-stats');

             if(numberEl) numberEl.textContent = `#${String(id).padStart(3, '0')}`;
             if(nameEl) nameEl.textContent = capitalizeFirstLetter(name);
             if(imageEl) { imageEl.src = imageUrl; imageEl.alt = `${name} sprite`; }
             if(typesEl) typesEl.innerHTML = createTypeSpans(types);
             if(descriptionEl) descriptionEl.textContent = description;
             if(statsEl) statsEl.innerHTML = createStatsHtml(stats);

            // Fade in effect
            setTimeout(() => {
                pokemonCard.classList.add('fade-in');
                pokemonCard.addEventListener('transitionend', () => pokemonCard.classList.remove('fade-in'), { once: true });
            }, 10);

        } catch (error) {
            console.error("Error displaying Pokémon:", pokemonIdOrName, error);
            showErrorState(`Failed to load ${pokemonIdOrName}. ${error.message}`, 'card');
        }
    }

    async function populatePokemonList(generationId) {
        if (currentGenerationId === generationId) return; // Avoid reloading same generation
        currentGenerationId = generationId; // Update current generation tracker

        showLoadingState('list'); // Show loading in the list area
         displayPokemon(null); // Clear the main display or show placeholder


        try {
            const response = await fetch(`${POKEAPI_BASE_URL}generation/${generationId}`);
             if (!response.ok) throw new Error(`Generation data not found (${response.status})`);
            const genData = await response.json();

            pokemonListTitle.textContent = `${genData.main_region?.name || `Generation ${generationId}`} Pokémon`; // Update title (e.g., Kanto Pokémon)

            // Extract species, get IDs, and sort numerically
            const pokemonSpecies = genData.pokemon_species.map(species => ({
                name: species.name,
                id: parseInt(extractIdFromUrl(species.url), 10) // Ensure ID is a number
            })).sort((a, b) => a.id - b.id); // Sort by ID

             pokemonListElement.innerHTML = ''; // Clear previous list/loading message

            if (pokemonSpecies.length === 0) {
                 pokemonListElement.innerHTML = '<p>No Pokémon found for this generation.</p>';
                 return; // Exit if no Pokémon
            }

            // Populate list items
            pokemonSpecies.forEach(pokemon => {
                const listItem = document.createElement('li');
                listItem.textContent = `${String(pokemon.id).padStart(3, '0')} ${capitalizeFirstLetter(pokemon.name)}`;
                listItem.dataset.pokemonIdentifier = pokemon.id; // Store ID // Store ID

                listItem.addEventListener('click', () => {
                    if (activeListItem) activeListItem.classList.remove('active');
                    listItem.classList.add('active');
                    activeListItem = listItem;
                    displayPokemon(listItem.dataset.pokemonIdentifier);
                });
                pokemonListElement.appendChild(listItem);
            });

            // Automatically display the first Pokémon of the loaded generation
            const firstPokemonId = pokemonSpecies[0].id;
             await displayPokemon(firstPokemonId);

            // Mark the first item as active visually
             const firstListItem = pokemonListElement.querySelector(`li[data-pokemon-identifier='${firstPokemonId}']`);
             if (firstListItem) {
                 firstListItem.classList.add('active');
                 activeListItem = firstListItem;
             }
        } catch (error) {
            console.error("Error populating Pokémon list:", error);
            showErrorState(`Failed to load Generation ${generationId}. ${error.message}`, 'list');
        }
    }
    // --- Event Listeners ---
    generationSelect.addEventListener('change', (event) => {
        const selectedGenerationId = event.target.value;
        populatePokemonList(selectedGenerationId);
    });

    // --- Initialize ---
    const initialGeneration = generationSelect.value || 1; // Default to Gen 1
    populatePokemonList(initialGeneration);
});