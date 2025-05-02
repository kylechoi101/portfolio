import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects          = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleEl           = document.querySelector('.projects-title');
const searchInput       = document.querySelector('.searchbar');



// → track both a selected year *and* the free-text query
let selectedYear = null;
let query        = '';

const uniqueYears = [...new Set(projects.map(p => p.year))];
const colors      = d3.scaleOrdinal(d3.schemeTableau10).domain(uniqueYears);

// central filtering function
function applyFilters() {
  let filtered = projects;

  // 1) year filter
  if (selectedYear) {
    filtered = filtered.filter(p => p.year === selectedYear);
  }

  // 2) text filter
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p =>
      Object.values(p).join(' ').toLowerCase().includes(q)
    );
  }

  renderProjects(filtered, projectsContainer, 'h2');
  if (titleEl) titleEl.textContent = `${filtered.length} Projects`;
}

// draws the pie + legend (but never tromps your “which slice is dark”)
function renderPieChart(projectsGiven) {
  const svg    = d3.select('svg');
  const legend = d3.select('.legend');
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // compute counts by year
  const rolled = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );
  const data = rolled.map(([year, cnt]) => ({ label: year, value: cnt }));

  const pie    = d3.pie().value(d => d.value).sort(null);
  const arcs   = pie(data);
  const arcGen = d3.arc().innerRadius(0).outerRadius(50);

  // …and the slices
  svg.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
      .attr('d', arcGen)
      .attr('fill', d =>
        d.data.label === selectedYear
          ? 'oklch(60% 45% 0)'
          : colors(d.data.label)
      )
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        // toggle
        selectedYear = (selectedYear === d.data.label ? null : d.data.label);
        applyFilters();

        // restyle slices & legend
        svg.selectAll('path')
          .attr('fill', d2 =>
            d2.data.label === selectedYear
              ? 'oklch(60% 45% 0)'
              : colors(d2.data.label)
          );
        legend.selectAll('li')
          .attr('class', d2 => (d2.label === selectedYear ? 'selected' : ''));
      });

  // …and the legend
  legend.selectAll('li')
    .data(data)
    .enter()
    .append('li')
      .attr('style', d => `--color:${colors(d.label)}`)
      .attr('class', d => (d.label === selectedYear ? 'selected' : ''))
      .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', (event, d) => {
        selectedYear = (selectedYear === d.label ? null : d.label);
        applyFilters();

        svg.selectAll('path')
          .attr('fill', d2 =>
            d2.data.label === selectedYear
              ? 'oklch(60% 45% 0)'
              : colors(d2.data.label)
          );
        legend.selectAll('li')
          .attr('class', d2 => (d2.label === selectedYear ? 'selected' : ''));
      });
}

// wire up typing → just re-filter the list (pie stays put)
searchInput.addEventListener('input', (e) => {
  query = e.target.value;
  applyFilters();
});

// initial draw
applyFilters();
renderPieChart(projects);
