import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleEl = document.querySelector('.projects-title');
if (titleEl) {
  titleEl.textContent = `${projects.length} Projects`;
}
let selectedIndex = -1;
function renderPieChart(projectsGiven) {
  // Clear old chart + legend
  d3.select('svg').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

  // 1. Roll up data by year
  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  // 2. Pie + Arc generation
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(data);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // 3. Append arcs to <svg>
  const svg = d3.select('svg');


  arcData.forEach((d, idx) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', idx === selectedIndex ? 'gold' : colors(idx))
      .style('cursor', 'pointer')
      .on('click', function () {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        // Update all paths' color based on selection
        svg.selectAll('path')
          .attr('fill', (d2, i) => i === selectedIndex ? 'oklch(60% 45% 0)' : colors(i));

        // Optional: re-render projects list
        const filtered = selectedIndex === -1
          ? projects
          : projects.filter(p => p.year === data[selectedIndex].label);

        renderProjects(filtered, projectsContainer, 'h2');
      });
  });


  // 4. Render legend
  const legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;
  
        // Recolor all paths
        svg.selectAll('path')
          .attr('fill', (d2, i) => i === selectedIndex ? 'oklch(60% 45% 0)' : colors(i));
  
        // Re-highlight legend
        
  
        // Filter and re-render projects
        const filtered = selectedIndex === -1
          ? projects
          : projects.filter(p => p.year === data[selectedIndex].label);
  
        renderProjects(filtered, projectsContainer, 'h2');
      });
  });
  
  
}



let query = '';

let searchInput = document.querySelector('.searchBar');
function applyFilters() {
  const filtered = projects
    .filter(p => selectedIndex === -1 || p.year === data[selectedIndex].label)
    .filter(p => {
      const values = Object.values(p).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
    });

  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
}

searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects
  let filteredProjects = query    
  ? projects.filter((project) =>{
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query)
    })
  : projects; // show all if input is empty
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);


