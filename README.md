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