// frontend/src/pages/UserTemplateEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api'; 
import TemplateBuilder from '../features/TemplateBuilder';
import { Loader2, AlertCircle } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import { SEOHead } from '../components/SEOHead'; 

const UserTemplateEdit = () => {
    const { t } = useTranslation();
    const { id, lang } = useParams();
    const navigate = useNavigate();
    const currentLang = lang || 'tr';

    // Dinamik Geri Dönüş Rotası
    const projectsRoute = currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects';

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get(`/projects/${id}`);

                const data = response.data;
                data.fields = Array.isArray(data.fields) ? data.fields : [];
                setTemplate(data);
            } catch (err) {
                const message = getUserFriendlyMessage(
                    err.response?.data,
                    'userTemplateEdit.errorLoading',
                    t
                );
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id, t]);

    const handleSave = async (payload) => {
        await api.put(`/projects/${id}`, payload);
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#57534e' }}>
            <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: 12, color: '#a8a29e' }} />
            <p>{t('userTemplateEdit.loading')}</p>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#dc2626' }}>
            <AlertCircle size={36} style={{ marginBottom: 12 }} />
            <p>{error}</p>
            <button 
                onClick={() => navigate(`/${currentLang}/${projectsRoute}`)} 
                style={{ marginTop: '16px', padding: '8px 16px', background: '#1c1917', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
                {t('userTemplateEdit.back')}
            </button>
        </div>
    );

    return (
        <>
            {/* SEO Etiketi - Dinamik Başlık */}
            <SEOHead 
                dynamicTitle={template?.name ? `${template.name} - Tasarım` : 'Şablon Düzenle'} 
                descKey="homePage.metaDescription" 
            />
            <TemplateBuilder initialData={template} onSave={handleSave} isUser={true} />
        </>
    );
};

export default UserTemplateEdit;