// Generates public/sitemap.xml from the public site routes and problem statements.
// Runs before `vite build` (see vercel.json buildCommand) so the file is copied into dist/.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://www.innovators-arena-tau.site";

const raw = JSON.parse(readFileSync(join(root, "src/data/problemStatements.json"), "utf8"));
const statements = Array.isArray(raw) ? raw : raw.problemStatements || [];
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${SITE}/`, changefreq: "weekly", priority: "1.0" },
  { loc: `${SITE}/problem-statements`, changefreq: "weekly", priority: "0.9" },
  { loc: `${SITE}/timeline`, changefreq: "weekly", priority: "0.7" },
  ...statements
    .filter((ps) => ps && ps.id)
    .map((ps) => ({
      loc: `${SITE}/problem-statements/${ps.id}`,
      changefreq: "monthly",
      priority: "0.6",
    })),
];

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(root, "public/sitemap.xml"), xml, "utf8");
console.log(`[sitemap] wrote public/sitemap.xml with ${urls.length} URLs`);
