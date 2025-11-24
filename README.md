# WebVR Cube Project

This project is a simple WebVR application that displays a rotating cube. Users can interact with the cube to rotate it using VR controls.

## Project Structure

```
webvr-cube
├── index.html          # Main HTML document for the WebVR environment
├── package.json        # npm configuration file with dependencies
├── .gitignore          # Files and directories to ignore by Git
├── src
│   ├── js
│   │   ├── app.js      # Initializes the WebVR scene and rendering loop
│   │   └── controls.js  # Logic for user controls to rotate the cube
│   └── css
│       └── styles.css   # Styles for the application
└── README.md           # Documentation for the project
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd webvr-cube
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Open `index.html` in a WebVR-compatible browser.

## Usage

- Once the application is running, you will see a cube rendered in the VR environment.
- Use your VR controllers to interact with the cube and rotate it.

## Notes

- Ensure you have a WebVR-compatible device and browser to fully experience the application.
- This project is a basic implementation and can be expanded with additional features and enhancements.

## Deploying (GitHub Pages)

A GitHub Actions workflow has been added to automatically publish this repository to GitHub Pages.

Key points:

- Workflow path: `.github/workflows/gh-pages.yml`
- Triggers: pushes to `main` or `master`, and manual runs via **Actions -> Run workflow** (workflow_dispatch).
- What it does: checks out the repo, configures Pages, uploads the repository root as the Pages artifact, and deploys it.

Notes and tips:

- If your site requires a build step (for example a `dist/` or `build/` folder), change the `path` in the workflow's `upload-pages-artifact` step to that folder (for example `path: './build'`).
- For a user/organization site (username.github.io) the site will be published to the repository's Pages location automatically. For a project site, GitHub Pages will publish under `https://<username>.github.io/<repo>/`.
- To use a custom domain, add a `CNAME` file at the repository root (or configure it in the Pages settings). The workflow will publish the `CNAME` file as part of the artifact.

To deploy now: push this branch to `main` or `master` (whichever you use). The workflow will run and publish the site. You can also run the workflow manually from the Actions tab in GitHub.
