console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
//   );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'meta/', title: 'Meta' },
    { url: 'https://github.com/kylechoi101', title: 'Github' },
  ];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name
const nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
    let href = p.url;
    
    if (!href.startsWith("http")) {
      href = BASE_PATH + href;
    }
  
    let a = document.createElement('a');
    a.href = href;
    a.textContent = p.title;
    nav.append(a);
    if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
    }
    if(a.textContent.startsWith("Github")){
      a.target = "_blank"
    }
  }
const navLinks = $$("nav a");
const currentLink = navLinks.find(
  (a) =>
    a.host     === location.host &&
    a.pathname === location.pathname
);
currentLink?.classList.add("current");

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select id="theme-switcher">
      <option value="auto">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);

const select = document.getElementById("theme-switcher");

if (localStorage.colorScheme) {
  const stored = localStorage.colorScheme;          // e.g. "light", "dark" or "auto"
  select.value = stored;                            // update the dropdown
  document.documentElement.style.setProperty("color-scheme", stored);
}

// 2) Whenever the user picks a new theme, save + apply immediately
select.addEventListener("input", (event) => {
  const choice = event.target.value;
  // apply it
  document.documentElement.style.setProperty("color-scheme", choice);
  // persist it
  localStorage.colorScheme = choice;
});


// 1. Find any <form> whose action starts with "mailto:"
const contactForm = document.querySelector('form[action^="mailto:"]');

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();                // stop the browser’s default encoding+submit

    // 2. Build a FormData out of the form
    const data = new FormData(contactForm);

    // 3. Turn each [key, value] into a percent‑encoded "key=value"
    const pairs = [];
    for (let [key, val] of data) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }

    // 4. Join with "&" to form the query string
    const query = pairs.join("&");

    // 5. Prepend the mailto: action (which may already include defaults)
    let mailto = contactForm.action;
    // If your action already had "?subject=Hello&body=Sup?", you can still append:
    mailto += (mailto.includes("?") ? "&" : "?") + query;

    // 6. Navigate there – this opens the user’s email client
    location.href = mailto;
  });
}

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response)
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!Array.isArray(projects) || !containerElement) {
    console.error('renderProjects: missing projects array or container');
    return;
  }

  // clear out any old content
  containerElement.innerHTML = '';
  
  // ensure headingLevel is one of h1…h6
  const tag = headingLevel.match(/^h[1-6]$/i) ? headingLevel.toLowerCase() : 'h2';

  for (const project of projects) {
    const cleaned = project.image.replace(/^(\.\.\/)+/, '');
    const article = document.createElement('article');
    const src = cleaned.match(/^https?:\/\//)
      ? cleaned
      : `${BASE_PATH}${cleaned}`;
    
    // build a linked title if project.url exists
    const titleHTML = project.url
      ? `<a href="${project.url}" target="_blank" rel="noopener noreferrer">${project.title || 'Untitled'}</a>`
      : (project.title || 'Untitled');

    article.innerHTML = `
      <${tag}>${titleHTML}</${tag}>
      ${src ? `<img src="${src}" alt="${project.title}">` : ''}
      <div class="project-details">
        <p class="project-description">${project.description || ''}</p>
        <p class="project-year">${project.year || ''}</p>
        ${
          project.url
            ? `<p class="project-link"><a href="${project.url}" target="_blank" rel="noopener noreferrer">View Project ↗</a></p>`
            : ''
        }
      </div>
    `;
    containerElement.appendChild(article);
  }

  // handle the “no projects” case
  if (projects.length === 0) {
    containerElement.textContent = 'No projects to display.';
  }
}


// in global.js
export async function fetchGithubData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

