import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const categories = {
    bouldering: 'Bouldering',
    mountaineering: 'Mountaineering',
    cars: 'Cars'
};
const outputDirectory = path.join(root, '_site');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const extensionPriority = new Map([
    ['.webp', 0],
    ['.jpg', 1],
    ['.jpeg', 2],
    ['.png', 3]
]);

async function getPhotos(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    const photosByName = new Map();

    for (const entry of entries) {
        if (!entry.isFile()) continue;

        const extension = path.extname(entry.name).toLowerCase();
        const stem = path.basename(entry.name, path.extname(entry.name));
        if (!imageExtensions.has(extension) || /-(?:thumb|thumbnail|medium)$/i.test(stem)) continue;

        const key = stem.toLowerCase();
        const current = photosByName.get(key);
        if (!current || extensionPriority.get(extension) < extensionPriority.get(path.extname(current).toLowerCase())) {
            photosByName.set(key, entry.name);
        }
    }

    return [...photosByName.values()]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(filename => ({
            caption: path.basename(filename, path.extname(filename)).replace(/^\d+_/, '').replace(/_/g, ' '),
            url: path.posix.join(path.relative(root, folder).split(path.sep).join('/'), filename)
        }));
}

async function buildPhotoManifest() {
    const manifest = Object.fromEntries(Object.keys(categories).map(category => [category, []]));
    const itemIds = new Set();

    for (const [category, categoryName] of Object.entries(categories)) {
        const categoryPath = path.join(root, 'files', category);
        const entries = await readdir(categoryPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const folder = path.join(categoryPath, entry.name);
            const infoPath = path.join(folder, 'info.txt');
            const folderEntries = await readdir(folder, { withFileTypes: true });
            if (!folderEntries.some(file => file.isFile() && file.name === 'info.txt')) continue;

            const info = JSON.parse(await readFile(infoPath, 'utf8'));
            const photos = await getPhotos(folder);
            if (!photos.length) continue;

            info.id ||= entry.name;
            info.category ||= categoryName;
            info.thumbnail ||= path.basename(photos[0].url);
            if (itemIds.has(info.id)) {
                throw new Error(`Duplicate item id "${info.id}" in ${infoPath}`);
            }

            const thumbnailName = info.thumbnail;
            if (path.basename(thumbnailName) !== thumbnailName) {
                throw new Error(`Thumbnail must be a filename in its item folder: ${infoPath}`);
            }
            const thumbnailStem = path.basename(thumbnailName, path.extname(thumbnailName)).toLowerCase();
            const thumbnail = photos.find(photo => path.basename(photo.url, path.extname(photo.url)).toLowerCase() === thumbnailStem);
            if (!thumbnail) {
                throw new Error(`Thumbnail is missing from the photo folder: ${infoPath}`);
            }

            info.bannerImg = thumbnail.url;
            info.gallery = photos;
            manifest[category].push(info);
            itemIds.add(info.id);
        }
    }

    return manifest;
}

async function buildDisseminationManifest() {
    const categoryPath = path.join(root, 'files', 'dissemination');
    const entries = await readdir(categoryPath, { withFileTypes: true });
    const items = [];
    const itemIds = new Set();

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const folder = path.join(categoryPath, entry.name);
        const infoPath = path.join(folder, 'info.txt');
        const folderEntries = await readdir(folder, { withFileTypes: true });
        if (!folderEntries.some(file => file.isFile() && file.name === 'info.txt')) continue;

        const info = JSON.parse(await readFile(infoPath, 'utf8'));
        const requiredFields = ['title', 'authors', 'venue', 'type', 'typeLabel', 'year', 'date', 'bibtex', 'image', 'thumbnail'];
        for (const field of requiredFields) {
            if (typeof info[field] !== 'string' && field !== 'year') {
                throw new Error(`Missing or invalid "${field}" in ${infoPath}`);
            }
        }
        if (!Number.isInteger(info.year)) {
            throw new Error(`Missing or invalid "year" in ${infoPath}`);
        }

        info.id ||= entry.name;
        if (typeof info.id !== 'string' || itemIds.has(info.id)) {
            throw new Error(`Missing or duplicate item id "${info.id}" in ${infoPath}`);
        }

        for (const field of ['image', 'thumbnail']) {
            const filename = info[field];
            if (path.basename(filename) !== filename) {
                throw new Error(`"${field}" must be a filename in its item folder: ${infoPath}`);
            }
            if (!folderEntries.some(file => file.isFile() && file.name === filename)) {
                throw new Error(`Missing ${field} file "${filename}" in ${infoPath}`);
            }
            info[field] = path.posix.join(path.relative(root, folder).split(path.sep).join('/'), filename);
        }

        if (!Array.isArray(info.documents ?? [])) {
            throw new Error(`"documents" must be an array in ${infoPath}`);
        }
        info.documents = await Promise.all((info.documents ?? []).map(async document => {
            if (!document || typeof document.label !== 'string' || typeof document.url !== 'string') {
                throw new Error(`Invalid document entry in ${infoPath}`);
            }
            if (/^https?:\/\//i.test(document.url)) return document;
            if (path.basename(document.url) !== document.url) {
                throw new Error(`Local document URLs must be filenames in their item folder: ${infoPath}`);
            }
            if (!folderEntries.some(file => file.isFile() && file.name === document.url)) {
                throw new Error(`Missing document "${document.url}" in ${infoPath}`);
            }
            return {
                ...document,
                url: path.posix.join(path.relative(root, folder).split(path.sep).join('/'), document.url)
            };
        }));

        info.presentation = info.presentation === true;
        info.poster = info.poster === true;
        info.summary = typeof info.summary === 'string' ? info.summary : '';
        info.imageAlt = typeof info.imageAlt === 'string' ? info.imageAlt : info.title;
        info.previewTitle = typeof info.previewTitle === 'string' ? info.previewTitle : info.title;
        items.push(info);
        itemIds.add(info.id);
    }

    return items.sort((first, second) => second.year - first.year
        || (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER)
        || first.title.localeCompare(second.title));
}

try {
    const manifest = await buildPhotoManifest();
    const dissemination = await buildDisseminationManifest();
    const output = `// Generated by build-photos.mjs; do not edit directly.\nwindow.BEYOND_THE_LAB_DATA = ${JSON.stringify(manifest, null, 2)};\nwindow.DISSEMINATION_DATA = ${JSON.stringify(dissemination, null, 2)};\n`;

    await rm(outputDirectory, { recursive: true, force: true });
    await mkdir(outputDirectory, { recursive: true });
    await cp(path.join(root, 'index.html'), path.join(outputDirectory, 'index.html'));

    for (const directory of ['files']) {
        const source = path.join(root, directory);
        await cp(source, path.join(outputDirectory, directory), {
            recursive: true,
            filter: entry => {
                const name = path.basename(entry);
                return name !== '.DS_Store'
                    && !name.startsWith('._')
                    && name !== '_pictures_to_convert'
                    && name !== '__MACOSX';
            }
        });
    }

    await writeFile(path.join(root, 'photos.generated.js'), output, 'utf8');
    await writeFile(path.join(outputDirectory, 'photos.generated.js'), output, 'utf8');
    const itemCount = Object.values(manifest).reduce((total, items) => total + items.length, 0);
    console.log(`Generated photo galleries for ${itemCount} items.`);
    console.log(`Generated dissemination details for ${dissemination.length} items.`);
    console.log(`Built GitHub Pages site in ${path.relative(root, outputDirectory)}.`);
} catch (error) {
    console.error('Could not build the GitHub Pages site:', error);
    process.exitCode = 1;
}
