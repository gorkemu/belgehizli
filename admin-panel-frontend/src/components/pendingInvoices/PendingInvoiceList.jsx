// admin-panel-frontend/src/components/pendingInvoices/PendingInvoiceList.jsx
import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    DateField,
    NumberField,
    ChipField,
    FunctionField,
    Button,
    useRecordContext 
} from "react-admin";
import { Link } from 'react-router-dom';


const BillingInfoField = () => {
    const record = useRecordContext(); 
    if (!record || !record.billingInfo) return null;
    const bi = record.billingInfo;
    return (
        <div style={{ fontSize: '0.8em', whiteSpace: 'pre-wrap' }}>
            {bi.billingType === 'bireysel' ? `${bi.name} (${bi.tckn})` : `${bi.companyName} (VKN: ${bi.vkn}, VD: ${bi.taxOffice})`}
            <br />
            {bi.address}
            <br />
            {bi.email}
        </div>
    );
};

const EditInvoiceButton = () => {
    const record = useRecordContext(); 
    if (!record) return null; // record yoksa butonu render etme
    
    if (!record.invoiceId) {
        return (
            <Button
                component={Link}
                to={`/transactions/${record.id}/show`}
                label="Detay Gör / Fatura Bilgisi Ekle"
                size="small"
            />
        );
    }
    return (
        <Button
            component={Link}
            to={`/invoices/${record.invoiceId}/edit`}
            label="Faturayı İşle"
            size="small"
            variant="contained"
            color="primary"
        />
    );
};

export const PendingInvoiceList = (props) => (
    <List 
        {...props} 
        resource="transactions-pending-invoice"
        title="Faturalanacak İşlemler"
        sort={{ field: 'createdAt', order: 'ASC' }}
        perPage={25}
        exporter={false}
        bulkActionButtons={false}
    >
        <Datagrid rowClick={false}> 
            <DateField source="createdAt" label="İşlem Tarihi" showTime />
            <TextField source="userEmail" label="Kullanıcı E-postası" />
            <TextField source="templateName" label="Şablon Adı" />
            <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
            <FunctionField label="Fatura Bilgileri" render={() => <BillingInfoField />} />
            <ChipField source="status" label="Transaction Durumu" />
            <FunctionField label="Aksiyon" render={() => <EditInvoiceButton />} />
        </Datagrid>
    </List>
);