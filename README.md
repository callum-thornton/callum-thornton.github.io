# Callum Thornton website

## Publish with GitHub Pages

1. Upload this project to a GitHub repository. The deployment workflow runs on pushes to `main` or `master`.
2. In the repository, open **Settings → Pages** and set the publishing source to **GitHub Actions**.
3. Push to the deployment branch, or manually run the **Deploy GitHub Pages** workflow from the **Actions** tab.

The workflow builds the site into `_site`, generates the Beyond the Lab photo list, and deploys it. The site homepage is published as `index.html`.

## Updating Beyond the Lab

- Edit an item's `info.txt` to update its details or `thumbnail`.
- Bouldering and mountaineering entries are displayed newest first using their `date` (for example, `Oct. 2025`). For cars, set `dateBought` and, once sold, `dateSold` as `YYYY-MM` or `YYYY-MM-DD`; cars are ordered by most recent sale date, using purchase date when sale dates tie or are absent.
- Add image files to that item's folder. Prefix filenames with `1_`, `2_`, etc. to control gallery order; the prefix is omitted from captions. The build automatically includes each unique photo, prefers WebP when JPG/WebP copies share a name, and ignores `-thumb`, `-thumbnail`, and `-medium` variants.
- Run `./optimize-images.sh` to convert JPG, JPEG, and PNG photos in the bouldering, mountaineering, and cars folders into three WebP sizes. The script asks before deleting each source image.
- To add an item, create a folder under `images/bouldering/`, `images/mountaineering/`, or `images/cars/` containing an `info.txt` file and at least one image. The site build discovers these folders automatically; no index-file or website-code changes are needed.
- To preview changes locally, run `npm run build`. This regenerates `photos.generated.js` from the image folders and `info.txt` files; opening `index.html` directly will not regenerate it.
- Push the changes to GitHub; the workflow rebuilds and deploys the site automatically.

The `images/_pictures_to_convert/`, `.venv/`, and macOS metadata files are excluded from Git or the published site.
