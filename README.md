# Callum Thornton website

## Publish with GitHub Pages

1. Upload this project to a GitHub repository. The deployment workflow runs on pushes to `main` or `master`.
2. In the repository, open **Settings → Pages** and set the publishing source to **GitHub Actions**.
3. Push to the deployment branch, or manually run the **Deploy GitHub Pages** workflow from the **Actions** tab.

The workflow builds the site into `_site`, generates the Beyond the Lab photo list and Dissemination entries, and deploys it. The site homepage is published as `index.html`.

## Updating Beyond the Lab

- Edit an item's `info.txt` to update its details or `thumbnail`.
- Bouldering and mountaineering entries are displayed newest first using their `date` (for example, `Oct. 2025`). For cars, set `dateBought` and, once sold, `dateSold` as `YYYY-MM` or `YYYY-MM-DD`; cars are ordered by most recent sale date, using purchase date when sale dates tie or are absent.
- Add image files to that item's folder. Prefix filenames with `1_`, `2_`, etc. to control gallery order; the prefix is omitted from captions. The build automatically includes each unique photo, prefers WebP when JPG/WebP copies share a name, and ignores `-thumb`, `-thumbnail`, and `-medium` variants.
- Run `./optimize-images.sh` to convert JPG, JPEG, and PNG photos in the bouldering, mountaineering, and cars folders into three WebP sizes. The script asks before deleting each source image.
- To add an item, create a folder under `files/bouldering/`, `files/mountaineering/`, or `files/cars/` containing an `info.txt` file and at least one image. The site build discovers these folders automatically; no index-file or website-code changes are needed.
- To preview changes locally, run `npm run build`. This regenerates `photos.generated.js` from the image folders and `info.txt` files; opening `index.html` directly will not regenerate it.
- Push the changes to GitHub; the workflow rebuilds and deploys the site automatically.

The `files/_pictures_to_convert/`, `.venv/`, and macOS metadata files are excluded from Git or the published site.

## Updating Dissemination

- Each dissemination item lives in its own folder under `files/dissemination/` and is discovered during the site build when its folder contains an `info.txt` file.
- `info.txt` is JSON. Set the item's `title`, `authors`, `venue`, `type`, `typeLabel`, `year`, `date`, `bibtex`, `image`, and `thumbnail`. Use `conference`, `journal`, `presentation`, or `thesis` for `type`; image and thumbnail values are filenames in the same folder.
- Optional fields include `presentationLabel`, boolean `presentation` and `poster` flags, `summary`, `previewTitle`, `imageAlt`, and `order` (for ordering entries within a year). Add downloadable files to the item folder and list them in `documents` as `{ "label": "Poster", "url": "poster.pdf" }`. External document URLs are also supported.
- To add an item, create its folder, add `info.txt`, and include the named image, thumbnail, and any local documents. Run `npm run build`; the publication card and year filter are generated automatically, with no index-file changes needed.
