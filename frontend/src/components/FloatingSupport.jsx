import React, { useState, useEffect, useRef } from 'react';
import { Coffee } from 'lucide-react';
import styles from './FloatingSupport.module.css';

function FloatingSupport() {
    const [isExpanded, setIsExpanded] = useState(false);
    const wrapperRef = useRef(null);
    const shopierUrl = "https://www.shopier.com/belgehizli/45489886";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleButtonClick = (e) => {
        // Cihazın dokunmatik (mobil) olup olmadığını kontrol et
        const isTouchDevice = window.matchMedia('(hover: none)').matches;

        if (isTouchDevice) {
            if (!isExpanded) {
                // MOBİLDE 1. DOKUNUŞ: Sadece genişlet
                setIsExpanded(true);
            } else {
                // MOBİLDE 2. DOKUNUŞ: Shopier'e gönder
                window.open(shopierUrl, '_blank', 'noopener,noreferrer');
                setIsExpanded(false); // Geri döndüğünde kapalı olsun
            }
        } else {
            // MASAÜSTÜ: Hover zaten genişlettiği için direkt gönder
            window.open(shopierUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div 
            ref={wrapperRef}
            className={`${styles.floatingButton} ${isExpanded ? styles.expanded : ''}`}
            onClick={handleButtonClick}
            role="button"
            aria-label="Destek Ol"
            style={{ cursor: 'pointer' }}
        >
            <Coffee size={24} className={styles.icon} />
            <span className={styles.text}>Bir Kahve Ismarla</span>
        </div>
    );
}

export default FloatingSupport;