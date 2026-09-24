# GymMotion 3D — GitHub Pages starter

## Upload
Replace the contents of your GitHub Pages repository with:
- index.html
- styles.css
- app.js
- assets/

No build step is required.

## Optional realistic character
Put a **properly licensed rigged human GLB/GLTF** at:
`assets/character.glb`

The current starter intentionally uses a procedural humanoid fallback. A true realistic character needs a rigged 3D asset; code alone cannot manufacture realistic human anatomy, skin, clothing and high-quality motion-capture data.

For a production version, the next step is to map exercise animation data to the character's actual bones (hips, spine, upper/lower arms, thighs, shins, feet), then add IK, collision constraints, spring/secondary motion and validated exercise-specific motion clips.

## Free/ownership notes
GitHub Pages can host this static app for free under your GitHub account. The app itself does not require a paid backend. The starter stores progress in localStorage, so data stays in the visitor's browser.

The Three.js modules are loaded from jsDelivr in this starter. If you want zero external runtime dependencies, download the Three.js modules into your repository and change the import paths to local files.
