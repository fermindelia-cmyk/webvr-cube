function initControls(object) {
    // object: the mesh (cylinder) we'll be able to pick up with the mouse
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let dragOffset = new THREE.Vector3();
    let lastTime = performance.now();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // horizontal plane
    const intersection = new THREE.Vector3();

    function getMousePos(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onMouseDown(event) {
        getMousePos(event);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(object, false);
        if (intersects.length > 0) {
            isDragging = true;
            // ensure object is parented to scene for consistent world coords
            try { scene.attach(object); } catch (e) {}
            object.userData.isHeld = true;
            object.getWorldPosition(object.userData.prevWorldPos);
            // compute offset from intersection point to object position
            intersection.copy(intersects[0].point);
            dragOffset.copy(object.userData.prevWorldPos).sub(intersection);
            lastTime = performance.now();
        }
    }

    function onMouseMove(event) {
        if (!isDragging) return;
        getMousePos(event);
        raycaster.setFromCamera(mouse, camera);
        // project onto a horizontal plane at the current object's height
        const worldY = object.getWorldPosition(new THREE.Vector3()).y;
        plane.set(new THREE.Vector3(0, 1, 0), -worldY);
        if (raycaster.ray.intersectPlane(plane, intersection)) {
            const target = intersection.clone().add(dragOffset);
            // set object's world position (assuming parent is scene)
            object.position.copy(target);
        }
    }

    function onMouseUp(event) {
        if (!isDragging) return;
        isDragging = false;
        object.userData.isHeld = false;
        // compute release velocity
        const now = performance.now();
        const dt = Math.max((now - lastTime) / 1000, 1e-6);
        const worldPos = new THREE.Vector3();
        object.getWorldPosition(worldPos);
        const v = worldPos.clone().sub(object.userData.prevWorldPos).divideScalar(dt);
        object.userData.velocity.copy(v);
    }

    function onMouseOut(event) {
        onMouseUp(event);
    }

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseout', onMouseOut);
}
// Expose initControls as a global so it can be used by non-module scripts
window.initControls = initControls;