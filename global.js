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
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
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
  
    // inject the anchor
    nav.insertAdjacentHTML(
      "beforeend",
      `<a href="${href}">${p.title}</a>`
    );
  }
const navLinks = $$("nav a");
const currentLink = navLinks.find(
  (a) =>
    a.host     === location.host &&
    a.pathname === location.pathname
);
currentLink?.classList.add("current");