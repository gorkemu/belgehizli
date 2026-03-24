// frontend/src/components/PaymentScreen.jsx
import React from 'react';
import styles from './PaymentScreen.module.css';
import { Lock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

function PaymentScreen({ paymentDetails, onPaymentSuccess, onPaymentCancel }) {
    return (
        <div className={styles.container}>
            
            {/* Üst Bilgi ve İkon */}
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Lock size={32} className={styles.lockIcon} />
                </div>
                <h2 className={styles.title}>Güvenli Ödeme</h2>
                <p className={styles.subtitle}>
                    Belgenizi indirmek için lütfen ödeme işlemini tamamlayın.
                </p>
            </div>

            {/* Ödeme Özeti Kartı */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>E-posta Adresi</span>
                    <span className={styles.summaryValue}>{paymentDetails.email}</span>
                </div>
                <div className={styles.summaryDivider}></div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Ödenecek Tutar</span>
                    <span className={styles.amountValue}>
                        {paymentDetails.amount} {paymentDetails.currency}
                    </span>
                </div>
            </div>

            {/* Bilgi / Güvenlik Notu */}
            <div className={styles.securityNote}>
                <ShieldCheck size={20} className={styles.securityIcon} />
                <p>
                    Gerçek ödeme entegrasyonu (Stripe, Iyzico vb.) buraya eklenecektir. 
                    Şu an test aşamasında olduğunuz için doğrudan tamamlayabilirsiniz.
                </p>
            </div>

            {/* Aksiyon Butonları */}
            <div className={styles.buttonGroup}>
                <button 
                    type="button" 
                    className={styles.payButton} 
                    onClick={() => onPaymentSuccess({ transactionId: 'TEST_TRANSACTION_ID' })}
                >
                    <CheckCircle2 size={18} /> Ödemeyi Tamamla
                </button>
                <button 
                    type="button" 
                    className={styles.cancelButton} 
                    onClick={onPaymentCancel}
                >
                    <XCircle size={18} /> İptal Et
                </button>
            </div>
            
        </div>
    );
}

export default PaymentScreen;