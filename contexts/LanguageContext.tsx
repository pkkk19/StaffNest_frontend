import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

type TranslationStrings = {
  [key: string]: string;
};

const translations: Record<Language, TranslationStrings> = {
  en: {
    sessionExpired: 'Session Expired',
    pleaseLoginAgain: 'Your session has expired. Please login again.',
    
    // Dashboard
    goodMorning: 'Good Morning',
    goodMorningManager: 'Good Morning, Manager',
    manager: 'Manager',
    staff: 'Staff',
    manageStaff: 'Manage Staff',
    sendNotifications: 'Send Notifications',
    hoursThisWeek: 'Hours This Week',
    holidaysLeft: 'Holidays Left',
    hours: 'hours',
    days: 'days',
    quickActions: 'Quick Actions',
    recentNotifications: 'Recent Notifications',
    viewRota: 'View Rota',
    clockIn: 'Clock In',
    payslips: 'Payslips',
    shiftReminder: 'Shift Reminder',
    shiftTomorrow: 'You have a shift tomorrow at 9:00 AM',
    holidayApproved: 'Holiday Approved',
    holidayApprovedMsg: 'Your holiday request has been approved',
    rotaUpdated: 'Rota Updated',
    rotaUpdatedMsg: 'Your weekly schedule has been updated',
    
    // Rota
    rota: 'Rota',
    scheduled: 'Scheduled',
    dayOff: 'Day Off',
    weekSummary: 'Week Summary',
    totalHours: 'Total Hours',
    scheduledDays: 'Scheduled Days',
    overtime: 'Overtime',
    
    // Time Tracking
    timeTracking: 'Time Tracking',
    clockOut: 'Clock Out',
    clockedIn: 'Clocked In',
    clockedOut: 'Clocked Out',
    confirmClockOut: 'Are you sure you want to clock out?',
    cancel: 'Cancel',
    currentLocation: 'Current Location',
    currentSession: 'Current Session',
    clockInTime: 'Clock In Time',
    duration: 'Duration',
    breakTime: 'Break Time',
    todaySummary: 'Today\'s Summary',
    breaks: 'Breaks',
    
    // Staff
    searchStaff: 'Search staff...',
    
    // Chat
    chat: 'Chat',
    searchConversations: 'Search conversations...',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    personalInfo: 'Personal Information',
    manageProfileDetails: 'Manage your profile details',
    appearance: 'Appearance',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    colorblindMode: 'Colorblind Mode',
    optimizedForColorblindness: 'Optimized for colorblindness',
    language: 'Language',
    notifications: 'Notifications',
    notificationSettings: 'Notification Settings',
    manageNotifications: 'Manage your notification preferences',
    security: 'Security',
    passwordAndTwoFactor: 'Password and two-factor authentication',
    support: 'Support',
    helpSupport: 'Help & Support',
    faqsAndContact: 'FAQs and contact information',
    signOut: 'Sign Out',
    
    // Login
    welcomeBack: 'Welcome Back',
    needManagerAccount: 'Need a manager account?',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    demoCredentials: 'Demo Credentials',
    error: 'Error',
    fillAllFields: 'Please fill in all fields',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    accountCreated: 'Manager account created successfully! Please sign in.',
    signupFailed: 'Signup failed. Please try again.',
    createManagerAccount: 'Create Manager Account',
    managersOnly: 'Managers Only',
    fullName: 'Full Name',
    companyName: 'Company Name',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create Account',
    creatingAccount: 'Creating Account...',
    alreadyHaveAccount: 'Already have an account?',
    managerAccountInfo: 'Manager Account Information',
    managerAccountDescription: 'Manager accounts have full access to staff management, rota creation, payroll, and all administrative features.',
    loginFailed: 'Login failed. Please try again.',
    yourLocation: 'Your Location',
    firstName: 'First Name',
    lastName: 'Last Name',
    phoneNumber: 'Phone Number',
    dateOfBirth: 'Date of Birth (YYYY-MM-DD)',
    companyInfo: 'Company Information',
    
    // Additional translations
    staffDetails: 'Staff Details',
    contactInformation: 'Contact Information',
    address: 'Address',
    employmentDetails: 'Employment Details',
    employeeId: 'Employee ID',
    startDate: 'Start Date',
    branch: 'Branch',
    workingHours: 'Working Hours',
    emergencyContact: 'Emergency Contact',
    viewPayslips: 'View Payslips',
    viewTimeHistory: 'View Time History',
    
    // Profile editing
    editProfile: 'Edit Profile',
    changePhoto: 'Change Photo',
    personalInformation: 'Personal Information',
    enterFullName: 'Enter full name',
    enterEmail: 'Enter email address',
    enterPhone: 'Enter phone number',
    enterAddress: 'Enter address',
    contactName: 'Contact Name',
    enterContactName: 'Enter contact name',
    contactPhone: 'Contact Phone',
    enterContactPhone: 'Enter contact phone',
    relationship: 'Relationship',
    enterRelationship: 'Enter relationship',
    saveChanges: 'Save Changes',
    success: 'Success',
    profileUpdated: 'Profile updated successfully',
    ok: 'OK',
    
    // Payslips
    grossPay: 'Gross Pay',
    tax: 'Tax',
    nationalInsurance: 'National Insurance',
    netPay: 'Net Pay',
    view: 'View',
    download: 'Download',
    yearToDate: 'Year to Date',
    totalGross: 'Total Gross',
    totalNet: 'Total Net',
    totalTax: 'Total Tax',
    totalNI: 'Total NI',
    
    // Notifications
    searchNotifications: 'Search notifications...',
    all: 'All',
    unread: 'Unread',
    read: 'Read',
    
    // Chat
    newChat: 'New Chat',
    searchContacts: 'Search contacts...',
    
    // Location
    locationRequired: 'Location Required',
    locationRequiredMessage: 'Location access is required for clock-in. Please enable location permissions.',
    enableLocation: 'Enable Location',

    // Add Staff
    addStaffMember: 'Add Staff Member',
    enterFirstName: 'Enter first name',
    enterLastName: 'Enter last name',
    enterDepartment: 'Enter department',
    supervisor: 'Supervisor',
    mainBranch: 'Main Branch',
    secondaryBranch: 'Secondary Branch',
    remote: 'Remote',
    contractType: 'Contract Type',
    fullTime: 'Full Time',
    partTime: 'Part Time',
    contract: 'Contract',
    temporary: 'Temporary',
    workingHoursPerWeek: 'Working Hours per Week',
    salary: 'Salary',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    emailRequired: 'Email is required',
    phoneRequired: 'Phone number is required',
    departmentRequired: 'Department is required',
    startDateRequired: 'Start date is required',
    invalidEmail: 'Please enter a valid email address',
    pleaseFixErrors: 'Please fix the errors before submitting',
    staffMemberAdded: 'Staff member added successfully',
    accessDenied: 'Access Denied',
    managerAccessOnly: 'Only managers can access this feature',

    // New fields
  "employeeRef": "Employee Reference",
  "employeeRefRequired": "Employee reference is required",
  "niNumber": "NI Number",
  "niNumberRequired": "NI Number is required",
  "invalidNiNumber": "Invalid NI Number format",
  "taxCode": "Tax Code",
  "payFrequency": "Pay Frequency",
  "paymentMethod": "Payment Method",
  "bankAccountNumber": "Bank Account Number",
  "bankSortCode": "Sort Code",
  "pensionScheme": "Pension Scheme",
  "employeePensionRate": "Employee Pension Rate (%)",
  "pensionSalarySacrifice": "Salary Sacrifice Pension",
  "defaultHourlyRate": "Default Hourly Rate",
  "defaultSalary": "Default Salary",
  "annualLeaveEntitlementDays": "Annual Leave (Days)",
  "annualLeaveEntitlementHours": "Annual Leave (Hours)",
  "employmentType": "Employment Type",
  "employmentStartDate": "Employment Start Date",
  "position": "Position",
  
  // Options
  "monthly": "Monthly",
  "weekly": "Weekly",
  "biWeekly": "Bi-Weekly",
  "fortnightly": "Fortnightly",
  "bacs": "BACS",
  "cheque": "Cheque",
  "cash": "Cash",
  "yes": "Yes",
  "no": "No",
  
  // Section titles
  "payrollInformation": "Payroll Information",
  "bankDetails": "Bank Details",
  "pensionAndPay": "Pension & Pay Rates",

  // Add these to your translation files
  "failedToAddStaff": "Failed to add staff member",
  },
  ne: {
    // Dashboard
    goodMorning: 'शुभ प्रभात',
    goodMorningManager: 'शुभ प्रभात, प्रबन्धक',
    manager: 'प्रबन्धक',
    staff: 'कर्मचारी',
    manageStaff: 'कर्मचारी व्यवस्थापन',
    sendNotifications: 'सूचना पठाउनुहोस्',
    hoursThisWeek: 'यो साता घण्टा',
    holidaysLeft: 'बाँकी बिदा',
    hours: 'घण्टा',
    days: 'दिन',
    quickActions: 'छिटो कार्यहरू',
    recentNotifications: 'हालैका सूचनाहरू',
    viewRota: 'रोटा हेर्नुहोस्',
    clockIn: 'समय सुरु',
    payslips: 'तलब पर्चा',
    shiftReminder: 'काम परिवर्तन सम्झना',
    shiftTomorrow: 'भोलि बिहान ९ बजे तपाईंको काम छ',
    holidayApproved: 'बिदा स्वीकृत',
    holidayApprovedMsg: 'तपाईंको बिदा अनुरोध स्वीकृत गरिएको छ',
    rotaUpdated: 'रोटा अपडेट',
    rotaUpdatedMsg: 'तपाईंको साप्ताहिक तालिका अपडेट गरिएको छ',
    
    // Rota
    rota: 'रोटा',
    scheduled: 'निर्धारित',
    dayOff: 'बिदा',
    weekSummary: 'साप्ताहिक सारांश',
    totalHours: 'कुल घण्टा',
    scheduledDays: 'निर्धारित दिनहरू',
    overtime: 'अतिरिक्त समय',
    
    // Time Tracking
    timeTracking: 'समय ट्र्याकिङ',
    clockOut: 'समय अन्त्य',
    clockedIn: 'समय सुरु गरिएको',
    clockedOut: 'समय अन्त्य गरिएको',
    confirmClockOut: 'के तपाईं समय अन्त्य गर्न चाहनुहुन्छ?',
    cancel: 'रद्द गर्नुहोस्',
    currentLocation: 'हालको स्थान',
    currentSession: 'हालको सत्र',
    clockInTime: 'सुरु समय',
    duration: 'अवधि',
    breakTime: 'विश्राम समय',
    todaySummary: 'आजको सारांश',
    breaks: 'विश्राम',
    
    // Staff
    searchStaff: 'कर्मचारी खोज्नुहोस्...',
    
    // Chat
    chat: 'च्याट',
    searchConversations: 'कुराकानी खोज्नुहोस्...',
    
    // Settings
    settings: 'सेटिङहरू',
    profile: 'प्रोफाइल',
    personalInfo: 'व्यक्तिगत जानकारी',
    manageProfileDetails: 'तपाईंको प्रोफाइल विवरण व्यवस्थापन गर्नुहोस्',
    appearance: 'देखावट',
    lightMode: 'उज्यालो मोड',
    darkMode: 'अँध्यारो मोड',
    colorblindMode: 'रङ्गअन्धता मोड',
    optimizedForColorblindness: 'रङ्गअन्धताका लागि अनुकूलित',
    language: 'भाषा',
    notifications: 'सूचनाहरू',
    notificationSettings: 'सूचना सेटिङहरू',
    manageNotifications: 'तपाईंको सूचना प्राथमिकताहरू व्यवस्थापन गर्नुहोस्',
    security: 'सुरक्षा',
    passwordAndTwoFactor: 'पासवर्ड र दुई-कारक प्रमाणीकरण',
    support: 'सहयोग',
    helpSupport: 'मद्दत र सहयोग',
    faqsAndContact: 'बारम्बार सोधिने प्रश्नहरू र सम्पर्क जानकारी',
    signOut: 'साइन आउट',
    
    // Login
    welcomeBack: 'फिर्ता स्वागत छ',
    needManagerAccount: 'प्रबन्धक खाता चाहिन्छ?',
    signUp: 'साइन अप',
    email: 'इमेल',
    password: 'पासवर्ड',
    forgotPassword: 'पासवर्ड बिर्सनुभयो?',
    signIn: 'साइन इन',
    signingIn: 'साइन इन गर्दै...',
    demoCredentials: 'डेमो प्रमाणहरू',
    error: 'त्रुटि',
    fillAllFields: 'कृपया सबै फिल्डहरू भर्नुहोस्',
    passwordsDoNotMatch: 'पासवर्डहरू मेल खाँदैनन्',
    passwordTooShort: 'पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ',
    accountCreated: 'प्रबन्धक खाता सफलतापूर्वक सिर्जना गरियो! कृपया साइन इन गर्नुहोस्।',
    signupFailed: 'साइन अप असफल। कृपया फेरि प्रयास गर्नुहोस्।',
    createManagerAccount: 'प्रबन्धक खाता सिर्जना गर्नुहोस्',
    managersOnly: 'प्रबन्धकहरू मात्र',
    fullName: 'पूरा नाम',
    companyName: 'कम्पनीको नाम',
    confirmPassword: 'पासवर्ड पुष्टि गर्नुहोस्',
    createAccount: 'खाता सिर्जना गर्नुहोस्',
    creatingAccount: 'खाता सिर्जना गर्दै...',
    alreadyHaveAccount: 'पहिले नै खाता छ?',
    managerAccountInfo: 'प्रबन्धक खाता जानकारी',
    managerAccountDescription: 'प्रबन्धक खाताहरूमा कर्मचारी व्यवस्थापन, रोटा सिर्जना, पेरोल, र सबै प्रशासनिक सुविधाहरूमा पूर्ण पहुँच छ।',
    loginFailed: 'लगइन असफल। कृपया फेरि प्रयास गर्नुहोस्।',
    yourLocation: 'तपाईंको स्थान',
    firstName: 'नाम',
    lastName: 'थर',
    phoneNumber: 'फोन नम्बर',
    dateOfBirth: 'जन्म मिति (YYYY-MM-DD)',
    companyInfo: 'कम्पनी जानकारी',
    

    
    // Additional translations
    staffDetails: 'कर्मचारी विवरण',
    contactInformation: 'सम्पर्क जानकारी',
    address: 'ठेगाना',
    employmentDetails: 'रोजगारी विवरण',
    employeeId: 'कर्मचारी आईडी',
    startDate: 'सुरु मिति',
    branch: 'शाखा',
    workingHours: 'काम गर्ने घण्टा',
    emergencyContact: 'आपतकालीन सम्पर्क',
    viewPayslips: 'तलब पर्चा हेर्नुहोस्',
    viewTimeHistory: 'समय इतिहास हेर्नुहोस्',
    
    // Profile editing
    editProfile: 'प्रोफाइल सम्पादन',
    changePhoto: 'फोटो परिवर्तन',
    personalInformation: 'व्यक्तिगत जानकारी',
    enterFullName: 'पूरा नाम प्रविष्ट गर्नुहोस्',
    enterEmail: 'इमेल ठेगाना प्रविष्ट गर्नुहोस्',
    enterPhone: 'फोन नम्बर प्रविष्ट गर्नुहोस्',
    enterAddress: 'ठेगाना प्रविष्ट गर्नुहोस्',
    contactName: 'सम्पर्क नाम',
    enterContactName: 'सम्पर्क नाम प्रविष्ट गर्नुहोस्',
    contactPhone: 'सम्पर्क फोन',
    enterContactPhone: 'सम्पर्क फोन प्रविष्ट गर्नुहोस्',
    relationship: 'सम्बन्ध',
    enterRelationship: 'सम्बन्ध प्रविष्ट गर्नुहोस्',
    saveChanges: 'परिवर्तनहरू सेभ गर्नुहोस्',
    success: 'सफल',
    profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट गरियो',
    ok: 'ठीक छ',
    
    // Payslips
    grossPay: 'कुल तलब',
    tax: 'कर',
    nationalInsurance: 'राष्ट्रिय बीमा',
    netPay: 'शुद्ध तलब',
    view: 'हेर्नुहोस्',
    download: 'डाउनलोड',
    yearToDate: 'वर्षको मिति सम्म',
    totalGross: 'कुल सकल',
    totalNet: 'कुल शुद्ध',
    totalTax: 'कुल कर',
    totalNI: 'कुल राष्ट्रिय बीमा',
    
    // Notifications
    searchNotifications: 'सूचनाहरू खोज्नुहोस्...',
    all: 'सबै',
    unread: 'नपढिएको',
    read: 'पढिएको',
    
    // Chat
    newChat: 'नयाँ च्याट',
    searchContacts: 'सम्पर्कहरू खोज्नुहोस्...',
    
    // Location
    locationRequired: 'स्थान आवश्यक',
    locationRequiredMessage: 'क्लक-इनका लागि स्थान पहुँच आवश्यक छ। कृपया स्थान अनुमतिहरू सक्षम गर्नुहोस्।',
    enableLocation: 'स्थान सक्षम गर्नुहोस्',

    // Add Staff
    addStaffMember: 'कर्मचारी थप्नुहोस्',
    enterFirstName: 'पहिलो नाम प्रविष्ट गर्नुहोस्',
    enterLastName: 'अन्तिम नाम प्रविष्ट गर्नुहोस्',
    enterDepartment: 'विभाग प्रविष्ट गर्नुहोस्',
    supervisor: 'पर्यवेक्षक',
    mainBranch: 'मुख्य शाखा',
    secondaryBranch: 'द्वितीयक शाखा',
    remote: 'रिमोट',
    contractType: 'सम्झौताको प्रकार',
    fullTime: 'पूर्ण समय',
    partTime: 'आंशिक समय',
    contract: 'सम्झौता',
    temporary: 'अस्थायी',
    workingHoursPerWeek: 'प्रति हप्ता काम गर्ने घण्टा',
    salary: 'तलब',
    firstNameRequired: 'पहिलो नाम आवश्यक छ',
    lastNameRequired: 'अन्तिम नाम आवश्यक छ',
    emailRequired: 'इमेल आवश्यक छ',
    phoneRequired: 'फोन नम्बर आवश्यक छ',
    departmentRequired: 'विभाग आवश्यक छ',
    startDateRequired: 'सुरु मिति आवश्यक छ',
    invalidEmail: 'कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्',
    pleaseFixErrors: 'पेश गर्नु अघि त्रुटिहरू समाधान गर्नुहोस्',
    staffMemberAdded: 'कर्मचारी सफलतापूर्वक थपियो',
    accessDenied: 'पहुँच अस्वीकृत',
    managerAccessOnly: 'केवल प्रबन्धकहरूले मात्र यो सुविधा पहुँच गर्न सक्छन्',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}