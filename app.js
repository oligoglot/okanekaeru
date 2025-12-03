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
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
];

const API_LATEST = 'https://api.exchangerate-api.com/v4/latest';
const API_HISTORY = 'https://api.frankfurter.app';

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
    
    sourceSelect.value = 'JPY';
    intermediateSelect.value = 'USD';
    targetSelect.value = 'INR';
}

async function fetchCurrentRates(baseCurrency) {
    const response = await fetch(`${API_LATEST}/${baseCurrency}`);
    if (!response.ok) throw new Error(`Failed to fetch rates for ${baseCurrency}`);
    return response.json();
}

async function fetchHistoricalRates(base, target, days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    const url = `${API_HISTORY}/${formatDate(startDate)}..${formatDate(endDate)}?from=${base}&to=${target}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch historical rates`);
    return response.json();
}

function formatCurrency(amount, currencyCode) {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: ['JPY', 'KRW', 'VND', 'IDR'].includes(currencyCode) ? 0 : 2
        }).format(amount);
    } catch {
        return `${currencyCode} ${amount.toLocaleString()}`;
    }
}

function formatRate(rate) {
    if (rate >= 1) return rate.toFixed(4);
    return rate.toPrecision(6);
}

function calculateTransfer(amount, sourceToTarget, sourceToIntermediate, intermediateToTarget) {
    const direct = amount * sourceToTarget;
    const viaIntermediate = amount * sourceToIntermediate * intermediateToTarget;
    return { direct, viaIntermediate };
}

function analyzetrend(rates) {
    const values = Object.values(rates);
    if (values.length < 2) return { direction: 'stable', change: 0 };
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    const recentValues = values.slice(-7);
    const recentFirst = recentValues[0];
    const recentLast = recentValues[recentValues.length - 1];
    const recentChange = ((recentLast - recentFirst) / recentFirst) * 100;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const volatility = ((max - min) / avg) * 100;
    
    let direction = 'stable';
    if (change > 1) direction = 'up';
    else if (change < -1) direction = 'down';
    
    return { 
        direction, 
        change, 
        recentChange,
        avg, 
        min, 
        max, 
        volatility,
        current: last,
        values
    };
}

function generateSchedule(amount, sourceToIntermediate, transferCap, spreadDays, trend, source, intermediate) {
    const totalInIntermediate = amount * sourceToIntermediate;
    const numTransfers = Math.ceil(totalInIntermediate / transferCap);
    const actualTransfersNeeded = numTransfers;
    
    const daysBetweenTransfers = Math.max(1, Math.floor(spreadDays / numTransfers));
    
    const schedule = [];
    let remainingSource = amount;
    let remainingIntermediate = totalInIntermediate;
    
    for (let i = 0; i < numTransfers; i++) {
        const isLast = i === numTransfers - 1;
        const intermediateAmount = isLast ? remainingIntermediate : transferCap;
        const sourceAmount = isLast ? remainingSource : transferCap / sourceToIntermediate;
        
        const date = new Date();
        date.setDate(date.getDate() + (i * daysBetweenTransfers));
        
        schedule.push({
            day: i + 1,
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            sourceAmount,
            intermediateAmount,
            isLast
        });
        
        remainingSource -= sourceAmount;
        remainingIntermediate -= intermediateAmount;
    }
    
    return {
        schedule,
        numTransfers,
        daysBetweenTransfers,
        totalInIntermediate
    };
}

function createSVGChart(directRates, intermediateRates, source, intermediate, target) {
    const directValues = Object.entries(directRates).map(([date, val]) => ({ date, value: val }));
    const intermediateValues = Object.entries(intermediateRates).map(([date, val]) => ({ date, value: val }));
    
    const width = 700;
    const height = 180;
    const padding = { top: 20, right: 60, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const allDirectValues = directValues.map(d => d.value);
    const directMin = Math.min(...allDirectValues);
    const directMax = Math.max(...allDirectValues);
    const directRange = directMax - directMin || 1;
    
    const allIntermediateValues = intermediateValues.map(d => d.value);
    const intMin = Math.min(...allIntermediateValues);
    const intMax = Math.max(...allIntermediateValues);
    const intRange = intMax - intMin || 1;
    
    const scaleX = (i, total) => padding.left + (i / (total - 1)) * chartWidth;
    const scaleYDirect = (v) => padding.top + chartHeight - ((v - directMin) / directRange) * chartHeight;
    const scaleYInt = (v) => padding.top + chartHeight - ((v - intMin) / intRange) * chartHeight;
    
    let directPath = `M ${scaleX(0, directValues.length)} ${scaleYDirect(directValues[0].value)}`;
    directValues.forEach((d, i) => {
        if (i > 0) directPath += ` L ${scaleX(i, directValues.length)} ${scaleYDirect(d.value)}`;
    });
    
    let intPath = `M ${scaleX(0, intermediateValues.length)} ${scaleYInt(intermediateValues[0].value)}`;
    intermediateValues.forEach((d, i) => {
        if (i > 0) intPath += ` L ${scaleX(i, intermediateValues.length)} ${scaleYInt(d.value)}`;
    });
    
    const firstDate = directValues[0]?.date || '';
    const lastDate = directValues[directValues.length - 1]?.date || '';
    
    return `
        <svg viewBox="0 0 ${width} ${height}" class="chart">
            <defs>
                <linearGradient id="directGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#667eea;stop-opacity:0" />
                </linearGradient>
                <linearGradient id="intGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#e91e63;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#e91e63;stop-opacity:0" />
                </linearGradient>
            </defs>
            
            <!-- Grid lines -->
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="1"/>
            <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="1"/>
            
            <!-- Direct rate line -->
            <path d="${directPath}" fill="none" stroke="#667eea" stroke-width="2.5"/>
            
            <!-- Intermediate rate line -->
            <path d="${intPath}" fill="none" stroke="#e91e63" stroke-width="2.5" stroke-dasharray="5,3"/>
            
            <!-- Labels -->
            <text x="${padding.left - 5}" y="${padding.top + 5}" text-anchor="end" font-size="10" fill="#667eea">${formatRate(directMax)}</text>
            <text x="${padding.left - 5}" y="${height - padding.bottom}" text-anchor="end" font-size="10" fill="#667eea">${formatRate(directMin)}</text>
            
            <text x="${width - padding.right + 5}" y="${padding.top + 5}" text-anchor="start" font-size="10" fill="#e91e63">${formatRate(intMax)}</text>
            <text x="${width - padding.right + 5}" y="${height - padding.bottom}" text-anchor="start" font-size="10" fill="#e91e63">${formatRate(intMin)}</text>
            
            <text x="${padding.left}" y="${height - 5}" text-anchor="start" font-size="10" fill="#999">${firstDate}</text>
            <text x="${width - padding.right}" y="${height - 5}" text-anchor="end" font-size="10" fill="#999">${lastDate}</text>
        </svg>
        <div class="chart-legend">
            <div class="legend-item">
                <div class="legend-dot" style="background: #667eea;"></div>
                <span>${source} → ${target} (direct)</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot" style="background: #e91e63;"></div>
                <span>${source} → ${intermediate} (to convert)</span>
            </div>
        </div>
    `;
}

function getTrendIcon(direction) {
    if (direction === 'up') return '↑';
    if (direction === 'down') return '↓';
    return '→';
}

function getRecommendation(directTrend, intermediateTrend, directWins) {
    const recommendations = [];
    
    if (directWins) {
        recommendations.push("📊 <strong>Direct transfer is currently better.</strong>");
    } else {
        recommendations.push("📊 <strong>Intermediate currency transfer is currently better.</strong>");
    }
    
    if (directTrend.direction === 'up') {
        recommendations.push("📈 Direct rate is trending up - good time to transfer directly if possible.");
    } else if (directTrend.direction === 'down') {
        recommendations.push("📉 Direct rate is trending down - consider waiting or using intermediate currency.");
    }
    
    if (directTrend.volatility > 3) {
        recommendations.push("⚠️ High volatility detected. Spreading transfers over time reduces risk.");
    } else {
        recommendations.push("✅ Low volatility - rates are relatively stable.");
    }
    
    return recommendations.join('<br>');
}

async function analyze() {
    const btn = document.getElementById('analyze');
    const resultsDiv = document.getElementById('results');
    
    const source = document.getElementById('source').value;
    const intermediate = document.getElementById('intermediate').value;
    const target = document.getElementById('target').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transferCap = parseFloat(document.getElementById('transferCap').value);
    const spreadDays = parseInt(document.getElementById('spreadDays').value);
    const historyDays = parseInt(document.getElementById('historyDays').value);
    
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
    btn.textContent = 'Analyzing...';
    resultsDiv.innerHTML = '<div class="card loading">Fetching current and historical rates...</div>';
    
    try {
        const [sourceRates, intermediateRates, directHistory, sourceToIntHistory] = await Promise.all([
            fetchCurrentRates(source),
            fetchCurrentRates(intermediate),
            fetchHistoricalRates(source, target, historyDays),
            fetchHistoricalRates(source, intermediate, historyDays)
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
        
        const directRatesFlat = {};
        Object.entries(directHistory.rates).forEach(([date, rates]) => {
            directRatesFlat[date] = rates[target];
        });
        
        const intermediateRatesFlat = {};
        Object.entries(sourceToIntHistory.rates).forEach(([date, rates]) => {
            intermediateRatesFlat[date] = rates[intermediate];
        });
        
        const directTrend = analyzetrend(directRatesFlat);
        const intermediateTrend = analyzetrend(intermediateRatesFlat);
        
        const scheduleData = generateSchedule(
            amount, sourceToIntermediate, transferCap, spreadDays, intermediateTrend, source, intermediate
        );
        
        const chartSVG = createSVGChart(directRatesFlat, intermediateRatesFlat, source, intermediate, target);
        
        const timestamp = new Date(sourceRates.time_last_updated * 1000);
        
        resultsDiv.innerHTML = `
            <div class="card">
                <div class="tabs">
                    <button class="tab active" onclick="switchTab('comparison')">Rate Comparison</button>
                    <button class="tab" onclick="switchTab('trends')">Trends & Analysis</button>
                    <button class="tab" onclick="switchTab('schedule')">Transfer Schedule</button>
                </div>
                
                <div id="comparison" class="tab-content active">
                    <h2>Current Exchange Rates</h2>
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
                        <div class="detail">${formatCurrency(amount, source)} × ${formatRate(sourceToTarget)}</div>
                    </div>
                    
                    <div class="result ${!directWins ? 'winner' : 'loser'}">
                        <h3>
                            Option 2: ${source} → ${intermediate} → ${target}
                            ${!directWins ? '<span class="badge">BETTER</span>' : ''}
                        </h3>
                        <div class="amount">${formatCurrency(viaIntermediate, target)}</div>
                        <div class="detail">${formatCurrency(amount, source)} → ${formatCurrency(amount * sourceToIntermediate, intermediate)} → ${target}</div>
                    </div>
                    
                    <div class="difference">
                        <div>Difference</div>
                        <div class="value">${formatCurrency(difference, target)} (${percentDiff}%)</div>
                    </div>
                </div>
                
                <div id="trends" class="tab-content">
                    <h2>Historical Trends (${historyDays} days)</h2>
                    <div class="chart-container">
                        ${chartSVG}
                    </div>
                    
                    <div class="rates" style="margin-top: 20px;">
                        <div class="rate-box">
                            <div class="label">${source} → ${target} Trend</div>
                            <div class="value">
                                <span class="trend ${directTrend.direction}">
                                    ${getTrendIcon(directTrend.direction)} ${directTrend.change.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div class="rate-box">
                            <div class="label">Volatility</div>
                            <div class="value">${directTrend.volatility.toFixed(2)}%</div>
                        </div>
                        <div class="rate-box">
                            <div class="label">Range</div>
                            <div class="value">${formatRate(directTrend.min)} - ${formatRate(directTrend.max)}</div>
                        </div>
                    </div>
                    
                    <div class="schedule-summary">
                        <h4>💡 Recommendation</h4>
                        <p>${getRecommendation(directTrend, intermediateTrend, directWins)}</p>
                    </div>
                </div>
                
                <div id="schedule" class="tab-content">
                    <h2>Transfer Schedule</h2>
                    <p style="color: #666; margin-bottom: 16px;">
                        Based on ${formatCurrency(transferCap, intermediate)} cap per transfer, 
                        you need <strong>${scheduleData.numTransfers} transfers</strong> over ${spreadDays} days.
                    </p>
                    
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Send (${source})</th>
                                <th>Convert to (${intermediate})</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scheduleData.schedule.map((item, i) => `
                                <tr class="${i === 0 ? 'highlight' : ''}">
                                    <td>${item.day}</td>
                                    <td>${item.date}${i === 0 ? ' <span class="badge" style="background: #1565c0;">Next</span>' : ''}</td>
                                    <td>${formatCurrency(item.sourceAmount, source)}</td>
                                    <td>${formatCurrency(item.intermediateAmount, intermediate)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="schedule-summary">
                        <h4>📋 Summary</h4>
                        <p>
                            <strong>Total to send:</strong> ${formatCurrency(amount, source)}<br>
                            <strong>Total in ${intermediate}:</strong> ${formatCurrency(scheduleData.totalInIntermediate, intermediate)}<br>
                            <strong>Transfers:</strong> ${scheduleData.numTransfers} (every ~${scheduleData.daysBetweenTransfers} days)<br>
                            <strong>Cap per transfer:</strong> ${formatCurrency(transferCap, intermediate)}
                        </p>
                    </div>
                </div>
                
                <div class="timestamp">Rates as of: ${timestamp.toLocaleString()}</div>
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="card error">Error: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Analyze & Plan Transfers';
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        calculateTransfer, 
        formatRate, 
        formatCurrency, 
        CURRENCIES,
        analyzetrend,
        generateSchedule
    };
}

// Initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        populateSelects();
    });
}
