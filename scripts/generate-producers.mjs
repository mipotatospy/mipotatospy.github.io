import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const csvPath = path.join(rootDirectory, 'data', 'producers.csv');
const jsonPath = path.join(rootDirectory, 'data', 'producers.json');
const htmlPath = path.join(rootDirectory, 'producers', 'index.html');

const expectedHeaders = [
  'id', 'display_name',
  'company_1_name', 'company_1_url',
  'company_2_name', 'company_2_url',
  'company_3_name', 'company_3_url',
  'linkedin_url', 'email',
  'personal_bio', 'company_bio', 'general_bio',
  'image_path', 'image_alt', 'sort_order', 'published', 'instagram_handle'
];

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('The CSV ends inside a quoted field.');
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeImagePath(value) {
  if (!value) return '';
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('/')) return value;
  return `../${value.replace(/^\.\//, '')}`;
}

function normalizeInstagramUrl(value, rowNumber) {
  if (!value) return '';
  if (/^https:\/\/(?:www\.)?instagram\.com\//i.test(value)) return value;

  const handle = value.replace(/^@/, '');
  if (!/^[a-z0-9._]+$/i.test(handle)) {
    throw new Error(`Invalid instagram_handle on CSV row ${rowNumber}: ${value}`);
  }
  return `https://www.instagram.com/${handle}/`;
}

function replaceInitialGrid(html, replacement) {
  const start = html.indexOf('<div class="producer-grid" aria-label="Women producer profiles">');
  if (start === -1) throw new Error('Could not find the existing producer grid.');

  const tagPattern = /<div\b[^>]*>|<\/div>/g;
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tagPattern.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      return `${html.slice(0, start)}${replacement}${html.slice(tagPattern.lastIndex)}`;
    }
  }

  throw new Error('The existing producer grid is not balanced.');
}

const rows = parseCsv(await fs.readFile(csvPath, 'utf8'));
const headers = rows.shift()?.map(value => value.trim()) ?? [];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error(`Unexpected CSV headers. Expected: ${expectedHeaders.join(', ')}`);
}

const records = rows
  .filter(row => row.some(value => value.trim() !== ''))
  .map((row, rowIndex) => {
    if (row.length !== expectedHeaders.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${row.length} columns; expected ${expectedHeaders.length}.`);
    }

    const source = Object.fromEntries(expectedHeaders.map((header, index) => [header, row[index].trim()]));
    if (!source.id || !source.display_name) throw new Error(`CSV row ${rowIndex + 2} requires id and display_name.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id)) throw new Error(`Invalid id on CSV row ${rowIndex + 2}: ${source.id}`);

    const publicationValue = source.published.toLowerCase();
    if (!['', 'true', 'false'].includes(publicationValue)) {
      throw new Error(`published must be blank, true, or false on CSV row ${rowIndex + 2}.`);
    }

    const sortOrder = Number(source.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error(`Invalid sort_order on CSV row ${rowIndex + 2}.`);
    if (source.image_path && !source.image_alt) throw new Error(`image_alt is required when image_path is set on CSV row ${rowIndex + 2}.`);

    const companies = [1, 2, 3].flatMap(number => {
      const name = source[`company_${number}_name`];
      const url = source[`company_${number}_url`];
      if (url && !name) throw new Error(`Company ${number} has a URL but no name on CSV row ${rowIndex + 2}.`);
      if (url && !/^https:\/\//i.test(url)) throw new Error(`Company ${number} URL must begin with https:// on CSV row ${rowIndex + 2}.`);
      return name ? [{ name, url }] : [];
    });

    return {
      id: source.id,
      displayName: source.display_name,
      companies,
      linkedInUrl: source.linkedin_url,
      instagramHandle: source.instagram_handle,
      instagramUrl: normalizeInstagramUrl(source.instagram_handle, rowIndex + 2),
      email: source.email,
      personalBio: source.personal_bio,
      companyBio: source.company_bio,
      generalBio: source.general_bio,
      imagePath: source.image_path,
      imageAlt: source.image_alt,
      sortOrder,
      published: publicationValue !== 'false'
    };
  })
  .sort((first, second) => first.sortOrder - second.sortOrder);

const duplicateIds = records.filter((record, index) => records.findIndex(item => item.id === record.id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate producer id: ${duplicateIds[0].id}`);

const publishedRecords = records.filter(record => record.published);

const cards = publishedRecords.map((record, index) => {
  const image = record.imagePath
    ? `<img class="producer-card__photo" src="${escapeHtml(normalizeImagePath(record.imagePath))}" alt="${escapeHtml(record.imageAlt)}" width="800" height="1000" loading="lazy">`
    : `<div class="producer-photo-placeholder" role="img" aria-label="Portrait forthcoming for ${escapeHtml(record.displayName)}"><span>Portrait forthcoming</span></div>`;
  const companyNames = record.companies.length
    ? record.companies.map(company => escapeHtml(company.name)).join(', ')
    : 'Company details forthcoming';

  return `      <article class="producer-card">
        <button class="producer-card__trigger" type="button" aria-haspopup="dialog" aria-controls="producer-${escapeHtml(record.id)}">
          ${image}
          <span class="producer-card__copy">
            <span class="producer-card__index">${String(index + 1).padStart(2, '0')}</span>
            <span class="producer-card__name">${escapeHtml(record.displayName)}</span>
            <span class="producer-company">${companyNames}</span>
            <span class="producer-card__action">View profile <span aria-hidden="true">↗</span></span>
          </span>
        </button>
      </article>`;
}).join('\n');

const dialogs = publishedRecords.map(record => {
  const companies = record.companies.length
    ? `<div class="producer-modal__companies" aria-label="Companies">
${record.companies.map(company => company.url
  ? `          <a href="${escapeHtml(company.url)}" target="_blank" rel="noopener">${escapeHtml(company.name)} <span aria-hidden="true">↗</span></a>`
  : `          <span>${escapeHtml(company.name)}</span>`).join('\n')}
        </div>`
    : '';
  const biography = record.generalBio ? `<p class="producer-modal__bio">${escapeHtml(record.generalBio)}</p>` : '';
  const socialLinks = [
    /^https:\/\//i.test(record.linkedInUrl)
      ? `<a href="${escapeHtml(record.linkedInUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(record.displayName)} on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.34 3.5A2.34 2.34 0 1 1 .66 3.5a2.34 2.34 0 0 1 4.68 0ZM.95 7h4.78v15H.95V7Zm7.69 0h4.58v2.05h.07c.63-1.21 2.2-2.49 4.52-2.49 4.84 0 5.74 3.19 5.74 7.34V22h-4.77v-7.18c0-1.71-.04-3.92-2.39-3.92-2.39 0-2.76 1.87-2.76 3.79V22H8.64V7Z"/></svg></a>`
      : '',
    record.instagramUrl
      ? `<a href="${escapeHtml(record.instagramUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(record.displayName)} on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg></a>`
      : ''
  ].filter(Boolean).join('\n          ');
  const socials = socialLinks
    ? `<nav class="producer-modal__socials" aria-label="${escapeHtml(record.displayName)} social profiles">
          ${socialLinks}
        </nav>`
    : '';

  return `    <dialog class="producer-modal" id="producer-${escapeHtml(record.id)}" aria-labelledby="producer-${escapeHtml(record.id)}-title">
      <div class="producer-modal__panel">
        <button class="producer-modal__close" type="button" data-producer-close aria-label="Close ${escapeHtml(record.displayName)} profile">×</button>
        <h2 id="producer-${escapeHtml(record.id)}-title">${escapeHtml(record.displayName)}</h2>
        ${companies}
        ${socials}
        ${biography}
      </div>
    </dialog>`;
}).join('\n');

const generatedBlock = `<!-- PRODUCERS:START — generated by scripts/generate-producers.mjs -->
    <div class="producer-grid" aria-label="Women producer profiles">
${cards}
    </div>
    <div class="producer-dialogs">
${dialogs}
    </div>
    <!-- PRODUCERS:END -->`;

let html = await fs.readFile(htmlPath, 'utf8');
const markerPattern = /<!-- PRODUCERS:START[\s\S]*?<!-- PRODUCERS:END -->/;
html = markerPattern.test(html)
  ? html.replace(markerPattern, generatedBlock)
  : replaceInitialGrid(html, generatedBlock);

await fs.writeFile(jsonPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
await fs.writeFile(htmlPath, html, 'utf8');

console.log(`Generated ${publishedRecords.length} producer cards from ${records.length} CSV records.`);
