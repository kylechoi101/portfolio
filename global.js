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
    { url: 'reume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'github/', title: 'Github' },
  ];

const BASE_PATH =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";
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