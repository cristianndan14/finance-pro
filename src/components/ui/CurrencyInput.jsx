import React from 'react';
import { NumericFormat } from 'react-number-format';

export default function CurrencyInput({
    value,
    onChange,
    placeholder = "0.00",
    disabled = false,
    required = false,
    className = '',
    allowNegative = false
}) {
    return (
        <NumericFormat
            value={value}
            onValueChange={(values) => {
                const { floatValue } = values;
                // Devolver floatValue o string vacío si está vacío
                onChange(floatValue !== undefined ? floatValue : '');
            }}
            prefix="$ "
            thousandSeparator=","
            decimalSeparator="."
            decimalScale={2}
            // fixedDecimalScale={} lo evitamos para que no fuerce .00 mientras se tipea
            allowNegative={allowNegative}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
    );
}
