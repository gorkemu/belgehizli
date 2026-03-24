// admin-panel-frontend/src/components/consentlogs/ConsentLogShow.jsx
import React from 'react';
import {
    Show,
    SimpleShowLayout,
    TextField,
    DateField,
    FunctionField, // ReferenceField yerine FunctionField
    useGetOne,    // İlişkili kaydı çekmek için
    Loading,      // Yükleniyor göstergesi
    Link,         // React Admin Link component'i
    ChipField     // ChipField (RelatedTransactionField içinde kullanılabilir)
} from "react-admin";

// İlgili Transaction'ı göstermek için özel bir alan component'i
const RelatedTransactionForConsentLogField = (props) => {
    const { record: consentLogRecord } = props; // Ana ConsentLog kaydını props'tan al

    if (!consentLogRecord || !consentLogRecord.transactionId) {
        return <TextField record={consentLogRecord} source="transactionId" label="Transaction ID (Ham)" emptyText="-" />;
    }
    
    const transactionIdToFetch = typeof consentLogRecord.transactionId === 'string' 
        ? consentLogRecord.transactionId 
        : (consentLogRecord.transactionId._id ? consentLogRecord.transactionId._id.toString() : consentLogRecord.transactionId.toString());

    const { data: transaction, isLoading, error } = useGetOne(
        'transactions',
        { id: transactionIdToFetch }
    );

    if (isLoading) return <Loading />;
    if (error) {
        console.error("Error fetching related transaction for ConsentLogShow:", error, "for ID:", transactionIdToFetch);
        return (
            <ChipField 
                record={{ statusMessage: `Transaction Yüklenemedi (ID: ${transactionIdToFetch.slice(-6)}...)` }} 
                source="statusMessage" 
                sx={{ backgroundColor: 'error.light', color: 'error.contrastText' }}
            />
        );
    }
    if (!transaction) {
        return <TextField record={{ idVal: transactionIdToFetch }} source="idVal" label="Transaction Bulunamadı" />;
    }

    return (
        <Link to={`/transactions/${transaction.id}/show`} sx={{ textDecoration: 'none', color: 'inherit' }}>
            <TextField record={transaction} source="templateName" component="span" sx={{ fontWeight: 'bold', mr: 1 }} emptyText="İsimsiz Şablon" />
            (ID: <TextField record={transaction} source="id" component="span" sx={{ fontStyle: 'italic', mr: 1 }}/>
            Durum: <ChipField record={transaction} source="status" size="small" component="span" />)
        </Link>
    );
};

export const ConsentLogShow = (props) => (
    <Show {...props}>
        <SimpleShowLayout>
            <TextField source="id" label="Consent Log ID" />
            <TextField source="userEmail" label="Kullanıcı E-postası" />

            <FunctionField label="İlgili Transaction" render={record => <RelatedTransactionForConsentLogField record={record} />} />
            
            <TextField source="documentType" label="Belge Tipi" />
            <TextField source="documentVersion" label="Belge Versiyonu" />
            <DateField source="consentTimestampClient" label="Onay Zamanı (Client)" showTime />
            <TextField source="ipAddress" label="IP Adresi" />
            <TextField source="userAgent" label="User Agent" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} />
            <DateField source="createdAt" label="Kayıt Tarihi" showTime />
            <DateField source="updatedAt" label="Son Güncelleme" showTime />
        </SimpleShowLayout>
    </Show>
);