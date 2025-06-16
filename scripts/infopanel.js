function openInfoPanel(feature) {
    isInfoPanelOpen = true;
    infoPanel.classList.add('open');
    document.getElementById('map').classList.add('shifted');
    const content = d3.select("#info-content");
    content.selectAll("*").remove();

    content.append("div")
        .text(`${feature.properties.name.toUpperCase()} [${feature.properties.postcode}]`)
        .style("text-align", "center")
        .style("font-weight", "bold")
        .style("font-size", "20px")
        .style("margin-bottom", "4px");

    content.append("div")
        .text(`ŽUPANIJA: ${feature.properties.zupanija}`)
        .style("text-align", "center")
        .style("font-size", "14px")
        .style("font-weight", "normal")
        .style("margin-bottom", "50px");

    content.append("div")
        .attr("id", "pop-number")
        .style("text-align", "center")
        .style("font-weight", "bold")
        .style("font-size", "24px")
        .text("0 stanovnika");

    function animateNumber(selection, start, end, duration = 800) {
        selection
            .interrupt()
            .transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .tween("text", function() {
                const that = d3.select(this);
                const i = d3.interpolateNumber(start, end);
                return function(t) {
                    that.text(`${formatNumberWithDots(Math.round(i(t)))} stanovnika`);
                };
            });
    }

    const totalPopulation = feature.properties.population.all.total || 0;
    animateNumber(d3.select("#pop-number"), 0, totalPopulation, 1000);

    currentChartIndex = 0;
    showChart(currentChartIndex, feature);

    const geoJsonLayer = L.geoJSON(feature.geometry ? [feature] : currentFeature);
    const bounds = geoJsonLayer.getBounds();
    map.flyToBounds(bounds.pad(0.3), {
        animate: true,
        duration: 1
    });

    prevButton.onclick = () => {
        if (currentChartIndex > 0) {
            currentChartIndex--;
            showChart(currentChartIndex, feature);
        }
    };

    nextButton.onclick = () => {
        if (currentChartIndex < chartFunctions.length - 1) {
            currentChartIndex++;
            showChart(currentChartIndex, feature);
        }
    };
}

function closeInfoPanel() {
    isInfoPanelOpen = false;
    infoPanel.classList.remove('open');
    document.getElementById('map').classList.remove('shifted');
    map.setView([45.1, 15.5], 7.3, {
        animate: true,
        duration: 0.5
    });
    chartIds.forEach(id => d3.select(`#${id}`).selectAll("*").remove());
}