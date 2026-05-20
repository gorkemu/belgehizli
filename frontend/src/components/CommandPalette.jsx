// frontend/src/components/CommandPalette.jsx
import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    Search, FolderKanban, BookOpen, 
    Settings, LogOut, FileText, AlertTriangle,
    Home, LogIn, UserPlus, Palette 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; 
import styles from './CommandPalette.module.css';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext'; 
import { THEMES } from '../features/TemplateBuilder/utils/constants'; 

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [paletteMode, setPaletteMode] = useState('default'); 
    
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const { theme, changeTheme } = useTheme();
    const { t } = useTranslation();
    const { lang } = useParams();
    const currentLang = lang || 'tr';

    const homePath = `/${currentLang}`;
    const dashboardPath = `/${currentLang}/${currentLang === 'tr' ? 'panel' : 'dashboard'}`;
    const projectsPath  = `/${currentLang}/${currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects'}`;
    const galleryPath   = `/${currentLang}/${currentLang === 'tr' ? 'sablonlar' : 'templates'}`;
    const settingsPath  = `/${currentLang}/${currentLang === 'tr' ? 'panel/settings' : 'dashboard/settings'}`;
    const loginPath     = `/${currentLang}/${currentLang === 'tr' ? 'giris-yap' : 'login'}`;
    const registerPath  = `/${currentLang}/${currentLang === 'tr' ? 'kayit-ol' : 'register'}`;

    const changeThemeCommand = useMemo(() => ({
        id: 'change_theme',
        label: t('commandPalette.changeTheme', 'Temayı Değiştir...'),
        icon: <Palette size={18} />,
        shortcut: 'T D',
        action: () => {
            setPaletteMode('theme');
            setQuery('');
            setSelectedIndex(0);
        }
    }), [t]);

    const LOGGED_IN_COMMANDS = useMemo(() => [
        { id: 'dashboard', label: t('commandPalette.dashboard'), icon: <FolderKanban size={18} />, shortcut: 'G T', action: () => navigate(dashboardPath) },
        { id: 'new_doc', label: t('commandPalette.newDoc'), icon: <FileText size={18} />, shortcut: 'N D', action: () => { navigate(projectsPath); setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-doc-modal')), 150); } },
        { id: 'gallery', label: t('commandPalette.gallery'), icon: <BookOpen size={18} />, shortcut: 'G G', action: () => navigate(galleryPath) },
        changeThemeCommand,
        { id: 'settings', label: t('commandPalette.settings'), icon: <Settings size={18} />, shortcut: 'G S', action: () => navigate(settingsPath) },
        { id: 'logout', label: t('commandPalette.logout'), icon: <LogOut size={18} />, shortcut: 'Q Q', action: () => setShowLogoutModal(true) },
    ], [navigate, t, dashboardPath, projectsPath, galleryPath, settingsPath, changeThemeCommand]);

    const LOGGED_OUT_COMMANDS = useMemo(() => [
        { id: 'home', label: t('commandPalette.home'), icon: <Home size={18} />, shortcut: 'G H', action: () => navigate(homePath) },
        { id: 'gallery', label: t('commandPalette.gallery'), icon: <BookOpen size={18} />, shortcut: 'G G', action: () => navigate(galleryPath) },
        changeThemeCommand,
        { id: 'login', label: t('commandPalette.login'), icon: <LogIn size={18} />, shortcut: 'L I', action: () => navigate(loginPath) },
        { id: 'register', label: t('commandPalette.register'), icon: <UserPlus size={18} />, shortcut: 'S U', action: () => navigate(registerPath) },
    ], [navigate, t, homePath, galleryPath, loginPath, registerPath, changeThemeCommand]);

    const THEME_COMMANDS = useMemo(() => THEMES.map(th => ({
        id: `theme_${th.id}`,
        label: t(th.label),
        icon: <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{th.emoji}</span>,
        shortcut: theme === th.id ? t('commandPalette.active', 'Aktif') : '',
        action: () => {
            changeTheme(th.id);
            setIsOpen(false);
        }
    })), [theme, changeTheme, t]);

    const BASE_COMMANDS = user ? LOGGED_IN_COMMANDS : LOGGED_OUT_COMMANDS;
    const COMMANDS = paletteMode === 'theme' ? THEME_COMMANDS : BASE_COMMANDS;

    const filteredCommands = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(open => !open);
            }
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setShowLogoutModal(false);
            setPaletteMode('default'); 
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleKeyDown = (e) => {
        if (showLogoutModal) return; 

        if (e.key === 'Escape') {
            e.preventDefault();
            if (paletteMode === 'theme') {
                setPaletteMode('default');
                setQuery('');
                setSelectedIndex(0);
            } else {
                setIsOpen(false);
            }
        } else if (e.key === 'Backspace' && query === '' && paletteMode === 'theme') {
            e.preventDefault();
            setPaletteMode('default');
            setSelectedIndex(0);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands.length > 0) {
                filteredCommands[selectedIndex].action();
                if (filteredCommands[selectedIndex].id !== 'logout' && filteredCommands[selectedIndex].id !== 'change_theme') {
                    setIsOpen(false);
                }
            }
        }
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        setIsOpen(false);
        if (logout) {
            logout(); 
        } else { 
            localStorage.removeItem('user_token'); 
            navigate(loginPath);
        }
    };

    useEffect(() => {
        if (isOpen && !showLogoutModal) {
            const el = document.getElementById(`cmd-item-${selectedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex, isOpen, showLogoutModal]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onMouseDown={() => !showLogoutModal && setIsOpen(false)}>
            <div className={styles.palette} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder={paletteMode === 'theme' ? t('commandPalette.searchTheme', 'Tema ara...') : t('commandPalette.placeholder')}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                        disabled={showLogoutModal} 
                    />
                    <div className={styles.badge}>ESC</div>
                </div>
                
                <div className={styles.content}>
                    {filteredCommands.length > 0 ? (
                        <div className={styles.list}>
                            <div className={styles.listLabel}>
                                {paletteMode === 'theme' 
                                    ? t('commandPalette.themes', 'TEMALAR') 
                                    : t('commandPalette.suggestions')}
                            </div>
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    id={`cmd-item-${index}`}
                                    className={`${styles.item} ${index === selectedIndex ? styles.itemActive : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => { 
                                        cmd.action(); 
                                        if(cmd.id !== 'logout' && cmd.id !== 'change_theme') setIsOpen(false); 
                                    }}
                                >
                                    <div className={styles.itemLeft}>
                                        <div className={styles.itemIcon}>{cmd.icon}</div>
                                        <span className={styles.itemText}>{cmd.label}</span>
                                    </div>
                                    <div className={styles.itemRight}>
                                        {cmd.shortcut.split(' ').map((key, i) => (
                                            key && <span key={i} className={styles.shortcutKey}>{key}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>{t('commandPalette.noResults', { query })}</p>
                        </div>
                    )}
                </div>
                <div className={styles.footer}>
                    <span>
                        {paletteMode === 'theme' ? (
                            <><b>ESC / Backspace</b> {t('commandPalette.footerBack', 'ile geri dön,')} </>
                        ) : (
                            <>{t('commandPalette.footerHint')} <b>ESC</b>, </>
                        )}
                        {t('commandPalette.footerSelect')} <b>ENTER</b> {t('commandPalette.footerUse')}
                    </span>
                </div>
            </div>

            {showLogoutModal && (
                <div className={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
                    <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIconBox}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </div>
                        <h2 className={styles.modalTitle}>{t('dashboardLayout.logoutConfirmTitle')}</h2>
                        <p className={styles.modalText}>{t('dashboardLayout.logoutConfirmText')}</p>
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => {
                                setShowLogoutModal(false);
                                setTimeout(() => inputRef.current?.focus(), 50); 
                            }} style={{ flex: 1 }}>
                                {t('dashboardLayout.cancel')}
                            </Button>
                            <Button variant="danger" onClick={handleConfirmLogout} style={{ flex: 1 }}>
                                {t('dashboardLayout.confirmLogout')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};