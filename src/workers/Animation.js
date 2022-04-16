onmessage = ({ data: { sunPath, origin, radius } }) => {
    startAnimation(postMessage, origin, sunPath, radius)
};

const startAnimation = (postMessage, origin, sunPath, radius) => {
    if (!sunPath.start) {
        sunPath.start = true;
        sunPath.now = Date.now();
    }

    const elapsed = Date.now() - sunPath.now;
    sunPath.now = Date.now();
    sunPath.curAngle += elapsed * sunPath.vector; 

    let x = radius * Math.cos(sunPath.curAngle);
    let y = radius * Math.sin(sunPath.curAngle);

    const position = {
        left: (origin.x + x) + 'px',
        top: (origin.y + y) + 'px'
    };

    postMessage({ position });

    requestAnimationFrame(() => startAnimation(postMessage, origin, sunPath, radius));
};