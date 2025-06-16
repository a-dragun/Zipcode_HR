  function createBarChart(feature) {
    const chartContainer = d3.select("#bar-chart");
    chartContainer.selectAll("*").remove();

    const population = feature.properties.population.all;
    const data = [
      { range: "0-4", value: population["0 – 4"] || 0, icon: "/images/age0-4-f.png" },
      { range: "5-14", value: (population["5 – 9"] || 0) + (population["10 – 14"] || 0), icon: "/images/age5-14.png" },
      { range: "15-19", value: population["15 – 19"] || 0, icon: "/images/age15-19.png" },
      { range: "20-24", value: population["20 – 24"] || 0, icon: "/images/age20-24.png" },
      { range: "25-39", value: (population["25 – 29"] || 0) + (population["30 – 34"] || 0) + (population["35 – 39"] || 0), icon: "/images/age25-39.png" },
      { range: "40-59", value: (population["40 – 44"] || 0) + (population["45 – 49"] || 0) + (population["50 – 54"] || 0) + (population["55 – 59"] || 0), icon: "/images/age40-59.png" },
      { range: "60+", value: (population["60 – 64"] || 0) + (population["65 – 69"] || 0) + (population["70 – 74"] || 0) + (population["75 – 79"] || 0) + (population["80 – 84"] || 0) + (population["85 – 89"] || 0) + (population["90 – 94"] || 0) + (population["95+"] || 0), icon: "/images/age60+.png" }
    ];

    const colorScale = d3.scaleOrdinal()
      .domain(data.map(d => d.range))
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2"]);

    const darkenColor = (color) => d3.color(color).darker(0.5).toString();

    const svg = chartContainer.append("svg")
      .attr("width", "100%")
      .attr("height", 600)
      .attr("viewBox", `0 0 600 400`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const width = 600;
    const height = 400;
    const margin = { top: 80, right: 10, bottom: 60, left: 60 };

    const total = d3.sum(data, d => d.value);

    const x = d3.scaleBand()
      .domain(data.map(d => d.range))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)]).nice()
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    const bars = svg.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.range))
      .attr("y", y(0))
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => colorScale(d.range));

    bars.transition()
      .duration(1000)
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .delay((d, i) => i * 200)
      .ease(d3.easeCubicOut);

    const percentages = svg.selectAll(".percentage")
      .data(data)
      .join("text")
      .attr("class", "percentage")
      .attr("x", d => x(d.range) + x.bandwidth() / 2)
      .attr("y", y(0) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "white")
      .style("opacity", 0)
      .text(d => {
        const pct = total > 0 ? (d.value / total) * 100 : 0;
        return pct >= 2 ? pct.toFixed(1) + "%" : "";
      });

    const populationLabels = svg.selectAll(".population-label")
      .data(data)
      .join("text")
      .attr("class", "population-label")
      .attr("x", d => x(d.range) + x.bandwidth() / 2)
      .attr("y", y(0) + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "white")
      .style("opacity", 0)
      .text("stanovnika");

    bars.transition()
      .duration(1000)
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value))
      .delay((d, i) => i * 200)
      .ease(d3.easeCubicOut);

    percentages.transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 200)
      .style("opacity", d => (total > 0 && (d.value / total) * 100 >= 2 ? 1 : 0));

bars.on("mouseover", function (event, d) {
    const i = data.indexOf(d);
    const pct = total > 0 ? (d.value / total) * 100 : 0;
    const barHeight = y(0) - y(d.value);
    const maxFontSize = 12;
    const minFontSize = 6;
    const fontSize = barHeight < 20 ? Math.max(minFontSize, barHeight / 2) : maxFontSize;

    d3.select(this)
        .transition()
        .duration(200)
        .attr("fill", darkenColor(colorScale(d.range)));

    percentages
        .filter((_, idx) => idx === i)
        .interrupt()
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("y", y(0) - 15)
        .style("font-size", fontSize + "px")
        .tween("text", function() {
            const node = this;
            const startValue = 0;
            const endValue = d.value;
            const interpolator = d3.interpolateNumber(startValue, endValue);
            return function(t) {
                node.textContent = formatNumberWithDots(Math.floor(interpolator(t)));
            };
        });

    populationLabels
        .filter((_, idx) => idx === i)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .attr("y", y(0) - 5)
        .style("font-size", fontSize * 0.8 + "px");
})


    .on("mouseout", function (event, d) {
      const i = data.indexOf(d);
      const pct = total > 0 ? (d.value / total) * 100 : 0;
      d3.select(this)
        .transition()
        .duration(200)
        .attr("fill", colorScale(d.range));

      percentages
  .filter((_, idx) => idx === i)
  .transition()
  .duration(200)
  .style("opacity", 0)
  .attr("y", y(0) - 5)
  .style("font-size", "12px")
  .on("end", function () {
    d3.select(this)
      .text(pct >= 2 ? pct.toFixed(1) + "%" : "")
      .transition()
      .duration(300)
      .style("opacity", pct >= 2 ? 1 : 0);
  });

populationLabels
  .filter((_, idx) => idx === i)
  .transition()
  .duration(200)
  .style("opacity", 0)
  .attr("y", y(0) + 15)
  .style("font-size", "10px");

    });

    const images = svg.selectAll(".icon")
      .data(data)
      .join("image")
      .attr("class", "icon")
      .attr("href", d => d.icon)
      .attr("x", d => x(d.range) + x.bandwidth() / 2 - 25)
      .attr("y", y(0))
      .attr("width", 50)
      .attr("height", 50)
      .style("opacity", 0);

    images.transition()
      .duration(500)
      .delay((d, i) => 1000 + i * 200)
      .attr("y", d => y(d.value) - 50)
      .style("opacity", 1);
}