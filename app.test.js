const { 
    calculateTransfer, 
    formatRate, 
    formatCurrency, 
    CURRENCIES,
    analyzetrend,
    generateSchedule
} = require('./app.js');

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

describe('analyzetrend', () => {
    test('detects upward trend', () => {
        const rates = {
            '2024-01-01': 80,
            '2024-01-02': 82,
            '2024-01-03': 85,
            '2024-01-04': 88,
            '2024-01-05': 90
        };
        const result = analyzetrend(rates);
        expect(result.direction).toBe('up');
        expect(result.change).toBeGreaterThan(0);
    });

    test('detects downward trend', () => {
        const rates = {
            '2024-01-01': 90,
            '2024-01-02': 88,
            '2024-01-03': 85,
            '2024-01-04': 82,
            '2024-01-05': 80
        };
        const result = analyzetrend(rates);
        expect(result.direction).toBe('down');
        expect(result.change).toBeLessThan(0);
    });

    test('detects stable trend', () => {
        const rates = {
            '2024-01-01': 85.0,
            '2024-01-02': 85.1,
            '2024-01-03': 84.9,
            '2024-01-04': 85.2,
            '2024-01-05': 85.0
        };
        const result = analyzetrend(rates);
        expect(result.direction).toBe('stable');
    });

    test('calculates min, max, and average', () => {
        const rates = {
            '2024-01-01': 80,
            '2024-01-02': 90,
            '2024-01-03': 100
        };
        const result = analyzetrend(rates);
        expect(result.min).toBe(80);
        expect(result.max).toBe(100);
        expect(result.avg).toBe(90);
    });

    test('calculates volatility', () => {
        const rates = {
            '2024-01-01': 80,
            '2024-01-02': 90,
            '2024-01-03': 100
        };
        const result = analyzetrend(rates);
        expect(result.volatility).toBeCloseTo(22.22, 1);
    });

    test('handles single value', () => {
        const rates = { '2024-01-01': 85 };
        const result = analyzetrend(rates);
        expect(result.direction).toBe('stable');
        expect(result.change).toBe(0);
    });
});

describe('generateSchedule', () => {
    test('generates correct number of transfers based on cap', () => {
        const amount = 15000000;
        const sourceToIntermediate = 0.0067;
        const transferCap = 10000;
        const spreadDays = 30;
        
        const result = generateSchedule(amount, sourceToIntermediate, transferCap, spreadDays, {}, 'JPY', 'USD');
        
        const totalInIntermediate = amount * sourceToIntermediate;
        const expectedTransfers = Math.ceil(totalInIntermediate / transferCap);
        
        expect(result.numTransfers).toBe(expectedTransfers);
        expect(result.schedule.length).toBe(expectedTransfers);
    });

    test('last transfer handles remaining amount', () => {
        const amount = 1500000;
        const sourceToIntermediate = 0.01;
        const transferCap = 10000;
        const spreadDays = 30;
        
        const result = generateSchedule(amount, sourceToIntermediate, transferCap, spreadDays, {}, 'JPY', 'USD');
        
        const totalIntermediate = result.schedule.reduce((sum, t) => sum + t.intermediateAmount, 0);
        expect(totalIntermediate).toBeCloseTo(amount * sourceToIntermediate, 2);
    });

    test('schedule spreads transfers across days', () => {
        const result = generateSchedule(10000000, 0.01, 10000, 30, {}, 'JPY', 'USD');
        
        expect(result.daysBetweenTransfers).toBeGreaterThanOrEqual(1);
    });

    test('handles exact cap multiple', () => {
        const amount = 1000000;
        const sourceToIntermediate = 0.01;
        const transferCap = 5000;
        
        const result = generateSchedule(amount, sourceToIntermediate, transferCap, 30, {}, 'JPY', 'USD');
        
        expect(result.numTransfers).toBe(2);
        expect(result.schedule[0].intermediateAmount).toBe(5000);
        expect(result.schedule[1].intermediateAmount).toBe(5000);
    });

    test('marks first transfer as not last', () => {
        const result = generateSchedule(10000000, 0.01, 10000, 30, {}, 'JPY', 'USD');
        
        expect(result.schedule[0].isLast).toBe(false);
        expect(result.schedule[result.schedule.length - 1].isLast).toBe(true);
    });

    test('single transfer when amount is under cap', () => {
        const result = generateSchedule(500000, 0.01, 10000, 30, {}, 'JPY', 'USD');
        
        expect(result.numTransfers).toBe(1);
        expect(result.schedule[0].isLast).toBe(true);
    });
});
