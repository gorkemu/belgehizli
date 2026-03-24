// admin-panel-frontend/src/components/consentlogs/ConsentLogList.jsx
import * as React from "react";
import {
    List,
    Datagrid,
    TextField,
    DateField,
    ReferenceField,
    Filter,
    TextInput,
    DateInput,
    ReferenceInput, 
    SelectInput,    
    // AutocompleteInput // Alternatif olarak, çok fazla transaction varsa
} from "react-admin";

const ConsentLogFilter = (props) => (
    <Filter {...props}>
        <TextInput label="Genel Ara" source="q" resettable />
        <TextInput label="Kullanıcı E-postası" source="userEmail_like" resettable />
        <TextInput label="Belge Versiyonu" source="documentVersion_like" resettable />
        
        <ReferenceInput
            label="Transaction'a Göre Filtrele" // Filtre etiketi
            source="transactionId" // ConsentLog modelindeki filtrelemek istediğimiz alan
            reference="transactions" // Hangi Resource'tan seçim yapılacak (/api/admin-data/transactions)
            perPage={200} // Dropdown'da gösterilecek max transaction sayısı (çok fazlaysa performansı etkileyebilir)
            sort={{ field: 'createdAt', order: 'DESC' }} // Dropdown seçeneklerini sırala
            filterToQuery={searchText => ({ templateName_like: searchText })} // Dropdown içinde arama yaparken templateName'e göre filtrele (opsiyonel)
            allowEmpty // "Tümü" seçeneği için
            resettable
        >
            {/* Kullanıcının seçim yapacağı component */}
            <SelectInput 
                optionText={record => 
                    record ? `${record.templateName || 'İsimsiz Şablon'} (Email: ${record.userEmail || 'N/A'}, ID: ...${record.id?.slice(-6)})` : ''
                } 
                // optionValue="id" // Varsayılan olarak 'id' kullanılır, belirtmeye gerek yok
                emptyText="Tüm Transactionlar" // allowEmpty true ise gösterilecek metin
                emptyValue="" // null yerine boş string
            />
            {/* 
            Eğer çok fazla transaction varsa SelectInput yerine AutocompleteInput daha iyi performans gösterir:
            <AutocompleteInput 
                optionText={record => 
                    record ? `${record.templateName || 'İsimsiz Şablon'} (ID: ...${record.id?.slice(-6)})` : ''
                }
                filterToQuery={searchText => ({ templateName_like: searchText })} // Kullanıcı yazarken templateName'e göre backend'de arama yapar
                // inputText={record => record ? `${record.templateName} (ID: ...${record.id.slice(-6)})` : ''} // Seçildikten sonra input'ta ne görüneceği
                // matchSuggestion={(filterValue, suggestion) => true} // Geniş eşleşme için
            />
            */}
        </ReferenceInput>
        
        <DateInput source="createdAt_gte" label="Başlangıç Tarihi (Kayıt)" resettable />
        <DateInput source="createdAt_lte" label="Bitiş Tarihi (Kayıt)" resettable />
    </Filter>
);

export const ConsentLogList = (props) => (
    <List {...props} filters={<ConsentLogFilter />} sort={{ field: 'createdAt', order: 'DESC' }} perPage={25}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="userEmail" label="Kullanıcı E-postası" />
            <ReferenceField label="Transaction (Şablon Adı)" source="transactionId" reference="transactions" link="show" allowEmpty>
                <TextField source="templateName" /> 
            </ReferenceField>
            <TextField source="documentType" label="Belge Tipi" />
            <TextField source="documentVersion" label="Belge Versiyonu" />
            <DateField source="consentTimestampClient" label="Onay Zamanı (Client)" showTime />
            <TextField source="ipAddress" label="IP Adresi" />
            <DateField source="createdAt" label="Kayıt Tarihi" showTime />
        </Datagrid>
    </List>
);