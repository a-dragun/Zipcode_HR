function showChart(index, feature) {
    chartIds.forEach(id => d3.select(`#${id}`).selectAll("*").remove());
    
    d3.selectAll('.chart').classed('active', false);
    d3.select(`#${chartIds[index]}`).classed('active', true);
    chartFunctions[index](feature);
    prevButton.disabled = index === 0;
    nextButton.disabled = index === chartFunctions.length - 1;
}