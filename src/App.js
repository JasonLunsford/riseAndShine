import { useEffect, useRef } from 'react';

import styles from './App.module.scss';

const App = () => {
  const CircleRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      CircleRef.current.classList.add("Start");
      CircleRef.current.classList.add("Sunny");
    }, 1000);
  }, []);

  return (
    <div className={styles.App}>
      <div
        className={styles.Circle}
        ref={CircleRef}
      >
        <span>75&deg;F</span>
      </div>
    </div>
  );
}

export default App;
