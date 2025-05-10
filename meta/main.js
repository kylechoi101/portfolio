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
d3.select('#profile-stats')
  .call(
    d3.drag()
      .on('start', function(event) {
        d3.select(this).style('cursor', 'grabbing');
      })
      .on('drag', function(event) {
        // event.x / event.y are relative to the viewport
        d3.select(this)
          .style('left',  event.x + 'px')
          .style('top',   event.y + 'px');
      })
      .on('end', function() {
        d3.select(this).style('cursor', 'grab');
      })
  );
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
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
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
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
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