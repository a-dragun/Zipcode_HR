function createPopulationPyramid(feature) {
    const chartContainer = d3.select("#pyramid-chart");
    chartContainer.selectAll("*").remove();

    const maleData = feature.properties.population.male;
    const femaleData = feature.properties.population.female;

    const ageGroups = Object.keys(maleData)
        .filter(k => k !== "total")
        .sort((a, b) => {
            const extractAgeValue = str => {
                const match = str.replace(/\s/g, "").match(/^(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            return extractAgeValue(b) - extractAgeValue(a);
        });

    const data = ageGroups.map(age => ({
        age,
        male: -(maleData[age] || 0),
        female: femaleData[age] || 0
    }));

    const width = 700;
    const height = 500;
    const margin = { top: 90, right: 40, bottom: 20, left: 80 };

    const svg = chartContainer.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const y = d3.scaleBand()
        .domain(data.map(d => d.age))
        .range([margin.top, height - margin.bottom])
        .padding(0.1);

    const maxValue = d3.max(data, d => Math.max(Math.abs(d.male), d.female));

    const x = d3.scaleLinear()
        .domain([-maxValue, maxValue])
        .range([margin.left, width - margin.right])
        .nice();

    const colorMale = "#009fe3";
    const colorFemale = "#e5007e";

    const totalPopulation = feature.properties.population.all.total || 1;

    const maleBars = svg.append("g")
        .selectAll("rect.male")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "male")
        .attr("y", d => y(d.age))
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("width", 0)
        .attr("fill", colorMale);

    maleBars.transition()
        .duration(1000)
        .attr("x", d => x(d.male))
        .attr("width", d => x(0) - x(d.male))
        .delay((d, i) => i * 50)
        .ease(d3.easeCubicOut);

    const femaleBars = svg.append("g")
        .selectAll("rect.female")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "female")
        .attr("y", d => y(d.age))
        .attr("height", y.bandwidth())
        .attr("x", x(0))
        .attr("width", 0)
        .attr("fill", colorFemale);

    femaleBars.transition()
        .duration(1000)
        .attr("width", d => x(d.female) - x(0))
        .delay((d, i) => i * 50)
        .ease(d3.easeCubicOut);

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(
            d3.axisLeft(y)
                .tickSize(6)
                .tickPadding(4)
        )
        .selectAll("text")
        .style("font-size", "12px")
        .attr("transform", "translate(-10,0)")
        .attr("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
            d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.abs(d))
        )
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("text")
        .attr("x", x(-maxValue) + 20)
        .attr("y", margin.top - 5)
        .attr("fill", colorMale)
        .style("font-weight", "bold")
        .text("Muškarci");

    svg.append("text")
        .attr("x", x(maxValue) - 60)
        .attr("y", margin.top - 5)
        .attr("fill", colorFemale)
        .style("font-weight", "bold")
        .text("Žene");

    const malePercentages = svg.append("g")
        .selectAll(".male-percentage")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "male-percentage")
        .attr("x", x(0) - 5)
        .attr("y", d => y(d.age) + y.bandwidth() / 2 + 4)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "white")
        .style("opacity", 0)
        .text(d => {
            const percentage = totalPopulation > 0 ? (Math.abs(d.male) / totalPopulation) * 100 : 0;
            return percentage >= 1 ? percentage.toFixed(1) + "%" : "";
        });

    const femalePercentages = svg.append("g")
        .selectAll(".female-percentage")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "female-percentage")
        .attr("x", x(0) + 5)
        .attr("y", d => y(d.age) + y.bandwidth() / 2 + 4)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("fill", "white")
        .style("opacity", 0)
        .text(d => {
            const percentage = totalPopulation > 0 ? (d.female / totalPopulation) * 100 : 0;
            return percentage >= 1 ? percentage.toFixed(1) + "%" : "";
        });

    const tooltip = d3.select("#tooltip");

    function showTooltip(event, d, gender) {
    const absValue = Math.abs(gender === "male" ? d.male : d.female);
    const percentage = totalPopulation > 0 ? (absValue / totalPopulation) * 100 : 0;

    tooltip
        .style("display", "block")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px")
        .html(`
            <strong>Dob:</strong> ${d.age}<br>
            <strong>Spol:</strong> ${gender === "male" ? "Muškarci" : "Žene"}<br>
            <strong>Ukupno:</strong> ${formatNumberWithDots(absValue)}<br>
            <strong>Postotak:</strong> ${percentage.toFixed(2)}%
        `);
}

    function hideTooltip() {
        tooltip.style("display", "none");
    }

    maleBars
        .on("mouseover", (event, d) => showTooltip(event, d, "male"))
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", hideTooltip);

    femaleBars
        .on("mouseover", (event, d) => showTooltip(event, d, "female"))
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", hideTooltip);
}