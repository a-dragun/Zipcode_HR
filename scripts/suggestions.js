function showSuggestions(text) {
    const query = text.toLowerCase().trim();
    suggestionsBox.innerHTML = '';
    if (!query || query.length < 2) return;

    const nameMatches = allFeatures.filter(f =>
        f.properties.name.toLowerCase().includes(query)
    );

    let postcodeMatches = allFeatures.filter(f =>
        f.properties.postcode.toString().includes(query)
    );

    if (query === "10000") {
        postcodeMatches = postcodeMatches.filter(f =>
            f.properties.name.toLowerCase() != "grad zagreb"
        );
    }

    const matches = [];
    const seenPostcodes = new Set();

    nameMatches.forEach(f => {
        matches.push({ type: 'name', feature: f });
    });

    postcodeMatches.forEach(f => {
        if (!seenPostcodes.has(f.properties.postcode)) {
            seenPostcodes.add(f.properties.postcode);
            matches.push({ type: 'postcode', postcode: f.properties.postcode });
        }
    });

    if (matches.length === 0) {
        const noResult = document.createElement('div');
        noResult.className = 'suggestion-item';
        noResult.textContent = 'Nema rezultata.';
        suggestionsBox.appendChild(noResult);
        return;
    }

    matches.slice(0, 50).forEach(match => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        if (match.type === 'name') {
            div.textContent = `${match.feature.properties.name} (${match.feature.properties.zupanija})`;
            div.addEventListener('click', () => {
                input.value = match.feature.properties.name;
                suggestionsBox.innerHTML = '';
                showFeatureOnMap([match.feature], 'name');
            });
        } else {
            div.textContent = `${match.postcode}`;
            div.addEventListener('click', () => {
                input.value = match.postcode;
                suggestionsBox.innerHTML = '';
                let features = allFeatures.filter(f => f.properties.postcode === match.postcode);
                
                if (match.postcode === 10000) {
                    features = features.filter(f => f.properties.name.toLowerCase() != "grad zagreb");
                }

                showFeatureOnMap(features, 'postcode');
            });
        }
        suggestionsBox.appendChild(div);
    });
}