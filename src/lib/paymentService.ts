/**
 * Payment Service
 * Handles M-Pesa, Card, and Bank payment integrations
 * 
 * NOTE: This is a frontend simulation layer. In production, these would
 * connect to actual payment APIs via your backend server.
 */

export type PaymentProvider = 'mpesa' | 'card' | 'bank';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentRequest {
    provider: PaymentProvider;
    amount: number;
    currency: string;
    reference: string;
    description: string;
    metadata?: Record<string, unknown>;
}

export interface MpesaPaymentDetails {
    phoneNumber: string;
    accountReference?: string;
}

export interface CardPaymentDetails {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
}

export interface BankPaymentDetails {
    bankCode: string;
    accountNumber: string;
    accountName: string;
}

export interface PaymentResponse {
    success: boolean;
    transactionId: string;
    status: PaymentStatus;
    message: string;
    checkoutRequestId?: string;
    merchantRequestId?: string;
    timestamp: string;
}

export interface PaymentStatusResponse {
    status: PaymentStatus;
    resultCode?: string;
    resultDesc?: string;
    transactionId?: string;
    amount?: number;
    phoneNumber?: string;
    timestamp: string;
}

// Kenyan Banks for Bank Transfer
export const KENYAN_BANKS = [
    { code: 'KCB', name: 'Kenya Commercial Bank' },
    { code: 'EQUITY', name: 'Equity Bank' },
    { code: 'COOP', name: 'Co-operative Bank' },
    { code: 'ABSA', name: 'ABSA Bank Kenya' },
    { code: 'STANBIC', name: 'Stanbic Bank' },
    { code: 'STANDARD', name: 'Standard Chartered' },
    { code: 'DTB', name: 'Diamond Trust Bank' },
    { code: 'IM', name: 'I&M Bank' },
    { code: 'FAMILY', name: 'Family Bank' },
    { code: 'NCBA', name: 'NCBA Bank' },
    { code: 'SIDIAN', name: 'Sidian Bank' },
    { code: 'ECOBANK', name: 'Ecobank Kenya' },
];

// Generate unique reference
const generateReference = (prefix = 'TRX'): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
};

// Validate Kenyan phone number (formats: +254..., 254..., 07..., 01...)
export const validateKenyanPhone = (phone: string): { valid: boolean; formatted: string } => {
    // Remove all spaces and dashes
    let cleaned = phone.replace(/[\s-]/g, '');

    // If starts with +, remove it
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }

    // If starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    }

    // Validate: should be 12 digits starting with 254
    const isValid = /^254[17]\d{8}$/.test(cleaned);

    return {
        valid: isValid,
        formatted: cleaned,
    };
};

// Format amount to KES display
export const formatKES = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * M-Pesa STK Push Payment
 * Initiates M-Pesa payment request
 */
export const initiateMpesaPayment = async (
    amount: number,
    phoneNumber: string,
    description: string,
    accountReference?: string
): Promise<PaymentResponse> => {
    // Validate phone
    const { valid, formatted } = validateKenyanPhone(phoneNumber);
    if (!valid) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Invalid phone number. Please enter a valid Kenyan phone number.',
            timestamp: new Date().toISOString(),
        };
    }

    // Validate amount
    if (amount < 1 || amount > 150000) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Amount must be between KES 1 and KES 150,000.',
            timestamp: new Date().toISOString(),
        };
    }

    // Generate references
    const transactionId = generateReference('MPESA');
    const checkoutRequestId = generateReference('WS');
    const merchantRequestId = generateReference('MRC');

    // In production, this would call your backend API which interacts with Safaricom M-Pesa API
    // For demo, we simulate a successful STK push
    console.log('[M-Pesa] Initiating STK Push:', {
        phone: formatted,
        amount,
        reference: accountReference || transactionId,
        description,
    });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate success (in production, this would be the actual response)
    return {
        success: true,
        transactionId,
        status: 'pending',
        message: `M-Pesa payment request sent to ${formatted}. Please enter your M-Pesa PIN on your phone.`,
        checkoutRequestId,
        merchantRequestId,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Check M-Pesa Payment Status
 */
export const checkMpesaStatus = async (
    checkoutRequestId: string
): Promise<PaymentStatusResponse> => {
    // In production, this would query status from your backend/M-Pesa API
    console.log('[M-Pesa] Checking status for:', checkoutRequestId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate success after "user enters PIN"
    const random = Math.random();

    if (random > 0.2) {
        return {
            status: 'completed',
            resultCode: '0',
            resultDesc: 'The service request is processed successfully.',
            transactionId: generateReference('MPESA'),
            timestamp: new Date().toISOString(),
        };
    } else if (random > 0.1) {
        return {
            status: 'pending',
            resultDesc: 'Waiting for user to complete the transaction.',
            timestamp: new Date().toISOString(),
        };
    } else {
        return {
            status: 'failed',
            resultCode: '1032',
            resultDesc: 'Transaction cancelled by user.',
            timestamp: new Date().toISOString(),
        };
    }
};

/**
 * Card Payment Processing
 * In production, this would integrate with a payment gateway (Stripe, PayStack, Flutterwave, etc.)
 */
export const processCardPayment = async (
    amount: number,
    cardDetails: CardPaymentDetails,
    description: string
): Promise<PaymentResponse> => {
    // Basic card validation
    const cardNumber = cardDetails.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Invalid card number.',
            timestamp: new Date().toISOString(),
        };
    }

    // CVV validation
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Invalid CVV.',
            timestamp: new Date().toISOString(),
        };
    }

    // Expiry validation
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expYear = parseInt(cardDetails.expiryYear);
    const expMonth = parseInt(cardDetails.expiryMonth);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Card has expired.',
            timestamp: new Date().toISOString(),
        };
    }

    const transactionId = generateReference('CARD');

    console.log('[Card] Processing payment:', {
        amount,
        lastFour: cardNumber.slice(-4),
        description,
    });

    // Simulate API processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate success
    return {
        success: true,
        transactionId,
        status: 'completed',
        message: 'Card payment processed successfully.',
        timestamp: new Date().toISOString(),
    };
};

/**
 * Bank Transfer Initiation
 * For bank-to-bank transfers or RTGS/EFT
 */
export const initiateBankTransfer = async (
    amount: number,
    bankDetails: BankPaymentDetails,
    description: string
): Promise<PaymentResponse> => {
    // Validate bank code
    const validBank = KENYAN_BANKS.find((b) => b.code === bankDetails.bankCode);
    if (!validBank) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Invalid bank selected.',
            timestamp: new Date().toISOString(),
        };
    }

    // Validate account number
    if (!/^\d{6,16}$/.test(bankDetails.accountNumber.replace(/\s/g, ''))) {
        return {
            success: false,
            transactionId: '',
            status: 'failed',
            message: 'Invalid account number.',
            timestamp: new Date().toISOString(),
        };
    }

    const transactionId = generateReference('BANK');

    console.log('[Bank] Initiating transfer:', {
        amount,
        bank: validBank.name,
        account: bankDetails.accountNumber.slice(-4),
        description,
    });

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        success: true,
        transactionId,
        status: 'pending',
        message: `Bank transfer initiated. Reference: ${transactionId}. Please complete the transfer from your bank.`,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Unified Payment Processing
 * Routes to appropriate payment method
 */
export const processPayment = async (
    request: PaymentRequest,
    providerDetails: MpesaPaymentDetails | CardPaymentDetails | BankPaymentDetails
): Promise<PaymentResponse> => {
    switch (request.provider) {
        case 'mpesa': {
            const mpesaDetails = providerDetails as MpesaPaymentDetails;
            return initiateMpesaPayment(
                request.amount,
                mpesaDetails.phoneNumber,
                request.description,
                mpesaDetails.accountReference
            );
        }

        case 'card':
            return processCardPayment(
                request.amount,
                providerDetails as CardPaymentDetails,
                request.description
            );

        case 'bank':
            return initiateBankTransfer(
                request.amount,
                providerDetails as BankPaymentDetails,
                request.description
            );

        default:
            return {
                success: false,
                transactionId: '',
                status: 'failed',
                message: 'Invalid payment provider.',
                timestamp: new Date().toISOString(),
            };
    }
};

/**
 * Calculate Transaction Fee
 * Returns the fee for a given payment method and amount
 */
export const calculateFee = (
    provider: PaymentProvider,
    amount: number
): { fee: number; total: number } => {
    let fee = 0;

    switch (provider) {
        case 'mpesa':
            // M-Pesa tiered fees (approximate)
            if (amount <= 100) fee = 0;
            else if (amount <= 500) fee = 7;
            else if (amount <= 1000) fee = 13;
            else if (amount <= 1500) fee = 23;
            else if (amount <= 2500) fee = 33;
            else if (amount <= 3500) fee = 53;
            else if (amount <= 5000) fee = 57;
            else if (amount <= 7500) fee = 78;
            else if (amount <= 10000) fee = 90;
            else if (amount <= 15000) fee = 100;
            else if (amount <= 20000) fee = 105;
            else if (amount <= 35000) fee = 108;
            else if (amount <= 50000) fee = 108;
            else fee = 108;
            break;

        case 'card':
            // Card processing fee (typically 2.5-3.5%)
            fee = Math.ceil(amount * 0.029);
            break;

        case 'bank':
            // Bank transfer fee
            if (amount <= 10000) fee = 30;
            else if (amount <= 100000) fee = 50;
            else fee = 100;
            break;
    }

    return {
        fee,
        total: amount + fee,
    };
};

export default {
    initiateMpesaPayment,
    checkMpesaStatus,
    processCardPayment,
    initiateBankTransfer,
    processPayment,
    calculateFee,
    validateKenyanPhone,
    formatKES,
    KENYAN_BANKS,
};
