import { useState } from 'react';
import axios from 'axios';

function usePdfGeneration(templateId) {
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    const generatePdf = async (formData) => {
        setLoadingPdf(true);
        setPdfError(null);
        try {
            const response = await axios.post(`/api/templates/${templateId}/generate-pdf`, { formData }, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url); // Yeni sekmede aç veya indir
            window.URL.revokeObjectURL(url);
            setLoadingPdf(false);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            setPdfError('PDF oluşturulamadı.');
            setLoadingPdf(false);
        }
    };

    return { generatePdf, loadingPdf, pdfError };
}

export default usePdfGeneration;