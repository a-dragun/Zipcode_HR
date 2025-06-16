function showFeatureOnMap(features, searchType = 'name') {
    console.log('showFeatureOnMap called with', features.length, 'features, searchType:', searchType);
    isPostcodeSearch = searchType === 'postcode';
    g.selectAll("*").remove();
    currentFeature = features;

    let displayFeatures = features;
    if (isPostcodeSearch && selectedFeature) {
        displayFeatures = [selectedFeature];
    }

    let displayFeature;
    if (displayFeatures.length > 1) {
        let combinedGeometry = displayFeatures[0];
        for (let i = 1; i < displayFeatures.length; i++) {
            try {
                combinedGeometry = turf.union(combinedGeometry, displayFeatures[i]);
            } catch (e) {
                console.error('Greška pri spajanju geometrija:', e);
            }
        }
        displayFeature = combinedGeometry;
    } else {
        displayFeature = displayFeatures[0];
    }

    const geoJsonLayer = L.geoJSON(displayFeature);
    const bounds = geoJsonLayer.getBounds();
    map.fitBounds(bounds.pad(0.5));

    setTimeout(() => {
        const maxZoom = 12;
        if (map.getZoom() > maxZoom) {
            map.setZoom(maxZoom);
        }
    }, 300);

    toggleLeafletZoom(false);
    svg.call(zoom);

    const transform = d3.geoTransform({
        point: function(x, y) {
            const point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }
    });
    const path = d3.geoPath().projection(transform);

    g.selectAll("path.feature-path")
        .data(displayFeatures)
        .enter().append("path")
        .attr("class", "feature-path")
        .attr("d", path)
        .attr("fill", d => d === selectedFeature ? "#ff6200" : "#1e90ff")
        .attr("stroke", "#1e90ff")
        .attr("fill-opacity", 0.4)
        .attr("stroke-width", 2)
        .style("pointer-events", "auto")
        .on("mouseover", function () {
            d3.select(this).attr("fill-opacity", 0.7).attr("stroke-width", 3);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill-opacity", 0.4).attr("stroke-width", 2);
        })
        .on("click", function (event, d) {
            if (!isInfoPanelOpen) {
                const aggregatedFeature = aggregateFeatures(displayFeatures);
                openInfoPanel(aggregatedFeature);
            }
        });

    features.forEach(feature => {
        if (feature.properties && feature.properties.location_dot && feature.properties.location_dot.coordinates) {
            const [lon, lat] = feature.properties.location_dot.coordinates;
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));

            g.append("image")
                .attr("class", "location-dot")
                .attr("href", "https://cdn-icons-png.flaticon.com/512/684/684908.png")
                .attr("x", point.x - 15)
                .attr("y", point.y - 30)
                .attr("width", 30)
                .attr("height", 30)
                .style("pointer-events", "all")
                .on("mouseover", function (event) {
                    d3.select(this).style("cursor", "pointer");
                    const tooltip = d3.select("#tooltip");
                    tooltip.style("display", "block")
                        .html(`Naselje: ${feature.properties.name}<br>Županija: ${feature.properties.zupanija}<br>Poštanski broj: ${feature.properties.postcode}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mousemove", function (event) {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select("#tooltip").style("display", "none");
                })
                .on("click", function (event) {
                    console.log('Location dot clicked for:', feature.properties.name, 'isPostcodeSearch:', isPostcodeSearch);
                    event.stopPropagation();
                    if (isPostcodeSearch) {
                        if (selectedFeature === feature) {
                            selectedFeature = null;
                            input.value = feature.properties.postcode;
                            suggestionsBox.innerHTML = '';
                            const postcodeFeatures = allFeatures.filter(f => f.properties.postcode === feature.properties.postcode && f.properties.name.toLowerCase() != "grad zagreb");
                            showFeatureOnMap(postcodeFeatures, 'postcode');
                        } else {
                            selectedFeature = feature;
                            input.value = feature.properties.name;
                            suggestionsBox.innerHTML = '';
                            showFeatureOnMap([feature], 'postcode');
                            openInfoPanel(feature);
                        }
                    } else if (!isInfoPanelOpen) {
                        openInfoPanel(feature);
                    }
                });
        } else {
            console.warn('Missing location_dot or coordinates for feature:', feature);
        }
    });

    const aggregatedFeature = aggregateFeatures(displayFeatures);
    openInfoPanel(aggregatedFeature);

    svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity.scale(1))
        .on("end", () => {
            toggleLeafletZoom(true);
            svg.on('.zoom', null);
        });
}


function aggregateFeatures(features) {
    if (features.length === 1) return features[0];

    const aggregated = {
        properties: {
            name: `Naselja s poštanskim brojem`,
            postcode: features[0].properties.postcode,
            zupanija: [...new Set(features.map(f => f.properties.zupanija))].join(", "),
            population: {
                all: { total: 0 },
                male: { total: 0 },
                female: { total: 0 }
            }
        }
    };

    features.forEach(f => {
        const allPop = f.properties.population.all;
        const malePop = f.properties.population.male;
        const femalePop = f.properties.population.female;

        aggregated.properties.population.all.total += allPop.total || 0;
        aggregated.properties.population.male.total += malePop.total || 0;
        Object.keys(malePop).forEach(age => {
            if (age !== "total") {
                aggregated.properties.population.male[age] = (aggregated.properties.population.male[age] || 0) + (malePop[age] || 0);
            }
        });
        aggregated.properties.population.female.total += femalePop.total || 0;
        Object.keys(femalePop).forEach(age => {
            if (age !== "total") {
                aggregated.properties.population.female[age] = (aggregated.properties.population.female[age] || 0) + (femalePop[age] || 0);
            }
        });
        Object.keys(allPop).forEach(age => {
            if (age !== "total") {
                aggregated.properties.population.all[age] = (aggregated.properties.population.all[age] || 0) + (allPop[age] || 0);
            }
        });
    });

    return aggregated;
}

function updateFeaturePath() {
    if (!currentFeature) return;
    const transform = d3.geoTransform({
        point: function(x, y) {
            const point = map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }
    });
    const path = d3.geoPath().projection(transform);

    let displayFeatures = Array.isArray(currentFeature) ? currentFeature : [currentFeature];
    if (isPostcodeSearch && selectedFeature) {
        displayFeatures = [selectedFeature];
    }

    g.selectAll("path.feature-path").remove();
    g.selectAll("path.feature-path")
        .data(displayFeatures)
        .enter().append("path")
        .attr("class", "feature-path")
        .attr("d", path)
        .attr("fill", d => d === selectedFeature ? "#ff6200" : "#1e90ff")
        .attr("stroke", "#1e90ff")
        .attr("fill-opacity", 0.4)
        .attr("stroke-width", 2)
        .style("pointer-events", "auto")
        .on("click", function (event, d) {
            if (!isInfoPanelOpen) {
                const aggregatedFeature = aggregateFeatures(displayFeatures);
                openInfoPanel(aggregatedFeature);
            }
        });

    g.selectAll("image.location-dot").remove();
    currentFeature.forEach(feature => {
        if (feature.properties && feature.properties.location_dot && feature.properties.location_dot.coordinates) {
            const [lon, lat] = feature.properties.location_dot.coordinates;
            const point = map.latLngToLayerPoint(new L.LatLng(lat, lon));
            g.append("image")
                .attr("class", "location-dot")
                .attr("href", "https://cdn-icons-png.flaticon.com/512/684/684908.png")
                .attr("x", point.x - 15)
                .attr("y", point.y - 30)
                .attr("width", 30)
                .attr("height", 30)
                .style("pointer-events", "all")
                .on("mouseover", function (event) {
                    d3.select(this).style("cursor", "pointer");
                    const tooltip = d3.select("#tooltip");
                    tooltip.style("display", "block")
                        .html(`Naselje: ${feature.properties.name}<br>Županija: ${feature.properties.zupanija}<br>Poštanski broj: ${feature.properties.postcode}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mousemove", function (event) {
                    d3.select("#tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select("#tooltip").style("display", "none");
                })
                .on("click", function (event) {
                    console.log('Location dot clicked for (updateFeaturePath):', feature.properties.name, 'isPostcodeSearch:', isPostcodeSearch);
                    event.stopPropagation();
                    if (isPostcodeSearch) {
                        if (selectedFeature === feature) {
                            selectedFeature = null;
                            input.value = feature.properties.postcode;
                            suggestionsBox.innerHTML = '';
                            const postcodeFeatures = allFeatures.filter(f => f.properties.postcode === feature.properties.postcode && f.properties.name.toLowerCase() != "grad zagreb");
                            showFeatureOnMap(postcodeFeatures, 'postcode');
                        } else {
                            selectedFeature = feature;
                            input.value = feature.properties.name;
                            suggestionsBox.innerHTML = '';
                            showFeatureOnMap([feature], 'postcode');
                            openInfoPanel(feature);
                        }
                    } else if (!isInfoPanelOpen) {
                        openInfoPanel(feature);
                    }
                });
        } else {
            console.warn('Missing location_dot or coordinates for feature:', feature);
        }
    });
}