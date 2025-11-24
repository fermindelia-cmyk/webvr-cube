const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Use existing canvas to make CSS sizing predictable
const canvas = document.getElementById('vr-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
let orbitControls = null; // Three.js OrbitControls instance (if available)
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

let vrEnabled = false;

// Controller reference for VR interaction
let controller1 = null;

function init() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.add(cube);
    camera.position.z = 5;

    // If OrbitControls is available (loaded from examples), create it
    try {
        if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls === 'function') {
            orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            orbitControls.dampingFactor = 0.08;
            orbitControls.enablePan = true;
            orbitControls.enableZoom = true;
            // Limit polar / azimuth if you want:
            // orbitControls.maxPolarAngle = Math.PI; // default
        }
    } catch (err) {
        // If controls not available, silently continue — fallback controls still work
        console.warn('OrbitControls not available:', err.message || err);
    }

    window.addEventListener('resize', onWindowResize, false);
    // Enable WebXR support if available
    if ('xr' in navigator) {
        renderer.xr.enabled = true;
    }

    // Create a basic controller for grabbing/attaching the cube in VR
    try {
        controller1 = renderer.xr.getController(0);
        controller1.addEventListener('selectstart', onSelectStart);
        controller1.addEventListener('selectend', onSelectEnd);
        scene.add(controller1);
    } catch (e) {
        // Not all environments provide XR controllers — ignore safely
        console.warn('Controller setup failed:', e && e.message);
    }

    // Wire up VR button if present in the DOM
    const vrButton = document.getElementById('enter-vr');
    if (vrButton) setupXRButton(vrButton);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    // update orbit controls (smooth damping)
    if (orbitControls) orbitControls.update();

    // rotate cube only when VR mode enabled (previous behavior)
    if (vrEnabled) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

// Use Three.js animation loop so rendering works correctly inside XR sessions
renderer.setAnimationLoop(animate);

function startVR() {
    vrEnabled = true;
}

function stopVR() {
    vrEnabled = false;
}

init();
// Initialize controls if they were loaded before this script
if (typeof initControls === 'function') {
    initControls(cube);
}

// ----- VR controller interaction helpers -----
function onSelectStart(event) {
    const controller = event.target;
    // Attach cube to controller so user can move it while holding the select button
    try {
        controller.add(cube);
        controller.userData.isSelecting = true;
    } catch (e) {
        console.warn('Could not attach cube to controller:', e && e.message);
    }
}

function onSelectEnd(event) {
    const controller = event.target;
    controller.userData.isSelecting = false;
    // Detach cube and reattach to scene while preserving world transform
    try {
        scene.attach(cube);
    } catch (e) {
        console.warn('Could not detach cube from controller:', e && e.message);
    }
}

// Simple XR button wiring: request an immersive-vr session and set it on the renderer
function setupXRButton(button) {
    if (!('xr' in navigator)) {
        button.textContent = 'WebXR no soportado';
        button.disabled = true;
        return;
    }

    let currentSession = null;

    const onSessionEnded = () => {
        currentSession = null;
        renderer.xr.setSession(null);
        button.textContent = 'Entrar inmersión';
        stopVR();
    };

    button.addEventListener('click', () => {
        if (currentSession === null) {
            navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] })
                .then((session) => {
                    currentSession = session;
                    renderer.xr.setSession(session);
                    session.addEventListener('end', onSessionEnded);
                    button.textContent = 'Salir inmersión';
                    startVR();
                })
                .catch((err) => {
                    console.error('Failed to start XR session:', err);
                });
        } else {
            currentSession.end();
        }
    });
}