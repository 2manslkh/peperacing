import { useEffect, useState } from 'react';

interface IDimension {
  width: number;
  height: number;
}
const getWindowDimensions = (): IDimension => {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
};

const useWindowDimensions = () => {

  const [windowDimensions, setWindowDimensions] = useState<IDimension>(getWindowDimensions());

  // To solve inconsistency of mobile viewheight
  // const [viewHeight, setViewHeight] = useState<number>(0);

  useEffect(() => {
    // setWindowDimensions(getWindowDimensions());

    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    // setViewHeight(window.innerHeight * 0.01);

    window.addEventListener(`resize`, handleResize);
    return () => window.removeEventListener(`resize`, handleResize);
  }, []);

  return {
    windowDimensions,
    // viewHeight,
  };
};

export default useWindowDimensions;
