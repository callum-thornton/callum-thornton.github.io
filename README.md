# Callum Thornton website

## Publish with GitHub Pages

1. Upload this project to a GitHub repository. The deployment workflow runs on pushes to `main` or `master`.
2. In the repository, open **Settings → Pages** and set the publishing source to **GitHub Actions**.
3. Push to the deployment branch, or manually run the **Deploy GitHub Pages** workflow from the **Actions** tab.

The workflow builds the site into `_site`, generates the Beyond the Lab photo list, and deploys it. The site homepage is published as `index.html`.

## Updating Beyond the Lab

- Edit an item's `info.txt` to update its details or `thumbnail`.
- Add image files to that item's folder. The build automatically includes each unique photo, prefers WebP when JPG/WebP copies share a name, and ignores `-thumb`, `-thumbnail`, and `-medium` variants.
- When adding a new item, add its `info.txt` path to the category's `images/<category>/index.txt`.
- Push the changes to GitHub; the workflow rebuilds and deploys the site automatically.

The `images/_pictures_to_convert/`, `.venv/`, and macOS metadata files are excluded from Git or the published site.
