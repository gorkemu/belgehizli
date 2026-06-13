// frontend/src/components/CommandPalette.jsx
import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search, FolderKanban, BookOpen,
    Settings, LogOut, FileText, AlertTriangle,
    Home, LogIn, UserPlus, Palette, Check, Sun, Moon
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
    const projectsPath = `/${currentLang}/${currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects'}`;
    const galleryPath = `/${currentLang}/${currentLang === 'tr' ? 'sablonlar' : 'templates'}`;
    const settingsPath = `/${currentLang}/${currentLang === 'tr' ? 'panel/settings' : 'dashboard/settings'}`;
    const loginPath = `/${currentLang}/${currentLang === 'tr' ? 'giris-yap' : 'login'}`;
    const registerPath = `/${currentLang}/${currentLang === 'tr' ? 'kayit-ol' : 'register'}`;

    const changeThemeCommand = useMemo(() => ({
        id: 'change_theme',
        label: t('commandPalette.changeTheme', 'Temayı Değiştir...'),
        icon: <Palette size={18} />,
        shortcut: 'T D',
        action: () => {
            setPaletteMode('theme_categories');
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

    const THEME_CATEGORY_COMMANDS = useMemo(() => [
        { id: 'cat_light', label: t('commandPalette.lightThemes', 'Açık Temalar'), icon: <Sun size={18} />, action: () => { setPaletteMode('theme_light'); setSelectedIndex(0); setQuery(''); } },
        { id: 'cat_dark', label: t('commandPalette.darkThemes', 'Koyu Temalar'), icon: <Moon size={18} />, action: () => { setPaletteMode('theme_dark'); setSelectedIndex(0); setQuery(''); } }
    ], [t]);

    const THEME_LIGHT_COMMANDS = useMemo(() => THEMES.filter(t => t.type === 'light').map(th => ({
        id: `theme_${th.id}`, label: t(th.label), icon: <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{th.emoji}</span>, isActive: theme === th.id, action: () => { changeTheme(th.id); setIsOpen(false); }
    })), [theme, changeTheme, t]);

    const THEME_DARK_COMMANDS = useMemo(() => THEMES.filter(t => t.type === 'dark').map(th => ({
        id: `theme_${th.id}`, label: t(th.label), icon: <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{th.emoji}</span>, isActive: theme === th.id, action: () => { changeTheme(th.id); setIsOpen(false); }
    })), [theme, changeTheme, t]);

    const COMMANDS = useMemo(() => {
        if (paletteMode === 'theme_categories') return THEME_CATEGORY_COMMANDS;
        if (paletteMode === 'theme_light') return THEME_LIGHT_COMMANDS;
        if (paletteMode === 'theme_dark') return THEME_DARK_COMMANDS;
        return user ? LOGGED_IN_COMMANDS : LOGGED_OUT_COMMANDS;
    }, [paletteMode, THEME_CATEGORY_COMMANDS, THEME_LIGHT_COMMANDS, THEME_DARK_COMMANDS, user, LOGGED_IN_COMMANDS, LOGGED_OUT_COMMANDS]);

    const filteredCommands = useMemo(() => {
        const filtered = COMMANDS.filter(cmd =>
            cmd.label.toLowerCase().includes(query.toLowerCase())
        );

        if (query.trim().length > 0 && !paletteMode.startsWith('theme')) {
            filtered.push({
                id: 'search_templates',
                label: t('commandPalette.searchInTemplates', { query }),
                icon: <Search size={18} color="var(--accent)" />,
                shortcut: 'Enter',
                isSearchAction: true,
                action: () => {
                    const searchRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
                    navigate(`/${currentLang}/${searchRoute}?search=${encodeURIComponent(query.trim())}`);
                }
            });
        }
        return filtered;
    }, [COMMANDS, query, paletteMode, t, currentLang, navigate]);

    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(open => !open);
            }
        };
        const handleCustomOpen = () => setIsOpen(true);

        document.addEventListener('keydown', handleGlobalKeyDown);
        window.addEventListener('open-command-palette', handleCustomOpen);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('open-command-palette', handleCustomOpen);
        };
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
            if (paletteMode === 'theme_categories') {
                setPaletteMode('default'); setQuery(''); setSelectedIndex(0);
            } else if (paletteMode === 'theme_light' || paletteMode === 'theme_dark') {
                setPaletteMode('theme_categories'); setQuery(''); setSelectedIndex(0);
            } else {
                setIsOpen(false);
            }
        } else if (e.key === 'Backspace' && query === '') {
            if (paletteMode === 'theme_categories') {
                e.preventDefault();
                setPaletteMode('default'); setSelectedIndex(0);
            } else if (paletteMode === 'theme_light' || paletteMode === 'theme_dark') {
                e.preventDefault();
                setPaletteMode('theme_categories'); setSelectedIndex(0);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands.length > 0) {
                const selectedCmd = filteredCommands[selectedIndex];
                selectedCmd.action();
                if (selectedCmd.id !== 'logout' && selectedCmd.id !== 'change_theme' && selectedCmd.id !== 'cat_light' && selectedCmd.id !== 'cat_dark') {
                    setIsOpen(false);
                }
            }
        }
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        setIsOpen(false);
        if (logout) logout();
        else { localStorage.removeItem('user_token'); navigate(loginPath); }
    };

    useEffect(() => {
        if (isOpen && !showLogoutModal) {
            const el = document.getElementById(`cmd-item-${selectedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex, isOpen, showLogoutModal]);

    if (!isOpen) return null;

    let listLabelText = t('commandPalette.suggestions');
    if (paletteMode === 'theme_categories') listLabelText = t('commandPalette.changeTheme', 'TEMAYI DEĞİŞTİR');
    if (paletteMode === 'theme_light') listLabelText = t('commandPalette.lightThemes', 'AÇIK TEMALAR');
    if (paletteMode === 'theme_dark') listLabelText = t('commandPalette.darkThemes', 'KOYU TEMALAR');

    return (
        <div className={styles.overlay} onMouseDown={() => !showLogoutModal && setIsOpen(false)}>
            <div className={styles.palette} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder={paletteMode.startsWith('theme') ? t('commandPalette.searchTheme', 'Tema ara...') : t('commandPalette.placeholder')}
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
                                {listLabelText}
                            </div>
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    id={`cmd-item-${index}`}
                                    className={`${styles.item} ${index === selectedIndex ? styles.itemActive : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => {
                                        cmd.action();
                                        if (cmd.id !== 'logout' && cmd.id !== 'change_theme' && cmd.id !== 'cat_light' && cmd.id !== 'cat_dark') setIsOpen(false);
                                    }}
                                >
                                    <div className={styles.itemLeft}>
                                        <div className={styles.itemIcon}>{cmd.icon}</div>
                                        <span className={styles.itemText}>{cmd.label}</span>
                                    </div>

                                    {cmd.isActive && (
                                        <div className={styles.activeCheck}>
                                            <Check size={16} />
                                        </div>
                                    )}
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
                        {paletteMode.startsWith('theme') ? (
                            <>
                                {t('commandPalette.footerTheme1')}
                                <b>ESC / Backspace</b>
                                {t('commandPalette.footerTheme2')}
                                <b>ENTER</b>
                                {t('commandPalette.footerTheme3')}
                            </>
                        ) : (
                            <>
                                {t('commandPalette.footerDefault1')}
                                <b>ESC</b>
                                {t('commandPalette.footerDefault2')}
                                <b>ENTER</b>
                                {t('commandPalette.footerDefault3')}
                            </>
                        )}
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