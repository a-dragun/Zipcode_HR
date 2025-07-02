function createDonutChart(feature) {
    const chartContainer = d3.select("#gender-chart");
    chartContainer.selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.5;

    const male = feature.properties.population.male.total;
    const female = feature.properties.population.female.total;
    const total = male + female;

    const data = [
        { label: "Žene", value: female, color: "#e5007e", gender: "female" },
        { label: "Muškarci", value: male, color: "#009fe3", gender: "male" }
    ];

    let isAnimating = true;

    const svg = chartContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("margin", "auto")
        .style("display", "block");
        
      svg.append("text")
    .attr("x", width / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#ffffff")
    .text("Udio muškaraca i žena u ukupnom stanovništvu");

    const group = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value)
        .startAngle(-Math.PI / 4)
        .endAngle(Math.PI * 2);

    group.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("fill", d => d.data.color)
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .attr("fill-opacity", 0)
        .each(function(d, i, nodes) {
            d3.select(this)
                .transition()
                .duration(1500)
                .ease(d3.easeCubicInOut)
                .attrTween("d", function() {
                    const interpolate = d3.interpolate(
                        { startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 },
                        d
                    );
                    return function(t) {
                        return arc(interpolate(t));
                    };
                })
                .attr("fill-opacity", 1)
                .on("end", function() {
                    if (i === nodes.length - 1) {
                        isAnimating = false;
                    }
                });
        });

    const femaleImg = group.append("image")
        .attr("href", "/images/female.png")
        .attr("class", "female-icon")
        .attr("x", -70)
        .attr("y", -45)
        .attr("width", 90)
        .attr("height", 90)
        .style("opacity", 1);

    const maleImg = group.append("image")
        .attr("href", "/images/male.png")
        .attr("class", "male-icon")
        .attr("x", -20)
        .attr("y", -45)
        .attr("width", 90)
        .attr("height", 90)
        .style("opacity", 1);

    const centerText = group.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .style("opacity", 0)
        .style("fill", "#fff");

    const centerLabel = group.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("y", 60)
        .style("opacity", 0)
        .style("fill", "#fff");

    function animateNumber(selection, start, end, duration = 400) {
        selection
            .interrupt()
            .transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .tween("text", function() {
                const that = d3.select(this);
                const i = d3.interpolateNumber(start, end);
                return function(t) {
                    that.text(formatNumberWithDots(Math.round(i(t))));
                };
            });
    }

    group.selectAll("path")
        .on("mouseover", function (event, d) {
            if (isAnimating) return;

            const isMale = d.data.gender === "male";

            d3.select(this)
                .transition()
                .duration(300)
                .ease(d3.easeCubicInOut)
                .attr("transform", () => {
                    const midAngle = (d.startAngle + d.endAngle) / 2;
                    const x = Math.cos(midAngle - Math.PI / 2) * 10;
                    const y = Math.sin(midAngle - Math.PI / 2) * 10;
                    return `translate(${x}, ${y})`;
                });

            if (isMale) {
                femaleImg.interrupt()
                    .transition()
                    .duration(300)
                    .ease(d3.easeCubicInOut)
                    .delay(50)
                    .style("opacity", 0);

                maleImg.interrupt()
                    .transition()
                    .duration(400)
                    .ease(d3.easeCubicInOut)
                    .attr("x", -50)
                    .attr("y", -60)
                    .attr("width", 90)
                    .attr("height", 90)
                    .style("opacity", 1);

                centerText
                    .interrupt()
                    .attr("x", -5)
                    .attr("y", 40)
                    .style("opacity", 1);

                centerLabel
                    .text(isMale ? "muškaraca" : "žena")
                    .attr("x", -5)
                    .attr("y", 52)
                    .interrupt()
                    .style("opacity", 1);

                animateNumber(centerText, 0, male, 600);
            } else {
                maleImg.interrupt()
                    .transition()
                    .duration(300)
                    .ease(d3.easeCubicInOut)
                    .delay(50)
                    .style("opacity", 0);

                femaleImg.interrupt()
                    .transition()
                    .duration(400)
                    .ease(d3.easeCubicInOut)
                    .attr("x", -40)
                    .attr("y", -65)
                    .attr("width", 90)
                    .attr("height", 90)
                    .style("opacity", 1);

                centerText
                    .interrupt()
                    .attr("x", 5)
                    .attr("y", 35)
                    .style("opacity", 1);

                centerLabel
                    .interrupt()
                    .text(isMale ? "muškaraca" : "žena")
                    .attr("x", 5)
                    .attr("y", 47)
                    .interrupt()
                    .style("opacity", 1);

                animateNumber(centerText, 0, female, 600);
            }
        })
        .on("mouseout", function () {
            if (isAnimating) return;

            d3.select(this)
                .transition()
                .duration(300)
                .ease(d3.easeCubicInOut)
                .attr("transform", "translate(0,0)");

            maleImg.interrupt()
                .transition()
                .duration(400)
                .ease(d3.easeCubicInOut)
                .attr("x", -20)
                .attr("y", -45)
                .attr("width", 90)
                .attr("height", 90)
                .style("opacity", 1);

            femaleImg.interrupt()
                .transition()
                .duration(400)
                .ease(d3.easeCubicInOut)
                .attr("x", -70)
                .attr("y", -45)
                .attr("width", 90)
                .attr("height", 90)
                .style("opacity", 1);

            centerText.interrupt()
                .transition()
                .duration(300)
                .ease(d3.easeCubicInOut)
                .style("opacity", 0);

            centerLabel.interrupt()
                .transition()
                .duration(300)
                .ease(d3.easeCubicInOut)
                .style("opacity", 0);
        });

    function angleToCoord(angle, r) {
        return [Math.cos(angle - Math.PI / 2) * r, Math.sin(angle - Math.PI / 2) * r];
    }

    svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("polyline")
        .data(pie(data))
        .enter()
        .append("polyline")
        .attr("class", "label-line")
        .attr("stroke", d => d.data.color)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("points", d => {
            const posA = angleToCoord(d.startAngle, radius);
            const posB = [posA[0] * 1.2, posA[1] * 1.2];
            const textLength = d.data.label === "Muškarci" ? 120 : 90;
            const horizontalStart = posB[0];
            const horizontalEnd = posB[0] + (posB[0] > 0 ? textLength : -textLength);
            return [posA, posB, [horizontalStart, posB[1]], [horizontalEnd, posB[1]]];
        });

    svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("text")
        .data(pie(data))
        .enter()
        .append("text")
        .attr("class", "label-text")
        .text(d => `${d.data.label}: ${((d.data.value / total) * 100).toFixed(1)}%`)
        .attr("transform", d => {
            const posA = angleToCoord(d.startAngle, radius);
            const posB = [posA[0] * 1.2 + (posA[0] > 0 ? 5 : -5), posA[1] * 1.2 - 6];
            return `translate(${posB})`;
        })
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", d => d.data.color)
        .style("text-anchor", d => {
            const x = angleToCoord(d.startAngle, radius)[0];
            return x > 0 ? "start" : "end";
        });
}