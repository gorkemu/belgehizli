// frontend/src/components/CommandPalette.jsx
import React, { useState, useEffect, useRef, useContext } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { 
    Search, FolderKanban, PlusCircle, BookOpen, 
    Settings, LogOut, FileText
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; 
import styles from './CommandPalette.module.css';

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);

    const COMMANDS = [
        { id: 'dashboard', label: 'Ana Panel / Son Çalışmalar', icon: <FolderKanban size={18} />, shortcut: 'G T', action: () => navigate('/panel') },
        
        { 
            id: 'new_doc', 
            label: 'Yeni Belge Oluştur (Odak Modu)', 
            icon: <FileText size={18} />, 
            shortcut: 'N D', 
            action: () => { 
                navigate('/panel/projects'); 
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-doc-modal')), 150);
            } 
        },
        
        { 
            id: 'new_template', 
            label: 'Yeni Akıllı Şablon Yarat', 
            icon: <PlusCircle size={18} />, 
            shortcut: 'N T', 
            action: () => {
                navigate('/panel/projects'); 
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-new-template-modal')), 150);
            } 
        },
        
        { id: 'gallery', label: 'Şablon Galerisini Keşfet', icon: <BookOpen size={18} />, shortcut: 'G G', action: () => navigate('/sablonlar') },
        { id: 'settings', label: 'Hesap Ayarları', icon: <Settings size={18} />, shortcut: 'G S', action: () => navigate('/panel/ayarlar') },
        
        { 
            id: 'logout', 
            label: 'Güvenli Çıkış Yap', 
            icon: <LogOut size={18} />, 
            shortcut: 'Q Q', 
            action: () => { 
                if(logout) logout(); 
                else { localStorage.removeItem('user_token'); navigate('/login'); }
            } 
        },
    ];

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
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
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
                setIsOpen(false);
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            const el = document.getElementById(`cmd-item-${selectedIndex}`);
            if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [selectedIndex, isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onMouseDown={() => setIsOpen(false)}>
            <div className={styles.palette} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Nereye gitmek istersin? (Örn: Yeni Belge)"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                        onKeyDown={handleKeyDown}
                    />
                    <div className={styles.badge}>ESC</div>
                </div>
                
                <div className={styles.content}>
                    {filteredCommands.length > 0 ? (
                        <div className={styles.list}>
                            <div className={styles.listLabel}>ÖNERİLEN EYLEMLER</div>
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    id={`cmd-item-${index}`}
                                    className={`${styles.item} ${index === selectedIndex ? styles.itemActive : ''}`}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onClick={() => { cmd.action(); setIsOpen(false); }}
                                >
                                    <div className={styles.itemLeft}>
                                        <div className={styles.itemIcon}>{cmd.icon}</div>
                                        <span className={styles.itemText}>{cmd.label}</span>
                                    </div>
                                    <div className={styles.itemRight}>
                                        {cmd.shortcut.split(' ').map((key, i) => (
                                            <span key={i} className={styles.shortcutKey}>{key}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>"{query}" için bir sonuç bulunamadı.</p>
                        </div>
                    )}
                </div>
                <div className={styles.footer}>
                    <span>Kapatmak için <b>ESC</b>, seçmek için <b>ENTER</b> tuşunu kullanın.</span>
                </div>
            </div>
        </div>
    );
};