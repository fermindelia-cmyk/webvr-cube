const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Use existing canvas to make CSS sizing predictable
const canvas = document.getElementById('vr-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
let orbitControls = null; // Three.js OrbitControls instance (if available)

// We'll create cylinders (tejos) and an infinite ground plane
let cylinder = null; // Current player's cylinder
let tejito = null; // The small marker cylinder
let cylinders = []; // All cylinders in play

let vrEnabled = false;

// Controller reference for VR interaction
let controller1 = null;

// Game state
let gameState = {
    tejitaLanzado: false,
    cilindrosLanzados: [],
    scores: {}
};

// Simple physics bookkeeping
const gravity = -9.81; // m/s^2 (arbitrary scale)
const physicsObjects = []; // objects with .userData.velocity and .userData.isHeld
const clock = new THREE.Clock();
// scale applied to release velocity so the object gains noticeable momentum on let-go
const releaseVelocityScale = 1.6;
// Friction parameters
const groundFriction = 0.80; // friction coefficient (0-1, where 1 = no friction, 0 = complete stop)
const groundAngularDamping = 0.75; // damping for rotation

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

    // Load HDRI background from JPEG
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('src/hdri/spiaggia_di_mondello.jpg', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });

    // Create an invisible ground plane (collider only)
    const groundSize = 1000;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        visible: false
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // rotate to be horizontal
    ground.position.y = 0;
    scene.add(ground);
    
    // store ground reference for collision detection
    scene.userData.groundY = 0;

    // Create the TEJITO (small marker cylinder) - smaller and darker
    const tejitRadius = 0.08;
    const tejitHeight = 0.03;
    const tejitGeometry = new THREE.CylinderGeometry(tejitRadius, tejitRadius, tejitHeight, 32);
    const tejitMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark gray
    tejito = new THREE.Mesh(tejitGeometry, tejitMaterial);
    tejito.castShadow = true;
    tejito.userData.isTejito = true;
    tejito.position.set(0, 0.5, 0); // Start in hand
    // Mark as held initially so it doesn't fall
    tejito.userData.velocity = new THREE.Vector3(0, 0, 0);
    tejito.userData.isHeld = true;
    tejito.userData.prevWorldPos = new THREE.Vector3();
    tejito.userData.angularVelocity = new THREE.Vector3(0, 0, 0);
    scene.add(tejito);
    physicsObjects.push(tejito);
    cylinders.push(tejito);

    // Create the first player cylinder (tejo) - larger and orange
    const cylRadius = 0.18;
    const cylHeight = 0.06;
    const cylGeometry = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 32);
    const cylMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
    cylinder = new THREE.Mesh(cylGeometry, cylMaterial);
    cylinder.castShadow = true;
    cylinder.userData.playerId = 1;
    cylinder.userData.isTejito = false;
    cylinder.position.set(0.3, 0.5, 0);
    scene.add(cylinder);

    // physics userdata
    cylinder.userData.velocity = new THREE.Vector3(0, 0, 0);
    cylinder.userData.isHeld = false;
    cylinder.userData.prevWorldPos = new THREE.Vector3();
    // angular velocity for spinning the cylinder (rad/s)
    cylinder.userData.angularVelocity = new THREE.Vector3(0, 0, 0);
    physicsObjects.push(cylinder);
    cylinders.push(cylinder);

    // Create a white rectangle target on the ground ahead
    const targetWidth = 2.5;
    const targetDepth = 8.0;
    const targetGeometry = new THREE.PlaneGeometry(targetWidth, targetDepth);
    const targetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.8
    });
    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.rotation.x = -Math.PI / 2; // rotate to be horizontal
    target.position.set(0, 0.001, -3); // slightly above ground, ahead of camera
    scene.add(target);

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

    // Create a basic controller for grabbing with grip/squeeze in VR
    try {
        controller1 = renderer.xr.getController(0);
        // Use squeeze (grip) instead of select for grabbing
        controller1.addEventListener('squeezestart', onGripStart);
        controller1.addEventListener('squeezeend', onGripEnd);
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

    // Update PC controls if not in VR
    if (typeof window.updatePCControls === 'function') {
        window.updatePCControls(vrEnabled);
    }

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

        // integrate angular velocity into rotation
        if (obj.userData.angularVelocity) {
            const angle = obj.userData.angularVelocity.length();
            if (angle > 0.001) {
                const axis = obj.userData.angularVelocity.clone().normalize();
                const q = new THREE.Quaternion();
                q.setFromAxisAngle(axis, angle * delta);
                obj.quaternion.multiplyQuaternions(q, obj.quaternion);
            }
        }

        // simple collision with ground plane at y=0
        const halfHeight = (obj.geometry.parameters.height || 0.06) / 2;
        const minY = halfHeight; // ground is at y=0, so min center y is halfHeight
        if (obj.position.y <= minY) {
            obj.position.y = minY;
            obj.userData.velocity.y = 0;
            
            // Apply friction when on ground
            // Reduce horizontal velocity by friction coefficient
            obj.userData.velocity.x *= groundFriction;
            obj.userData.velocity.z *= groundFriction;
            
            // Reduce angular velocity by damping coefficient
            if (obj.userData.angularVelocity) {
                obj.userData.angularVelocity.multiplyScalar(groundAngularDamping);
                
                // Stop spinning if velocity is very small
                if (obj.userData.angularVelocity.length() < 0.01) {
                    obj.userData.angularVelocity.set(0, 0, 0);
                }
            }
            
            // Stop linear motion if velocity is very small
            if (obj.userData.velocity.length() < 0.01) {
                obj.userData.velocity.set(0, 0, 0);
            }
        }
    });

    // Update scores if tejito has been thrown
    updateScoresUI();

    renderer.render(scene, camera);
}

// Calculate scores based on distance from tejito
function calculateScores() {
    if (!gameState.tejitaLanzado || !tejito) return;

    const tejitPos = tejito.getWorldPosition(new THREE.Vector3());
    let closest = null;
    let closestDist = Infinity;

    cylinders.forEach((cyl) => {
        if (!cyl || cyl === tejito) return;
        
        const cylPos = cyl.getWorldPosition(new THREE.Vector3());
        const distance = tejitPos.distanceTo(cylPos);
        
        cyl.userData.distanceToTejito = distance;
        
        if (distance < closestDist) {
            closestDist = distance;
            closest = cyl;
        }
    });

    // Highlight the closest cylinder
    cylinders.forEach((cyl) => {
        if (!cyl || cyl === tejito) return;
        if (cyl === closest) {
            cyl.material.emissive.setHex(0xffff00); // Highlight winner
        } else {
            cyl.material.emissive.setHex(0x000000);
        }
    });

    return closest;
}

// Update scores display in UI
function updateScoresUI() {
    const closest = calculateScores();
    if (closest && typeof window.updateScoresDisplay === 'function') {
        window.updateScoresDisplay(closest.userData.playerId, closest.userData.distanceToTejito);
    }
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
// Make gameState available globally
window.gameState = gameState;
window.tejito = tejito;

// Initialize controls if they were loaded before this script
if (typeof initControls === 'function') {
    initControls(cylinder);
}

// ----- VR controller interaction helpers (Grip-based grabbing) -----
function onGripStart(event) {
    const controller = event.target;
    // Attach cylinder to controller so it moves with the controller
    try {
        controller.add(cylinder);
        controller.userData.isGripping = true;
        cylinder.userData.isHeld = true;
        // record the controller's world position for velocity calculation
        controller.getWorldPosition(cylinder.userData.prevWorldPos);
        // reset velocity while holding
        cylinder.userData.velocity.set(0, 0, 0);
        cylinder.userData.angularVelocity.set(0, 0, 0);
    } catch (e) {
        console.warn('Could not attach cylinder to controller:', e && e.message);
    }
}

function onGripEnd(event) {
    const controller = event.target;
    controller.userData.isGripping = false;
    // Detach cylinder and reattach to scene while preserving world transform
    try {
        // compute release velocity from controller's previous -> current world position
        const worldPos = new THREE.Vector3();
        cylinder.getWorldPosition(worldPos);
        const dt = Math.max(clock.getDelta(), 1e-6);
        const v = worldPos.clone().sub(cylinder.userData.prevWorldPos).divideScalar(dt);
        // amplify release velocity so the tejo gains momentum when released
        v.multiplyScalar(releaseVelocityScale);
        // reattach to scene keeping world transform
        scene.attach(cylinder);
        cylinder.userData.isHeld = false;
        // set physics velocity
        cylinder.userData.velocity.copy(v);
        // compute angular velocity from lateral momentum (spin around Y axis)
        const lateralSpeed = Math.sqrt(v.x * v.x + v.z * v.z);
        const spinAxis = new THREE.Vector3(0, 1, 0);
        cylinder.userData.angularVelocity.copy(spinAxis).multiplyScalar(lateralSpeed * 3);
    } catch (e) {
        console.warn('Could not detach cylinder from controller:', e && e.message);
    }
}// Simple XR button wiring: request an immersive-vr session and set it on the renderer
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

// ===== UI Update Functions =====
window.updateScoresDisplay = function(playerId, distance) {
    const statusEl = document.getElementById('game-status');
    const playerEl = document.getElementById('closest-player');
    const distanceEl = document.getElementById('distance-display');

    if (gameState.tejitaLanzado) {
        statusEl.textContent = '¡Lanza tu cilindro!';
        playerEl.textContent = `🏆 Jugador ${playerId} va ganando`;
        distanceEl.textContent = `Distancia: ${distance.toFixed(2)}m`;
    }
};