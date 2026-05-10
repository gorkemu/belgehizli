// frontend/src/pages/UserTemplateCreate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import api from '../utils/api'; 
import TemplateBuilder from '../features/TemplateBuilder';
import { SEOHead } from '../components/SEOHead'; 

const UserTemplateCreate = () => {
    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || 'tr';

    const handleSave = async (payload) => {
        const response = await api.post(`/projects/create`, payload);
        
        const editRoute = currentLang === 'tr' ? 'panel/duzenle' : 'dashboard/edit';
        if (response.data && response.data._id) {
            navigate(`/${currentLang}/${editRoute}/${response.data._id}`);
        }
    };

    return (
        <>
            {/* SEO Etiketi */}
            <SEOHead 
                titleKey="projects.newTemplate" 
                descKey="homePage.metaDescription" 
            />
            <TemplateBuilder onSave={handleSave} isUser={true} />
        </>
    );
};

export default UserTemplateCreate;