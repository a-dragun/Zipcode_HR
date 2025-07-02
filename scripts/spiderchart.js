function createSpiderChart(feature) {
    const chartContainer = d3.select("#spider-chart");
    chartContainer.selectAll("*").remove();

    if (!feature || !feature.properties || !feature.properties.population) {
        chartContainer.append("div")
            .text("Nema dostupnih podataka za odabrani entitet.")
            .style("color", "red")
            .style("font-size", "16px")
            .style("text-align", "center");
        return;
    }

    const maleData = feature.properties.population.male || {};
    const femaleData = feature.properties.population.female || {};
    const totalPopulation = feature.properties.population.all?.total || 1;

    const ageGroups = Object.keys(maleData)
        .filter(k => k !== "total")
        .sort((a, b) => {
            const parseAge = str => {
                if (str.includes("+")) return parseInt(str);
                const match = str.match(/^(\d+)[^\d]?/);
                return match ? parseInt(match[1]) : 0;
            };
            return parseAge(a) - parseAge(b);
        });

    const data = [
        {
            name: "Muškarci",
            color: "#009fe3",
            gender: "male",
            values: ageGroups.map(age => ({
                axis: age,
                value: totalPopulation > 0 ? (maleData[age] || 0) / totalPopulation * 100 : 0,
                count: maleData[age] || 0
            }))
        },
        {
            name: "Žene",
            color: "#e5007e",
            gender: "female",
            values: ageGroups.map(age => ({
                axis: age,
                value: totalPopulation > 0 ? (femaleData[age] || 0) / totalPopulation * 100 : 0,
                count: femaleData[age] || 0
            }))
        }
    ];

    const width = 600;
    const height = 500;
    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left);

    const svg = chartContainer.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2 -10)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#ffffff")
    .text("Udio muškaraca i žena u različitim starosnim skupinama");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const maxValue = d3.max(data, d => d3.max(d.values, v => v.value)) || 100;
    const angleSlice = Math.PI * 2 / ageGroups.length;

    const rScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([0, radius]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);

    const levels = 6;
    g.selectAll(".levels")
        .data(d3.range(1, levels + 1).map(d => d * maxValue / levels))
        .enter()
        .append("circle")
        .attr("r", d => rScale(d))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1);

    g.selectAll(".axis")
        .data(ageGroups)
        .enter()
        .append("g")
        .attr("class", "axis")
        .each(function(d, i) {
            const angle = i * angleSlice;
            d3.select(this)
                .append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", rScale(maxValue) * Math.cos(angle - Math.PI / 2))
                .attr("y2", rScale(maxValue) * Math.sin(angle - Math.PI / 2))
                .attr("stroke", "#ccc")
                .attr("stroke-width", 1);
        });

    g.selectAll(".axis-label")
        .data(ageGroups)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", (d, i) => {
            const angle = i * angleSlice;
            return angle < Math.PI ? "start" : "end";
        })
        .attr("x", (d, i) => rScale(maxValue * 1.1) * Math.cos(i * angleSlice - Math.PI / 2))
        .attr("y", (d, i) => rScale(maxValue * 1.1) * Math.sin(i * angleSlice - Math.PI / 2) + 5)
        .text(d => d)
        .style("font-size", "14px")
        .style("fill", "#ffffff")
        .style("font-weight", "bold")
        .style("text-shadow", "0 0 3px rgba(0,0,0,0.5)");

    const tooltip = d3.select("#tooltip");
    function format(x) {
        return x.toLocaleString("sr-RS");
    }

    function showTooltip(event, gender, age, count, percent) {
        tooltip
            .style("display", "block")
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 32) + "px")
            .html(`
                <strong>Spol:</strong> ${gender}<br/>
                <strong>Dob:</strong> ${age}<br/>
                <strong>Broj:</strong> ${format(count)}<br/>`);
    }

    function moveTooltip(event) {
        tooltip
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 32) + "px");
    }

    function hideTooltip() {
        tooltip.style("display", "none");
    }

    data.forEach((d, i) => {
        const path = g.append("path")
            .datum(d)
            .attr("class", "radar-outline")
            .attr("d", radarLine(d.values))
            .attr("fill", "none")
            .attr("stroke", d.color)
            .attr("stroke-width", 2);

        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);

        g.append("path")
            .datum(d)
            .attr("class", "radar-fill")
            .attr("d", radarLine(d.values))
            .attr("fill", d.color)
            .attr("fill-opacity", 0)
            .transition()
            .delay(1500)
            .duration(500)
            .attr("fill-opacity", 0.3);
    });

    data.forEach(group => {
        g.selectAll(`.dot-${group.gender}`)
            .data(group.values)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 3)
            .attr("fill", "#fff")
            .attr("stroke", group.color)
            .attr("stroke-width", 2)
            .attr("cx", (d, i) => rScale(d.value) * Math.cos(i * angleSlice - Math.PI / 2))
            .attr("cy", (d, i) => rScale(d.value) * Math.sin(i * angleSlice - Math.PI / 2))
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                showTooltip(event, group.name, d.axis, d.count, d.value);
                d3.select(this).transition().duration(100).attr("r", 4);
            })
            .on("mousemove", moveTooltip)
            .on("mouseout", function() {
                hideTooltip();
                d3.select(this).transition().duration(100).attr("r", 3);
            });
    });
}
