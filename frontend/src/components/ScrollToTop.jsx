// frontend/src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    setTimeout(() => {
      window.scrollTo(0, 0);
      
      const scrollableElements = document.querySelectorAll(
        'main, #root, [class*="appContainer"], [class*="appMain"], [class*="right"]'
      );
      
      scrollableElements.forEach(el => {
        el.scrollTo(0, 0);
      });
    }, 10); 

  }, [pathname]);

  return null;
};

export default ScrollToTop;