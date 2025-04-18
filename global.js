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

const switcher = document.getElementById("theme-switcher");
function applyTheme(choice) {
  document.documentElement.style.colorScheme =
    choice === "auto" ? "light dark" : choice;
}

switcher.addEventListener("change", (e) => {
  const choice = e.target.value;
  applyTheme(choice);
  localStorage.setItem("theme", choice);
});

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme") || "auto";
  switcher.value = saved;
  applyTheme(saved);
});

window.addEventListener("storage", (e) => {
  if (e.key === "theme") {
    applyTheme(e.newValue);
    switcher.value = e.newValue;
  }
});

