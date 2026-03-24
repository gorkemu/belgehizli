import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    DateField,
    NumberField,
    ChipField,
    ReferenceField,
    Filter,
    TextInput,
    SelectInput,
    DateInput 
} from "react-admin";

const TransactionFilter = (props) => (
    <Filter {...props}>
        <TextInput label="Genel Ara" source="q" resettable />
        <TextInput label="Kullanıcı E-postası" source="userEmail_like" resettable />
        <TextInput label="Şablon Adı" source="templateName_like" resettable />
        <SelectInput source="status" label="Durum" choices={[
            { id: 'initiated', name: 'Başlatıldı' },
            { id: 'payment_pending', name: 'Ödeme Bekliyor' },
            { id: 'payment_successful', name: 'Ödeme Başarılı' },
            { id: 'payment_failed', name: 'Ödeme Başarısız' },
            { id: 'pdf_generated', name: 'PDF Oluşturuldu' },
            { id: 'email_sent', name: 'E-posta Gönderildi' },
            { id: 'completed', name: 'Tamamlandı' },
            { id: 'failed', name: 'Başarısız (Genel)' },
        ]} resettable />
        <DateInput source="createdAt_gte" label="Başlangıç Tarihi (Oluşturma)" resettable />
        <DateInput source="createdAt_lte" label="Bitiş Tarihi (Oluşturma)" resettable />
    </Filter>
);

export const TransactionList = (props) => (
    <List {...props} filters={<TransactionFilter />} sort={{ field: 'createdAt', order: 'DESC' }} perPage={25}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="userEmail" label="Kullanıcı E-postası" />
            <TextField source="templateName" label="Şablon Adı" />
            <TextField source="templateId" label="Şablon ID" />
            <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
            <ChipField source="status" label="Durum" />
            <DateField source="createdAt" label="İşlem Tarihi" showTime />
            <ReferenceField label="Fatura ID" source="invoiceId" reference="invoices" link="show" allowEmpty>
                 <TextField source="id" />
            </ReferenceField>
        </Datagrid>
    </List>
);