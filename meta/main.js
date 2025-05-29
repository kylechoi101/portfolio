import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    
    return data;
  }
function processCommits(data) {
return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;

    // 1) build into a variable
    let ret = {
        id: commit,
        url: 'https://github.com/kylechoi101/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length
    };

    // 2) hide the raw lines array
    Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,    // ← hide in console output
        writable: false,
        configurable: true
    });

    // 3) now return
    return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#profile-stats')
             .append('dl')
             .attr('class', 'stats');

  // — your existing stats —
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // 1) AGGREGATE OVER WHOLE DATASET
  //    → Average depth
  dl.append('dt').text('Average depth');
  dl.append('dd').text(d3.mean(data, d => d.depth).toFixed(2));

  // 2) NUMBER OF DISTINCT VALUES
  //    → Number of authors
  const authorCount = d3.group(data, d => d.author).size;
  dl.append('dt').text('Distinct authors');
  dl.append('dd').text(authorCount);

  // 3) GROUPED AGGREGATES
  //    → Average file length (in lines)
  const fileMaxLines = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  const avgFileLength = d3.mean(fileMaxLines, d => d[1]);
  dl.append('dt').text('Avg. file length');
  dl.append('dd').text(`${avgFileLength.toFixed(1)} lines`);

  const linesByWeekday = d3.rollups(
    commits,
    v => d3.sum(v, c => c.totalLines),
    c => c.datetime.getDay()
  );
  const weekdayNames = [
    'Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday'
  ];
  // d3.greatest returns the [dayIndex, totalLines]
  const busiest = d3.greatest(linesByWeekday, d => d[1]);
  const busiestName = busiest ? weekdayNames[busiest[0]] : '—';

  dl.append('dt').text('Busiest weekday');
  dl.append('dd').text(busiestName);

  // BONUS: time‐of‐day bucket with most work  
  const buckets = ['Morning','Afternoon','Evening','Night'];
  const periodOfDay = d => {
    const h = d.datetime.getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    if (h < 21) return 'Evening';
    return 'Night';
  };
  const workByPeriod = d3.rollups(
    commits,
    v => d3.sum(v, c => c.totalLines),
    c => periodOfDay(c)
  );
  const busiestPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  dl.append('dt').text('Busiest time of day');
  dl.append('dd').text(busiestPeriod);
}
function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  const dots = svg.append('g').attr('class', 'dots');

  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
    
    // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  
  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
  .scaleSqrt() // Change only this line
  .domain([minLines, maxLines])
  .range([10, 20]);
  
  dots
  .selectAll('circle')
  .data(sortedCommits, (d) => d.id)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
  .style('--r', d => rScale(d.totalLines))
  .attr('fill', 'steelblue')
  .style('fill-opacity', 0.7) // Add transparency for overlapping dots
  .on('mouseenter', (event, sortedCommits) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    renderTooltipContent(sortedCommits);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on('mouseleave', (event) => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    updateTooltipVisibility(false);
  });
  const brush = d3.brush()
    // constrain it to your plotting area
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);

  svg.call(brush);

  // now move your circles & axes back on top of the overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}
function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}
function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}
function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}
function brushed(event) {
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function createBrushSelector(svg) {
  svg.call(d3.brush());
  svg.selectAll('.dots, .overlay ~ *').raise();
}
function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}
function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
// right after your initial renderScatterPlot(data, commits);
const timeScale = d3
  .scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);


// 1. Insert slider & <time> into the DOM (or ensure it’s in your HTML)
const sliderEl = document.getElementById('commit-progress');
const timeEl   = document.getElementById('commit-time');

// 2. Handler to update the date display & (later) re-filter

let filteredCommits = commits;
function updateFileDisplay(filteredCommits){
  const lines = filteredCommits.flatMap(d => d.lines);
  const files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a,b) => b.lines.length - a.lines.length);

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // join on a div.file-entry wrapper
// join on a div.file-entry wrapper
  const filesContainer = d3.select('#files')
    .selectAll('div.file-entry')
    .data(files, d => d.name)
    .join(enter => {
      const div = enter.append('div').attr('class','file-entry');
      div.append('dt').append('code');
      div.append('dd').attr('class','dots');
      div.append('dd').attr('class','count');
      return div;
    });


  // update filename
  filesContainer.select('dt code')
    .text(d => d.name);

  filesContainer.select('dd.count')
    .text(d => `${d.lines.length} lines`);

  filesContainer.select('dd.dots')
    .selectAll('div.loc')
    .data(d => d.lines)
    .join('div')
      .attr('class','loc')
      .style('background-color', d => colors(d.type));

}


function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  // CHANGE: we should clear out the existing xAxis and then create a new one.
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('--r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}
function onTimeSliderChange() {
  // 1) figure out slider % → date
  const commitProgress = +sliderEl.value;
  const commitMaxTime  = timeScale.invert(commitProgress);
  timeEl.textContent   = commitMaxTime.toLocaleString();

  // 2) filter
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  // 3) **update** the existing SVG
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits)
}


sliderEl.addEventListener('input', onTimeSliderChange);
onTimeSliderChange();  // kick things off

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

  import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

  // … after you bind commits to .step divs …
  
  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step:      '#scrolly-1 .step'
    })
    .onStepEnter(response => {
      const el = response.element;
  
      // 1) final step: the file‐list
      if (el.id === 'files') {
        // hide the scatterplot
        d3.select('#scatter-plot').style('display', 'none');
        // show & render all files
        d3.select('#files').style('display', null);
        updateFileDisplay(commits);
        return;
      }
  
      // 2) otherwise it’s a commit‐step
      const stepCommit = el.__data__;
      const filtered = commits.filter(d => d.datetime <= stepCommit.datetime);
  
      // update plot + side panel
      updateScatterPlot(data, filtered);
      updateFileDisplay(filtered);
  
      // ensure we’re still showing the chart
      d3.select('#scatter-plot').style('display', null);
      d3.select('#files')       .style('display', 'none');
    });
  // 1) Bind commits to narrative steps in the RIGHT‐hand column of Scrolly 2
d3.select('#files-story')
.selectAll('.step')
.data(commits)
.join('div')
  .attr('class', 'step')
  .html((d, i) => `
    On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })}, I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first glorious commit'
    }</a>, touching ${d.totalLines} lines across ${
      d3.rollups(d.lines, v => v.length, d => d.file).length
    } files.
  `);

// 2) Wire up Scrollama for Scrolly 2
const sc2 = scrollama();
sc2
.setup({
  container: '#scrolly-2',        // the outer wrapper
  step:      '#scrolly-2 .step',  // each of your bound .step divs
})
.onStepEnter(response => {
  const commit = response.element.__data__;
  // keep only commits up to that step
  const filtered = commits.filter(d => d.datetime <= commit.datetime);

  // hide the scatterplot (optional)
  d3.select('#scatter-plot').style('display', 'none');
  // show the file‐type plot container
  d3.select('#files-plot').style('display', null);
  d3.select('#files').style('display', null);


  // render the dots (your existing updater will target the <dl id="files"> here)
  updateFileDisplay(filtered);
});
