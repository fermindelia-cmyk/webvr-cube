const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Use existing canvas to make CSS sizing predictable
const canvas = document.getElementById('vr-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
let orbitControls = null; // Three.js OrbitControls instance (if available)

// We'll create a cylinder (el "tejo") and a rectangular cancha (suelo)
let cylinder = null;
let court = null;

let vrEnabled = false;

// Controller reference for VR interaction
let controller1 = null;

// Simple physics bookkeeping
const gravity = -9.81; // m/s^2 (arbitrary scale)
const physicsObjects = []; // objects with .userData.velocity and .userData.isHeld
const clock = new THREE.Clock();

function init() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(0, 1.6, 4);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(-3, 10, -10);
    scene.add(dir);

    // Create a rectangular court (plane) - visible as a thin box
    const courtWidth = 6;
    const courtDepth = 3;
    const courtHeight = 0.02;
    const courtGeometry = new THREE.BoxGeometry(courtWidth, courtHeight, courtDepth);
    const courtMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.position.y = 0; // top surface at y=0
    court.receiveShadow = true;
    scene.add(court);

    // Create the cylinder (tejo)
    const cylRadius = 0.18;
    const cylHeight = 0.06;
    const cylGeometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 32);
    const cylMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    cylinder = new THREE.Mesh(cylGeometry, cylMaterial);
    cylinder.castShadow = true;
    cylinder.position.set(0, 0.5, 0);
    scene.add(cylinder);

    // physics userdata
    cylinder.userData.velocity = new THREE.Vector3(0, 0, 0);
    cylinder.userData.isHeld = false;
    cylinder.userData.prevWorldPos = new THREE.Vector3();
    physicsObjects.push(cylinder);

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
    const delta = clock.getDelta();

    // update orbit controls (smooth damping)
    if (orbitControls) orbitControls.update();

    // Physics integration for simple gravity and floor collision
    physicsObjects.forEach((obj) => {
        if (!obj) return;
        if (obj.userData.isHeld) {
            // when held, keep prevWorldPos updated so we can compute release velocity
            obj.getWorldPosition(obj.userData.prevWorldPos);
            return;
        }

        // integrate velocity (gravity)
        obj.userData.velocity.y += gravity * delta;

        // integrate position
        obj.position.addScaledVector(obj.userData.velocity, delta);

        // simple collision with court top surface at y = (cylinder half-height)
        const halfHeight = (obj.geometry.parameters.height || 0.06) / 2;
        const minY = halfHeight; // court top is at y=0, so min center y is halfHeight
        if (obj.position.y <= minY) {
            obj.position.y = minY;
            obj.userData.velocity.y = 0;
        }
    });

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
    initControls(cylinder);
}

// ----- VR controller interaction helpers -----
function onSelectStart(event) {
    const controller = event.target;
    // Attach cylinder to controller so user can move it while holding the select button
    try {
        // preserve world transform when parenting
        controller.add(cylinder);
        controller.userData.isSelecting = true;
        cylinder.userData.isHeld = true;
        // record prevWorldPos for release velocity
        cylinder.getWorldPosition(cylinder.userData.prevWorldPos);
    } catch (e) {
        console.warn('Could not attach cylinder to controller:', e && e.message);
    }
}

function onSelectEnd(event) {
    const controller = event.target;
    controller.userData.isSelecting = false;
    // Detach cylinder and reattach to scene while preserving world transform
    try {
        // compute release velocity from prevWorldPos -> current world pos
        const worldPos = new THREE.Vector3();
        cylinder.getWorldPosition(worldPos);
        const dt = Math.max(clock.getDelta(), 1e-6);
        const v = worldPos.clone().sub(cylinder.userData.prevWorldPos).divideScalar(dt);
        // reattach to scene keeping world transform
        scene.attach(cylinder);
        cylinder.userData.isHeld = false;
        // set physics velocity (use only Y and X/Z from computed v)
        cylinder.userData.velocity.copy(v);
    } catch (e) {
        console.warn('Could not detach cylinder from controller:', e && e.message);
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