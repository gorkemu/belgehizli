import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import styles from './LegalManager.module.css';
import { Scale, Save, CheckCircle, AlertCircle, Loader2, History, Eye } from 'lucide-react';

function LegalManager() {
    const [docType, setDocType] = useState('on_bilgilendirme');
    const [version, setVersion] = useState('');
    const [content, setContent] = useState('');
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

    useEffect(() => {
        fetchCurrentDocument(docType);
        fetchHistory(docType); 
    }, [docType]);

    const fetchCurrentDocument = async (type) => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await axios.get(`${API_URL}/legal/${type}/latest`);
            setContent(res.data.content);
            generateNewVersionName(); 
        } catch (error) {
            setContent('');
            generateNewVersionName();
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (type) => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await axios.get(`${API_URL}/legal/${type}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error('Geçmiş çekilemedi:', error);
        }
    };

    const generateNewVersionName = () => {
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        setVersion(`v_${dateString}`);
    };

    const loadOldVersion = (oldContent, oldVersion) => {
        setContent(oldContent);
        setVersion(`${oldVersion}_duzenlenmis`); 
        setMessage({ type: 'success', text: `"${oldVersion}" versiyonu editöre yüklendi. Düzenleyip YENİ bir versiyon olarak kaydedebilirsiniz.` });
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!version || !content) {
            setMessage({ type: 'error', text: 'Lütfen versiyon ve içerik alanlarını doldurun.' });
            return;
        }

        const cleanedContent = content.replace(/&nbsp;/g, ' ');
        const token = localStorage.getItem('admin_token'); 

        try {
            setLoading(true);
            await axios.post(
                `${API_URL}/legal/add`,
                {
                    type: docType,
                    version: version,
                    content: cleanedContent,
                    isActive: true 
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setMessage({ type: 'success', text: `"${version}" başarıyla kaydedildi ve tüm kullanıcılara aktif edildi!` });
            fetchHistory(docType); 
        } catch (error) {
            setMessage({ type: 'error', text: 'Kaydedilirken bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Scale size={32} className={styles.headerIcon} />
                <h1 className={styles.title}>Hukuki Metin Yönetimi</h1>
            </div>

            {message.text && (
                <div className={`${styles.alert} ${styles[message.type]}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className={styles.form}>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Sözleşme Türü</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)} className={styles.input}>
                            <option value="on_bilgilendirme">Ön Bilgilendirme Formu</option>
                            <option value="gizlilik_politikasi">Gizlilik Politikası</option>
                            <option value="kullanim_sartlari">Kullanım Şartları (Mesafeli Satış)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Kaydedilecek Yeni Versiyon Kodu</label>
                        <input 
                            type="text" 
                            value={version} 
                            onChange={(e) => setVersion(e.target.value)}
                            placeholder="Örn: v_20260329"
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.editorGroup}>
                    <label>Sözleşme İçeriği (HTML destekli)</label>
                    <div className={styles.quillWrapper}>
                        {loading && !content ? (
                            <div className={styles.loaderWrapper}>
                                <Loader2 className={styles.spinner} size={32} />
                                <span>İçerik yükleniyor...</span>
                            </div>
                        ) : (
                            <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className={styles.quillEditor} />
                        )}
                    </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? <Loader2 className={styles.spinnerBtn} size={20} /> : <Save size={20} />}
                    {loading ? 'Kaydediliyor...' : 'Yeni Versiyon Olarak Kaydet & Aktif Et'}
                </button>
            </form>

            <div className={styles.historySection}>
                <h2 className={styles.historyTitle}><History size={24} /> Geçmiş Versiyonlar Arşivi</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Versiyon</th>
                                <th>Oluşturulma Tarihi</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? (
                                history.map((doc) => (
                                    <tr key={doc._id} className={doc.isActive ? styles.activeRow : ''}>
                                        <td className={styles.versionCol}>{doc.version}</td>
                                        <td>{new Date(doc.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>
                                            {doc.isActive 
                                                ? <span className={styles.badgeActive}>Aktif Sürüm</span> 
                                                : <span className={styles.badgePassive}>Arşivde</span>
                                            }
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => loadOldVersion(doc.content, doc.version)}
                                                className={styles.viewBtn}
                                            >
                                                <Eye size={16} /> İncele / Kopyala
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className={styles.emptyTable}>Henüz geçmiş bir versiyon bulunmuyor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default LegalManager;