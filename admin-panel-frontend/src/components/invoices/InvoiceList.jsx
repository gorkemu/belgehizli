// admin-panel-frontend/src/components/invoices/InvoiceList.jsx
import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    DateField,
    NumberField,
    ReferenceField,
    ChipField,
    Filter,
    TextInput,
    SelectInput,
    DateInput,
    ReferenceInput, 
} from "react-admin";

const InvoiceFilter = (props) => (
    <Filter {...props}>
        <TextInput label="Genel Ara" source="q" resettable />
        <TextInput label="Müşteri E-postası" source="customerEmail_like" resettable />
        <SelectInput source="status" label="Fatura Durumu" choices={[
            { id: 'pending_creation', name: 'Oluşturulmayı Bekliyor' },
            { id: 'created_manual', name: 'Manuel Oluşturuldu' },
            { id: 'sent_to_customer_manual', name: 'Müşteriye Gönderildi (Man.)' },
            { id: 'creation_failed', name: 'Oluşturma Başarısız' },
            { id: 'created', name: 'Oluşturuldu (Oto)' },
            { id: 'sent', name: 'Gönderildi (Oto)' },
            { id: 'paid', name: 'Ödendi' },
        ]} resettable />
        <TextInput label="Fatura No" source="invoiceNumber_like" resettable />

        <ReferenceInput
            label="Transaction'a Göre Filtrele"
            source="transactionId" // Invoice modelindeki filtrelemek istediğimiz alan
            reference="transactions" // Hangi Resource'tan seçim yapılacak
            perPage={200}
            sort={{ field: 'createdAt', order: 'DESC' }}
            filterToQuery={searchText => ({ templateName_like: searchText })} // Dropdown içinde arama yaparken
            allowEmpty
            resettable
        >
            <SelectInput 
                optionText={record => 
                    record ? `${record.templateName || 'İsimsiz Şablon'} (Email: ${record.userEmail || 'N/A'}, ID: ...${record.id?.slice(-6)})` : ''
                }
                emptyText="Tüm Transactionlar"
                emptyValue="" // Boş string, backend bunu "filtre yok" olarak anlar
                // parse={value => (value === '' ? null : value)} // Opsiyonel: Backend'e null göndermek için
            />
            {/* 
            VEYA AutocompleteInput:
            <AutocompleteInput 
                optionText={record => record ? `${record.templateName} (ID: ...${record.id?.slice(-6)})` : ''}
                filterToQuery={searchText => ({ templateName_like: searchText })}
            /> 
            */}
        </ReferenceInput>
        
        <DateInput source="createdAt_gte" label="Başlangıç Tarihi (Fatura)" resettable />
        <DateInput source="createdAt_lte" label="Bitiş Tarihi (Fatura)" resettable />
    </Filter>
);

export const InvoiceList = (props) => (
    <List {...props} filters={<InvoiceFilter />} sort={{ field: 'createdAt', order: 'DESC' }} perPage={25}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="invoiceNumber" label="Fatura No" emptyText="-" />
            <ReferenceField label="Transaction (Şablon)" source="transactionId" reference="transactions" link="show" allowEmpty>
                <TextField source="templateName" /> 
            </ReferenceField>
            <TextField source="customerEmail" label="Müşteri E-postası" />
            <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
            <ChipField source="status" label="Durum" />
            <DateField source="createdAt" label="Oluşturulma Tarihi" showTime />
        </Datagrid>
    </List>
);