/**
 * NOCTIS DICE - Probability & Statistics Engine
 * Complete statistical analysis with Chi-Square test
 * Version: 2.0 | Dark Theme Edition
 */

class StatisticsEngine {
    constructor() {
        this.rolls = this.loadHistory();
        this.initializeEvents();
        this.updateAll();
    }

    // ==================== DATA PERSISTENCE ====================
    
    loadHistory() {
        const saved = localStorage.getItem('noctisDiceRolls');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveHistory() {
        localStorage.setItem('noctisDiceRolls', JSON.stringify(this.rolls.slice(-200)));
    }

    // ==================== STATISTICAL CALCULATIONS ====================
    
    getFrequency() {
        const freq = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
        for (let roll of this.rolls) {
            if (freq[roll] !== undefined) freq[roll]++;
        }
        return freq;
    }

    getTotal() {
        return this.rolls.length;
    }

    calculateMean() {
        if (this.rolls.length === 0) return null;
        const sum = this.rolls.reduce((a, b) => a + b, 0);
        return sum / this.rolls.length;
    }

    calculateVariance() {
        if (this.rolls.length < 2) return null;
        const mean = this.calculateMean();
        const squaredDiffs = this.rolls.map(x => Math.pow(x - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / (this.rolls.length - 1);
    }

    calculateStdDev() {
        const variance = this.calculateVariance();
        return variance !== null ? Math.sqrt(variance) : null;
    }

    calculateMarginError() {
        if (this.rolls.length < 2) return null;
        const stdDev = this.calculateStdDev();
        return 1.96 * (stdDev / Math.sqrt(this.rolls.length));
    }

    getEmpiricalProbs() {
        const total = this.getTotal();
        if (total === 0) {
            return {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
        }
        const freq = this.getFrequency();
        return {
            1: freq[1] / total,
            2: freq[2] / total,
            3: freq[3] / total,
            4: freq[4] / total,
            5: freq[5] / total,
            6: freq[6] / total
        };
    }

    // ==================== CHI-SQUARE GOODNESS-OF-FIT TEST ====================
    
    calculateChiSquare() {
        const total = this.getTotal();
        if (total === 0) return null;
        
        const expected = total / 6;
        const freq = this.getFrequency();
        
        let chiSquare = 0;
        for (let i = 1; i <= 6; i++) {
            const observed = freq[i];
            const diff = observed - expected;
            chiSquare += (diff * diff) / expected;
        }
        return chiSquare;
    }

    approximatePValue(chiSquare) {
        if (chiSquare === null || chiSquare < 0) return null;
        if (chiSquare > 20) return 0.001;
        if (chiSquare < 0.1) return 0.99;
        // Chi-square distribution approximation for df=5
        return Math.exp(-chiSquare / 2.2) * 0.6;
    }

    // ==================== CORE ACTIONS ====================
    
    addRoll(value) {
        this.rolls.push(value);
        this.saveHistory();
        this.updateAll();
        
        const currentSpan = document.getElementById('currentRollValue');
        if (currentSpan) {
            currentSpan.style.animation = 'gentlePulse 0.2s ease';
            setTimeout(() => {
                if (currentSpan) currentSpan.style.animation = '';
            }, 200);
        }
    }

    resetSession() {
        this.rolls = [];
        this.saveHistory();
        this.updateAll();
        
        const dice = document.getElementById('magicDice');
        if (dice) dice.setAttribute('data-value', '1');
        
        const currentSpan = document.getElementById('currentRollValue');
        if (currentSpan) currentSpan.innerText = '—';
    }

    // ==================== UI RENDERING ====================
    
    renderEmpiricalBars() {
        const container = document.getElementById('empiricalBars');
        if (!container) return;
        
        const probs = this.getEmpiricalProbs();
        const total = this.getTotal();
        container.innerHTML = '';
        
        for (let i = 1; i <= 6; i++) {
            const percent = (probs[i] * 100).toFixed(1);
            const barDiv = document.createElement('div');
            barDiv.className = 'bar-item';
            barDiv.innerHTML = `
                <div class="bar-label">${i}</div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${percent}%;">${total > 0 ? percent + '%' : '-'}</div>
                </div>
            `;
            container.appendChild(barDiv);
        }
    }

    renderHistogram() {
        const container = document.getElementById('histogram');
        if (!container) return;
        
        const freq = this.getFrequency();
        const maxFreq = Math.max(...Object.values(freq), 1);
        container.innerHTML = '';
        
        for (let i = 1; i <= 6; i++) {
            const count = freq[i];
            const height = maxFreq > 0 ? (count / maxFreq) * 130 : 0;
            const bar = document.createElement('div');
            bar.className = 'hist-bar';
            bar.innerHTML = `
                <div class="hist-rect" style="height: ${Math.max(height, 4)}px;"></div>
                <div class="hist-label">${i}<br>(${count})</div>
            `;
            container.appendChild(bar);
        }
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        const countSpan = document.getElementById('historyCount');
        
        if (!container) return;
        
        const totalRolls = this.getTotal();
        if (countSpan) {
            countSpan.innerText = totalRolls > 0 ? `(last ${Math.min(20, totalRolls)} of ${totalRolls})` : '(no rolls yet)';
        }
        
        if (this.rolls.length === 0) {
            container.innerHTML = '<div style="color: #7a88a5; padding: 0.5rem;">✨ no rolls yet — tap the dice to begin ✨</div>';
            return;
        }
        
        const recent = [...this.rolls].slice(-20).reverse();
        container.innerHTML = recent.map(r => `<div class="history-badge">🎲 ${r}</div>`).join('');
    }

    updateStats() {
        document.getElementById('totalRolls').innerText = this.getTotal();
        
        const mean = this.calculateMean();
        document.getElementById('sampleMean').innerText = mean !== null ? mean.toFixed(4) : '—';
        
        const variance = this.calculateVariance();
        document.getElementById('variance').innerText = variance !== null ? variance.toFixed(4) : '—';
        
        const stdDev = this.calculateStdDev();
        document.getElementById('stdDev').innerText = stdDev !== null ? stdDev.toFixed(4) : '—';
        
        const margin = this.calculateMarginError();
        document.getElementById('marginError').innerText = margin !== null ? `±${margin.toFixed(4)}` : '—';
        
        this.updateChiSquare();
    }

    updateChiSquare() {
        const chiSquare = this.calculateChiSquare();
        const chiEl = document.getElementById('chiSquareValue');
        const pEl = document.getElementById('pValue');
        const conclusionEl = document.getElementById('chiConclusion');
        
        const CRITICAL = 11.070;
        
        if (chiSquare !== null && this.getTotal() > 0) {
            chiEl.innerText = chiSquare.toFixed(4);
            const pValue = this.approximatePValue(chiSquare);
            pEl.innerText = pValue.toFixed(5);
            
            if (chiSquare < CRITICAL) {
                conclusionEl.innerHTML = '✓ NULL HYPOTHESIS ACCEPTED: The die appears FAIR (no significant deviation from theoretical distribution)';
                conclusionEl.style.background = 'rgba(70, 110, 70, 0.25)';
                conclusionEl.style.color = '#b8e0b8';
                conclusionEl.style.border = '1px solid rgba(120, 180, 100, 0.3)';
            } else {
                conclusionEl.innerHTML = '⚠️ NULL HYPOTHESIS REJECTED: The die may be BIASED (significant difference from expected frequencies detected)';
                conclusionEl.style.background = 'rgba(130, 70, 60, 0.25)';
                conclusionEl.style.color = '#e8c0b8';
                conclusionEl.style.border = '1px solid rgba(200, 100, 80, 0.3)';
            }
        } else {
            chiEl.innerText = '—';
            pEl.innerText = '—';
            conclusionEl.innerHTML = 'roll at least once to perform chi-square goodness-of-fit test';
            conclusionEl.style.background = 'rgba(45, 48, 75, 0.5)';
            conclusionEl.style.color = '#9eacc9';
            conclusionEl.style.border = '1px solid rgba(200, 180, 140, 0.15)';
        }
    }

    updateAll() {
        this.updateStats();
        this.renderEmpiricalBars();
        this.renderHistogram();
        this.renderHistory();
    }

    // ==================== EVENT HANDLERS ====================
    
    performRoll() {
        const newRoll = Math.floor(Math.random() * 6) + 1;
        this.addRoll(newRoll);
        
        const dice = document.getElementById('magicDice');
        if (dice) {
            dice.classList.add('roll-animation');
            dice.setAttribute('data-value', newRoll);
            setTimeout(() => {
                dice.classList.remove('roll-animation');
            }, 400);
        }
        
        const currentSpan = document.getElementById('currentRollValue');
        if (currentSpan) {
            currentSpan.innerText = newRoll;
        }
    }

    initializeEvents() {
        const rollBtn = document.getElementById('rollButton');
        const dice = document.getElementById('magicDice');
        const clearBtn = document.getElementById('clearHistoryBtn');
        
        if (rollBtn) rollBtn.addEventListener('click', () => this.performRoll());
        if (dice) dice.addEventListener('click', () => this.performRoll());
        if (clearBtn) clearBtn.addEventListener('click', () => this.resetSession());
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StatisticsEngine();
});