import { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import styles from './App.module.scss';

const RADIUS = 500;

const App = () => {
  const SunRef = useRef(null);
  const GuideRef = useRef(null);

  const [origin, setOrigin] = useState();
  const [sunPath, setSunPath] = useState();

  useEffect(() => {
    configureGuide();
    calculateOrigin();
    configureSunPath();
  }, []);

  useEffect(() => {
    if (sunPath) {
      startAnimation();
    }
  }, [sunPath]);

  const configureGuide = () => {
    GuideRef.current.style.top    = 'calc(100% - ' + RADIUS + 'px)';
    GuideRef.current.style.left    = 'calc(50% - ' + RADIUS + 'px)';
 	  GuideRef.current.style.width 	= RADIUS * 2 +'px';
    GuideRef.current.style.height = RADIUS * 2 +'px';
  };

  const calculateOrigin = () => {
    const originBox = GuideRef.current.getBoundingClientRect();
    const sunBox = SunRef.current.getBoundingClientRect();

    const adjustedX = (originBox.left + originBox.width / 2) - (sunBox.left + sunBox.right / 2);
    const adjustedY = (originBox.top + originBox.height / 2) - (sunBox.top + sunBox.bottom / 2);

    setOrigin({
      'x': adjustedX,
      'y': adjustedY
    });
  };

  const configureSunPath = () => {
    let pathData = {};

 		pathData.startAngle 	 = Math.PI; 
 		pathData.endAngle   	 = 0;
    pathData.animationTime = 10000; // in milliseconds
    pathData.vector	   		 = (pathData.startAngle - pathData.endAngle) / pathData.animationTime;
    pathData.start				 = false;
    pathData.curAngle	 		 = pathData.startAngle;

    setSunPath(pathData);
  };

  const startAnimation = () => {
    if (!sunPath.start) {
      sunPath.start = Date.now();
      sunPath.now	 = Date.now();
    }
    
    // if ((sunPath.now - sunPath.start) > sunPath.animationTime) { 
    //   alert('Animation Ended!'); 
    //   return; 
    // }

    const elapsed = Date.now() - sunPath.now;
		sunPath.now	= Date.now();
    sunPath.curAngle += elapsed * sunPath.vector; 
 
		let x = RADIUS * Math.cos(sunPath.curAngle);
    let y = RADIUS * Math.sin(sunPath.curAngle);

    SunRef.current.style.left = (origin.x + x) + 'px';
    SunRef.current.style.top	= (origin.y + y) + 'px';

    requestAnimationFrame(startAnimation);
  };

  return (
    <div className={styles.App}>
      <div
        className={clsx(styles.Circle, styles.Sunny)}
        ref={SunRef}
      >
        <span>75&deg;F</span>
      </div>
      <div className={styles.Guide} ref={GuideRef} />
    </div>
  );
}

export default App;
