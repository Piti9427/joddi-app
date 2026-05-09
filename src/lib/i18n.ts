type Language = 'th' | 'en';

const translations = {
  th: {
    // Nav
    dashboard: 'หน้าแรก',
    transactions: 'รายการ',
    analytics: 'วิเคราะห์',
    budget: 'งบ',
    settings: 'ตั้งค่า',

    // Dashboard
    welcome: 'ยินดีต้อนรับ',
    balance: 'ยอดคงเหลือ',
    income: 'รายรับ',
    expense: 'รายจ่าย',
    today: 'วันนี้',
    this_month: 'เดือนนี้',
    recent_transactions: 'รายการล่าสุด',
    view_all: 'ดูทั้งหมด',
    quick_add: 'เพิ่มด่วน',
    no_transactions: 'ยังไม่มีรายการ',

    // Add Transaction
    add_title: 'บันทึกรายการ',
    amount_placeholder: '0.00',
    category: 'หมวดหมู่',
    note: 'โน้ต',
    date: 'วันที่',
    save: 'บันทึก',
    cancel: 'ยกเลิก',

    // Settings
    usage: 'การใช้งาน',
    dark_mode: 'โหมดมืด',
    currency: 'สกุลเงิน',
    language: 'ภาษา',
    account: 'บัญชี',
    sync_now: 'ซิงก์ตอนนี้',
    clear_data: 'ล้างข้อมูลในเครื่อง',
    help: 'ช่วยเหลือ',
    sign_out: 'ออกจากระบบ',
    sign_in: 'เข้าสู่ระบบ',
    save_profile: 'บันทึกโปรไฟล์',
  },
  en: {
    // Nav
    dashboard: 'Home',
    transactions: 'History',
    analytics: 'Insights',
    budget: 'Budget',
    settings: 'Settings',

    // Dashboard
    welcome: 'Welcome',
    balance: 'Net Balance',
    income: 'Income',
    expense: 'Expense',
    today: 'Today',
    this_month: 'This Month',
    recent_transactions: 'Recent',
    view_all: 'View All',
    quick_add: 'Quick Add',
    no_transactions: 'No transactions yet',

    // Add Transaction
    add_title: 'Add Transaction',
    amount_placeholder: '0.00',
    category: 'Category',
    note: 'Note',
    date: 'Date',
    save: 'Save',
    cancel: 'Cancel',

    // Settings
    usage: 'Preferences',
    dark_mode: 'Dark Mode',
    currency: 'Currency',
    language: 'Language',
    account: 'Account',
    sync_now: 'Sync Now',
    clear_data: 'Clear Local Data',
    help: 'Support',
    sign_out: 'Sign Out',
    sign_in: 'Sign In',
    save_profile: 'Save Profile',
  },
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.th;
}

export type TranslationKeys = keyof typeof translations.th;
