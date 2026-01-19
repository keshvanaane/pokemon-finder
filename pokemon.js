// Fetch Pokemon data and display it
async function fetchdata() {
    
    try {
        let input = document.getElementById("name").value.trim();
        
        if (!input) {
            showError("Please enter a Pokemon name or ID");
            return;
        }

        // If input is numeric, use it as is (ID). Otherwise, convert to lowercase (name)
        const pokemonIdentifier = /^\d+$/.test(input) ? input : input.toLowerCase();
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonIdentifier}`);

        if (!response.ok) {
            throw new Error("Pokemon not found");
        }

        const data = await response.json();
        document.getElementById("autocomplete-dropdown").style.display = "none";
        displayPokemon(data);
    }
    catch (error) {
        showError(error.message);
    }
}

// Store all Pokemon for autocomplete
let allPokemon = [];

// Initialize autocomplete on page load
async function initializeAutocomplete() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        allPokemon = data.results.map(p => p.name);
    }
    catch (error) {
        console.error("Error loading Pokemon list:", error);
    }
}

// Filter and display Pokemon suggestions
function filterPokemon(input) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    
    if (!input.trim()) {
        dropdown.style.display = "none";
        return;
    }

    const filtered = allPokemon.filter(pokemon => 
        pokemon.toLowerCase().startsWith(input.toLowerCase())
    ).slice(0, 8); // Show max 8 suggestions

    if (filtered.length === 0) {
        dropdown.style.display = "none";
        return;
    }

    dropdown.innerHTML = filtered.map(pokemon => 
        `<div class="autocomplete-item" onclick="selectPokemon('${pokemon}')">${pokemon}</div>`
    ).join('');
    
    dropdown.style.display = "block";
}

// Select a Pokemon from autocomplete
function selectPokemon(name) {
    document.getElementById("name").value = name;
    document.getElementById("autocomplete-dropdown").style.display = "none";
}

// Get a random Pokemon
async function getRandomPokemon() {
    try {
        const randomId = Math.floor(Math.random() * 1025) + 1; // Pokemon IDs range from 1 to 1025
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);

        if (!response.ok) {
            throw new Error("Could not fetch random Pokemon");
        }

        const data = await response.json();
        document.getElementById("name").value = data.name;
        displayPokemon(data);
    }
    catch (error) {
        showError(error.message);
    }
}

// Display Pokemon information
async function displayPokemon(data) {
    document.getElementById("error-message").style.display = "none";
    document.getElementById("pokemon-card").style.display = "block";

    // Basic info
    document.getElementById("pokemon-name").textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    document.getElementById("pokemon-id").textContent = `#${data.id}`;
    document.getElementById("pokemonsprite").src = data.sprites.front_default || '';
    document.getElementById("pokemon-height").textContent = (data.height / 10) + ' m';
    document.getElementById("pokemon-weight").textContent = (data.weight / 10) + ' kg';

    // Speed
    const speedStat = data.stats.find(stat => stat.stat.name === "speed");
    document.getElementById("pokemon-speed").textContent = speedStat ? speedStat.base_stat : 'N/A';

    // Types
    const typeContainer = document.getElementById("pokemon-type");
    typeContainer.innerHTML = data.types.map(type => 
        `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
    ).join('');

    // Get type effectiveness (strengths and weaknesses)
    // await getTypeEffectiveness(data.types);

    // Get habitat
    await getHabitat(data.species.url);

    // Base stats
    displayBaseStats(data.stats);
}

// Display base stats as bars
function displayBaseStats(stats) {
    const statNames = {
        'hp': 'HP',
        'attack': 'Attack',
        'defense': 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        'speed': 'Speed'
    };

    const statsContainer = document.getElementById("pokemon-stats");
    statsContainer.innerHTML = stats.map(stat => {
        const percentage = (stat.base_stat / 150) * 100;
        return `
            <div class="stat-bar">
                <span class="stat-name">${statNames[stat.stat.name]}</span>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="stat-value">${stat.base_stat}</span>
            </div>
        `;
    }).join('');
}

// Get type effectiveness
async function getTypeEffectiveness(types) {
    try {
        let allStrengths = new Set();
        let allWeaknesses = new Set();

        // Fetch effectiveness for each type
        for (let type of types) {
            const response = await fetch(`https://pokeapi.co/api/v2/type/${type.type.name}`);
            const data = await response.json();

            // Add to sets to avoid duplicates
            data.damage_relations.damage_to.forEach(t => allStrengths.add(t.name));
            data.damage_relations.damage_from.forEach(t => allWeaknesses.add(t.name));
        }

        // Convert sets to arrays and display
        displayBadges("pokemon-strengths", Array.from(allStrengths));
        displayBadges("pokemon-weaknesses", Array.from(allWeaknesses));
    }
    catch (error) {
        console.error("Error fetching type effectiveness:", error);
        displayBadges("pokemon-strengths", []);
        displayBadges("pokemon-weaknesses", []);
    }
}

// Display badges
function displayBadges(elementId, items) {
    const container = document.getElementById(elementId);
    container.innerHTML = items.map(item => 
        `<span class="badge">${item}</span>`
    ).join('');

    if (items.length === 0) {
        container.innerHTML = '<span class="badge">N/A</span>';
    }
}

// Get habitat
async function getHabitat(speciesUrl) {
    try {
        const response = await fetch(speciesUrl);
        const data = await response.json();
        const habitat = data.habitat ? data.habitat.name : "Unknown";
        document.getElementById("pokemon-habitat").textContent = habitat.charAt(0).toUpperCase() + habitat.slice(1);
    }
    catch (error) {
        console.error("Error fetching habitat:", error);
        document.getElementById("pokemon-habitat").textContent = "Unknown";
    }
}

// Show error message
function showError(message) {
    document.getElementById("pokemon-card").style.display = "none";
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

// Initialize on page load
window.addEventListener('load', initializeAutocomplete);