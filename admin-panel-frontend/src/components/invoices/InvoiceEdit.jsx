// admin-panel-frontend/src/components/invoices/InvoiceEdit.jsx
import * as React from "react";
import {
    Edit,
    SimpleForm,
    TextInput,
    SelectInput,
    ReferenceField,
    TextField,
    DateField,
    NumberField,
    Toolbar,     
    SaveButton,  
    DeleteButton // Opsiyonel silme butonu
} from "react-admin";

const InvoiceEditToolbar = props => (
    <Toolbar {...props} >
        <SaveButton />
        {/* <DeleteButton mutationMode="pessimistic" />  // Silme isteniyorsa */}
    </Toolbar>
);

export const InvoiceEdit = (props) => (
    <Edit {...props} mutationMode="pessimistic"> {/* pessimistic: işlem bitene kadar UI'ı kilitle */}
        <SimpleForm toolbar={<InvoiceEditToolbar />}>
            <TextField source="id" label="Invoice ID" />
            <ReferenceField label="İlgili Transaction" source="transactionId" reference="transactions" link="show">
                <TextField source="id" />
            </ReferenceField>
            <TextField source="customerEmail" label="Müşteri E-postası" />
            <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />

            <hr style={{ margin: '20px 0', borderTop: '1px solid #eee', gridColumn: 'span 2' }}/>

            <TextInput source="invoiceNumber" label="Manuel Fatura Numarası" fullWidth />
            <SelectInput source="status" label="Fatura Durumu" fullWidth choices={[
                { id: 'pending_creation', name: 'Oluşturulmayı Bekliyor' },
                { id: 'created_manual', name: 'Manuel Oluşturuldu' },
                { id: 'sent_to_customer_manual', name: 'Müşteriye Gönderildi (Manuel)' },
                { id: 'creation_failed', name: 'Oluşturma Başarısız Oldu' },

            ]} />
            <TextInput source="errorMessage" label="Hata Mesajı (Fatura)" fullWidth multiline />
            
            <DateField source="createdAt" label="Kayıt Tarihi" showTime />
            <DateField source="updatedAt" label="Son Güncelleme" showTime />
        </SimpleForm>
    </Edit>
);