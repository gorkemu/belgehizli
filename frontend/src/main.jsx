import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HelmetProvider } from 'react-helmet-async'; 
import './i18n';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
    <ThemeProvider>
        <HelmetProvider>
            <App />
        </HelmetProvider>
    </ThemeProvider>
);