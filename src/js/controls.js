// ===== PC CONTROLS (Mouse-based) =====
let mouseX = 0;
let mouseY = 0;
const maxMouseY = window.innerHeight;
const maxMouseX = window.innerWidth;

// Track whether we're in a grab state for PC
let pcCylinderHeld = false;
let pcGrabKeyPressed = false; // Spacebar
let pcGrabMousePressed = false; // Mouse button
let currentlyHeldObject = null; // Global reference to currently held object

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / maxMouseX; // normalize 0-1
    mouseY = event.clientY / maxMouseY; // normalize 0-1
});

// Spacebar to grab/throw
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        pcGrabKeyPressed = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        pcGrabKeyPressed = false;
        // Release on key release
        if (typeof window.releasePCCylinder === 'function' && currentlyHeldObject) {
            window.releasePCCylinder(currentlyHeldObject);
        }
    }
});

// Mouse click (left button) to grab/throw
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // left click
        pcGrabMousePressed = true;
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
        pcGrabMousePressed = false;
        // Release on mouse release
        if (typeof window.releasePCCylinder === 'function' && currentlyHeldObject) {
            window.releasePCCylinder(currentlyHeldObject);
        }
    }
});

// Helper to check if grab button is active
function isPCGrabActive() {
    return pcGrabKeyPressed || pcGrabMousePressed;
}

// ===== CONTROL INITIALIZATION =====
function initControls(cylinderRef) {
    if (!cylinderRef) {
        console.warn('initControls: cylinder reference not provided');
        return;
    }

    // Store reference to cylinder and scene for physics updates
    const cylinder = cylinderRef;
    const scene = cylinder.parent;
    
    if (!scene) {
        console.warn('initControls: cylinder has no parent scene');
        return;
    }

    // Track which object is currently held (tejito or cilindro)
    let currentlyHeld = null;

    // Add an update function to the global renderer animation loop
    window.updatePCControls = function(isVREnabled) {
        if (isVREnabled) return; // Skip PC controls if in VR mode

        // Only apply PC controls if the grab key is pressed
        if (!isPCGrabActive()) {
            // If was held but no longer pressing, reset
            if (pcCylinderHeld) {
                pcCylinderHeld = false;
                currentlyHeld = null;
                currentlyHeldObject = null;
            }
            return;
        }

        // Determine which object to hold
        // If tejito not thrown, can only grab tejito
        // If tejito thrown, can only grab regular cylinder
        let objectToHold;
        
        if (typeof window.gameState !== 'undefined') {
            if (!window.gameState.tejitaLanzado) {
                objectToHold = window.tejito;
            } else {
                objectToHold = cylinder;
            }
        } else {
            objectToHold = cylinder;
        }

        if (!objectToHold) return;

        // If not already held, grab the object
        if (!objectToHold.userData.isHeld) {
            objectToHold.userData.isHeld = true;
            pcCylinderHeld = true;
            currentlyHeld = objectToHold;
            currentlyHeldObject = objectToHold; // Update global reference
            objectToHold.userData.velocity.set(0, 0, 0);
            objectToHold.userData.angularVelocity.set(0, 0, 0);
            console.log('Grabbed object:', objectToHold.userData.isTejito ? 'TEJITO' : 'CILINDRO');
        }

        // === Direction Control (Mouse X) ===
        const direction = (mouseX - 0.5) * Math.PI;
        
        // Update object position in a circular arc
        const holdDistance = 0.3;
        const holdHeight = 0.1;
        
        const holdX = Math.sin(direction) * holdDistance;
        const holdZ = -Math.cos(direction) * holdDistance;
        
        objectToHold.position.set(holdX, holdHeight, holdZ);

        // === Force Control (Mouse Y) ===
        const force = (1 - mouseY) * 40; // Increased from 20 to 40 for more visible throws
        
        objectToHold.userData.pcReleaseForce = force;
        objectToHold.userData.pcReleaseDirection = direction;
        
        console.log(`Hold: mouseX=${mouseX.toFixed(2)}, mouseY=${mouseY.toFixed(2)}, force=${force.toFixed(2)}, dir=${direction.toFixed(2)}`);
    };

    // Override the grip end behavior for PC
    window.releasePCCylinder = function(objToRelease) {
        console.log('=== RELEASE CALLED ===');
        console.log('objToRelease:', objToRelease);
        console.log('objToRelease.userData.isHeld:', objToRelease?.userData?.isHeld);
        
        if (!objToRelease || !objToRelease.userData.isHeld) {
            console.warn('releasePCCylinder: Invalid object to release');
            return;
        }

        console.log('✓ Object is valid and held');
        
        objToRelease.userData.isHeld = false;
        pcCylinderHeld = false;
        currentlyHeldObject = null;

        // Compute release velocity based on mouse controls
        const force = objToRelease.userData.pcReleaseForce || 1;
        const direction = objToRelease.userData.pcReleaseDirection || 0;

        console.log(`📊 Release stats - force: ${force.toFixed(2)}, direction: ${direction.toFixed(2)}`);

        // Create velocity vector
        const velocityX = Math.sin(direction) * force;
        const velocityZ = -Math.cos(direction) * force;
        const velocityY = 0;

        console.log(`🚀 Setting velocity: X=${velocityX.toFixed(2)}, Y=${velocityY}, Z=${velocityZ.toFixed(2)}`);
        objToRelease.userData.velocity.set(velocityX, velocityY, velocityZ);

        // Add spin
        const spinAxis = new THREE.Vector3(0, 1, 0);
        objToRelease.userData.angularVelocity.copy(spinAxis).multiplyScalar(force * 2);

        // Mark tejito as thrown if applicable
        if (objToRelease.userData.isTejito && typeof window.gameState !== 'undefined') {
            window.gameState.tejitaLanzado = true;
            console.log('✓ TEJITO LANZADO!');
        }

        console.log('Final velocity check:', objToRelease.userData.velocity);
        console.log('=== RELEASE COMPLETE ===');
    };

    console.log('PC Controls initialized');
}

// Export for global use
window.initControls = initControls;
