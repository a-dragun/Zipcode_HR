const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    boxZoom: true,
    touchZoom: true,
    minZoom: 7
}).setView([44.5, 16.5], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
}).addTo(map);

L.svg().addTo(map);
const svg = d3.select(map.getPanes().overlayPane).select("svg");
const g = svg.append("g");

let allFeatures = [];
let currentFeature = null;
let isInfoPanelOpen = false;
let isPostcodeSearch = false;
let currentChartIndex = 0;
const chartFunctions = [
    createDonutChart,
    createBarChart,
    createPopulationPyramid,
    createSpiderChart
];
const chartIds = ['gender-chart', 'bar-chart', 'pyramid-chart', 'spider-chart'];

function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const input = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions');
const loading = document.getElementById('loading');
const infoPanel = document.getElementById('info-panel');
const closeButton = document.getElementById('close-button');
const prevButton = document.getElementById('prev-chart');
const nextButton = document.getElementById('next-chart');
let selectedFeature = null;

function showLoading() { loading.style.display = 'block'; }
function hideLoading() { loading.style.display = 'none'; }

const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", (event) => {
        if (currentFeature) {
            g.attr("transform", event.transform);
        }
    });

function toggleLeafletZoom(enable) {
    if (enable) {
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoom.enable();
        map.boxZoom.enable();
    } else {
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.touchZoom.disable();
        map.boxZoom.disable();
    }
}

showLoading();
fetch('/data/output_f.json')
    .then(res => res.json())
    .then(data => {
        allFeatures = data.features.filter(f => f.geometry && f.properties.name);
        hideLoading();
    })
    .catch(err => {
        alert('Greška prilikom učitavanja podataka.');
        hideLoading();
    });

closeButton.addEventListener('click', closeInfoPanel);

map.on("moveend zoomend", updateFeaturePath);

input.addEventListener('input', () => {
    showSuggestions(input.value);
    if (!input.value && currentFeature) {
        g.selectAll("*").remove();
        currentFeature = null;
        selectedFeature = null;
        toggleLeafletZoom(true);
        svg.on('.zoom', null);
        closeInfoPanel();
    }
});

document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== input) {
        suggestionsBox.innerHTML = '';
    }
});