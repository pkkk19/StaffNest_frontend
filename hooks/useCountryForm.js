import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const useCountryForm = (initialCountry = 'UK') => {
  const { t } = useLanguage();
  const [country, setCountry] = useState(initialCountry);
  const [countryConfig, setCountryConfig] = useState(null);

  // Country configurations for frontend
  const countryFields = {
    UK: {
      identification: {
        label: t('niNumber'),
        placeholder: 'AB123456C',
        key: 'ni_number',
        required: true
      },
      tax: {
        label: t('taxCode'),
        placeholder: '1257L',
        key: 'tax_code',
        required: true
      },
      banking: {
        label: t('sortCode'),
        placeholder: '12-34-56',
        key: 'sort_code'
      }
    },
    US: {
      identification: {
        label: t('ssn'),
        placeholder: '123-45-6789',
        key: 'ssn',
        required: true
      },
      tax: {
        label: t('filingStatus'),
        placeholder: 'single',
        key: 'filing_status',
        options: [
          { value: 'single', label: t('single') },
          { value: 'married', label: t('married') }
        ]
      },
      banking: {
        label: t('routingNumber'),
        placeholder: '021000021',
        key: 'routing_number'
      }
    },
    AU: {
      identification: {
        label: t('tfn'),
        placeholder: '123456789',
        key: 'tfn',
        required: true
      },
      tax: {
        label: t('taxScale'),
        placeholder: '2',
        key: 'tax_scale'
      },
      banking: {
        label: t('bsbCode'),
        placeholder: '123-456',
        key: 'bsb_code'
      }
    },
    NP: {
      identification: {
        label: t('panNumber'),
        placeholder: '123456789',
        key: 'pan',
        required: true
      },
      tax: {
        label: t('taxSlab'),
        placeholder: '1',
        key: 'tax_slab'
      },
      banking: {
        label: t('bankName'),
        placeholder: t('enterBankName'),
        key: 'bank_name'
      }
    },
    AE: {
      identification: {
        label: t('uaeId'),
        placeholder: '784-XXXX-XXXXXXX-X',
        key: 'uae_id',
        required: true
      },
      tax: {
        label: t('taxStatus'),
        value: 'tax_free',
        readonly: true
      },
      banking: {
        label: t('iban'),
        placeholder: 'AEXX XXXX XXXX XXXX XXXX XXX',
        key: 'iban'
      }
    }
  };

  useEffect(() => {
    setCountryConfig(countryFields[country] || countryFields.UK);
  }, [country]);

  return {
    country,
    setCountry,
    countryConfig,
    countryFields: Object.keys(countryFields)
  };
};