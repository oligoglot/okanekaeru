const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
];

const API_BASE = 'https://api.exchangerate-api.com/v4/latest';

function populateSelects() {
    const sourceSelect = document.getElementById('source');
    const intermediateSelect = document.getElementById('intermediate');
    const targetSelect = document.getElementById('target');
    
    CURRENCIES.forEach(currency => {
        const option = `<option value="${currency.code}">${currency.code} - ${currency.name}</option>`;
        sourceSelect.innerHTML += option;
        intermediateSelect.innerHTML += option;
        targetSelect.innerHTML += option;
    });
    
    // Set defaults
    sourceSelect.value = 'JPY';
    intermediateSelect.value = 'USD';
    targetSelect.value = 'INR';
}

async function fetchRates(baseCurrency) {
    const response = await fetch(`${API_BASE}/${baseCurrency}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch rates for ${baseCurrency}`);
    }
    return response.json();
}

function formatCurrency(amount, currencyCode) {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2
        }).format(amount);
    } catch {
        return `${currencyCode} ${amount.toLocaleString()}`;
    }
}

function formatRate(rate) {
    if (rate >= 1) {
        return rate.toFixed(4);
    }
    return rate.toPrecision(6);
}

function calculateTransfer(amount, sourceToTarget, sourceToIntermediate, intermediateToTarget) {
    const direct = amount * sourceToTarget;
    const viaIntermediate = amount * sourceToIntermediate * intermediateToTarget;
    return { direct, viaIntermediate };
}

async function compare() {
    const btn = document.getElementById('compare');
    const resultsDiv = document.getElementById('results');
    
    const source = document.getElementById('source').value;
    const intermediate = document.getElementById('intermediate').value;
    const target = document.getElementById('target').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    // Validation
    if (!amount || amount <= 0) {
        resultsDiv.innerHTML = '<div class="card error">Please enter a valid amount</div>';
        return;
    }
    
    if (source === target) {
        resultsDiv.innerHTML = '<div class="card error">Source and target currencies must be different</div>';
        return;
    }
    
    if (source === intermediate || intermediate === target) {
        resultsDiv.innerHTML = '<div class="card error">Intermediate currency must be different from source and target</div>';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Fetching rates...';
    resultsDiv.innerHTML = '<div class="card loading">Loading exchange rates...</div>';
    
    try {
        const [sourceRates, intermediateRates] = await Promise.all([
            fetchRates(source),
            fetchRates(intermediate)
        ]);
        
        const sourceToTarget = sourceRates.rates[target];
        const sourceToIntermediate = sourceRates.rates[intermediate];
        const intermediateToTarget = intermediateRates.rates[target];
        
        const { direct, viaIntermediate } = calculateTransfer(
            amount, sourceToTarget, sourceToIntermediate, intermediateToTarget
        );
        
        const directWins = direct >= viaIntermediate;
        const difference = Math.abs(direct - viaIntermediate);
        const percentDiff = (difference / Math.min(direct, viaIntermediate) * 100).toFixed(2);
        
        const timestamp = new Date(sourceRates.time_last_updated * 1000);
        
        resultsDiv.innerHTML = `
            <div class="card">
                <h3 style="margin-bottom: 16px; color: #333;">Current Exchange Rates</h3>
                <div class="rates">
                    <div class="rate-box">
                        <div class="label">${source} → ${intermediate}</div>
                        <div class="value">${formatRate(sourceToIntermediate)}</div>
                    </div>
                    <div class="rate-box">
                        <div class="label">${source} → ${target}</div>
                        <div class="value">${formatRate(sourceToTarget)}</div>
                    </div>
                    <div class="rate-box">
                        <div class="label">${intermediate} → ${target}</div>
                        <div class="value">${formatRate(intermediateToTarget)}</div>
                    </div>
                </div>
                
                <div class="result ${directWins ? 'winner' : 'loser'}">
                    <h3>
                        Option 1: ${source} → ${target} (Direct)
                        ${directWins ? '<span class="badge">BETTER</span>' : ''}
                    </h3>
                    <div class="amount">${formatCurrency(direct, target)}</div>
                    <div class="detail">
                        ${formatCurrency(amount, source)} × ${formatRate(sourceToTarget)}
                    </div>
                </div>
                
                <div class="result ${!directWins ? 'winner' : 'loser'}">
                    <h3>
                        Option 2: ${source} → ${intermediate} → ${target}
                        ${!directWins ? '<span class="badge">BETTER</span>' : ''}
                    </h3>
                    <div class="amount">${formatCurrency(viaIntermediate, target)}</div>
                    <div class="detail">
                        ${formatCurrency(amount, source)} → ${formatCurrency(amount * sourceToIntermediate, intermediate)} → ${target}
                    </div>
                </div>
                
                <div class="difference">
                    <div>Difference</div>
                    <div class="value">${formatCurrency(difference, target)} (${percentDiff}%)</div>
                </div>
                
                <div class="timestamp">
                    Rates as of: ${timestamp.toLocaleString()}
                </div>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="card error">Error fetching rates: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Compare Transfer Options';
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateTransfer, formatRate, formatCurrency, CURRENCIES };
}

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        populateSelects();
    });
}
