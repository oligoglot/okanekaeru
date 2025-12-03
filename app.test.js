const { calculateTransfer, formatRate, formatCurrency, CURRENCIES } = require('./app.js');

describe('calculateTransfer', () => {
    test('calculates direct and intermediate transfers correctly', () => {
        const amount = 1000000;
        const sourceToTarget = 0.5678;
        const sourceToIntermediate = 0.0067;
        const intermediateToTarget = 84.5;

        const result = calculateTransfer(amount, sourceToTarget, sourceToIntermediate, intermediateToTarget);

        expect(result.direct).toBeCloseTo(567800, 2);
        expect(result.viaIntermediate).toBeCloseTo(566150, 2);
    });

    test('handles small amounts', () => {
        const result = calculateTransfer(100, 0.5, 0.01, 50);

        expect(result.direct).toBe(50);
        expect(result.viaIntermediate).toBe(50);
    });

    test('handles zero amount', () => {
        const result = calculateTransfer(0, 0.5, 0.01, 50);

        expect(result.direct).toBe(0);
        expect(result.viaIntermediate).toBe(0);
    });

    test('intermediate path can be better than direct', () => {
        const result = calculateTransfer(1000, 0.4, 0.01, 50);

        expect(result.direct).toBe(400);
        expect(result.viaIntermediate).toBe(500);
        expect(result.viaIntermediate).toBeGreaterThan(result.direct);
    });

    test('direct path can be better than intermediate', () => {
        const result = calculateTransfer(1000, 0.6, 0.01, 50);

        expect(result.direct).toBe(600);
        expect(result.viaIntermediate).toBe(500);
        expect(result.direct).toBeGreaterThan(result.viaIntermediate);
    });
});

describe('formatRate', () => {
    test('formats rates >= 1 with 4 decimal places', () => {
        expect(formatRate(84.5678)).toBe('84.5678');
        expect(formatRate(1.2345)).toBe('1.2345');
        expect(formatRate(100)).toBe('100.0000');
    });

    test('formats rates < 1 with 6 significant figures', () => {
        expect(formatRate(0.00672)).toBe('0.00672000');
        expect(formatRate(0.123456)).toBe('0.123456');
    });
});

describe('formatCurrency', () => {
    test('formats USD correctly', () => {
        const result = formatCurrency(1234.56, 'USD');
        expect(result).toContain('1,234.56');
    });

    test('formats JPY without decimals', () => {
        const result = formatCurrency(1234567, 'JPY');
        expect(result).toContain('1,234,567');
        expect(result).not.toContain('.');
    });

    test('formats INR correctly', () => {
        const result = formatCurrency(1234.56, 'INR');
        expect(result).toContain('1,234.56');
    });

    test('handles large amounts', () => {
        const result = formatCurrency(15000000, 'JPY');
        expect(result).toContain('15,000,000');
    });
});

describe('CURRENCIES', () => {
    test('contains common currencies', () => {
        const codes = CURRENCIES.map(c => c.code);
        
        expect(codes).toContain('USD');
        expect(codes).toContain('EUR');
        expect(codes).toContain('GBP');
        expect(codes).toContain('JPY');
        expect(codes).toContain('INR');
    });

    test('all currencies have required fields', () => {
        CURRENCIES.forEach(currency => {
            expect(currency).toHaveProperty('code');
            expect(currency).toHaveProperty('name');
            expect(currency).toHaveProperty('symbol');
            expect(currency.code).toHaveLength(3);
        });
    });

    test('has at least 20 currencies', () => {
        expect(CURRENCIES.length).toBeGreaterThanOrEqual(20);
    });
});
