// admin-panel-frontend/src/components/invoices/InvoiceShow.jsx
import React from 'react';
import {
    Show,
    SimpleShowLayout,
    TextField,
    DateField,
    NumberField,
    FunctionField,
    ChipField,
    UrlField,
    useGetOne,
    Loading,
    Link 
} from "react-admin";

// JSON verisini formatlı göstermek için helper component
const JsonDataField = ({ source, record = {} }) => {
    if (!record || typeof record[source] === 'undefined') return <ChipField record={{v:'-'}} source="v" size="small"/>;
    let data = record[source];
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { return <pre>{data}</pre>; }
    }
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

// İlgili Transaction'ı göstermek için özel bir alan component'i
const RelatedTransactionForInvoiceField = (props) => {
    const { record: invoiceRecord } = props; // Ana Invoice kaydını props'tan al

    if (!invoiceRecord || !invoiceRecord.transactionId) {
        return <TextField record={invoiceRecord} source="transactionId" label="Transaction ID (Ham)" emptyText="-" />;
    }
    
    const transactionIdToFetch = typeof invoiceRecord.transactionId === 'string' 
        ? invoiceRecord.transactionId 
        : (invoiceRecord.transactionId._id ? invoiceRecord.transactionId._id.toString() : invoiceRecord.transactionId.toString());

    const { data: transaction, isLoading, error } = useGetOne(
        'transactions',
        { id: transactionIdToFetch }
    );

    if (isLoading) return <Loading />;
    if (error) {
        console.error("Error fetching related transaction for InvoiceShow:", error, "for ID:", transactionIdToFetch);
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


export const InvoiceShow = (props) => (
    <Show {...props}>
        <SimpleShowLayout>
            <TextField source="id" label="Invoice ID" />
            <TextField source="invoiceNumber" label="Fatura Numarası" emptyText="-" />
            <ChipField source="status" label="Fatura Durumu" />

            <FunctionField label="İlgili Transaction" render={record => <RelatedTransactionForInvoiceField record={record} />} />
            
            <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
            <TextField source="currency" label="Para Birimi" />

            <hr style={{ margin: '20px 0', borderTop: '1px solid #eee', gridColumn: 'span 2' }}/>
            <h3>Fatura Bilgileri (Invoice Kaydından)</h3>
            <TextField source="billingType" label="Fatura Tipi" />
            <FunctionField label="Müşteri/Firma Adı" render={record => record.billingType === 'bireysel' ? record.customerName : record.companyName} emptyText="-"/>
            <FunctionField label="TCKN/VKN" render={record => record.billingType === 'bireysel' ? record.customerTckn : record.taxId} emptyText="-"/>
            <FunctionField label="Vergi Dairesi" render={record => record.billingType === 'kurumsal' ? record.taxOffice : null} emptyText="-"/>
            <TextField source="customerAddress" label="Fatura Adresi" />
            <TextField source="customerEmail" label="Fatura E-postası" />
            
            <UrlField source="invoiceUrl" label="Fatura Linki (Entegratör)" emptyText="-" />
            <TextField source="errorMessage" label="Hata Mesajı (Fatura)" emptyText="-" />

            <DateField source="createdAt" label="Kayıt Tarihi" showTime />
            <DateField source="updatedAt" label="Son Güncelleme" showTime />
        </SimpleShowLayout>
    </Show>
);