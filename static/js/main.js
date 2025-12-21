/**
 * Main JavaScript Module
 * Mengkoordinasikan semua modul dan menangani interaksi user
 */

// Note: currentSelectedLA is declared in map.js to avoid duplicate declaration

// Make sure functions are available immediately (not waiting for DOMContentLoaded)
// These functions are called from inline HTML handlers

/**
 * Update year from slider
 */
function updateYear(year) {
    if (typeof config === 'undefined') {
        console.error('Config not loaded yet');
        return;
    }
    
    config.currentYear = parseInt(year);
    const yearDisplay = document.getElementById('year-display');
    if (yearDisplay) {
        yearDisplay.textContent = year;
    }
    
    // Update map
    if (typeof mapModule !== 'undefined' && mapModule.updateMap) {
        mapModule.updateMap(config.currentYear, config.selectedMapBenefitTypes || config.benefitTypes);
    } else if (typeof updateMap === 'function') {
        updateMap(config.currentYear, config.selectedMapBenefitTypes || config.benefitTypes);
    }
    
    // Update charts
    updateChart();
}

/**
 * Update benefit types for map (from checkboxes)
 */
function updateMapBenefitTypes() {
    if (typeof config === 'undefined') {
        console.error('Config not loaded yet');
        return;
    }
    
    // Get selected benefit types from map checkboxes
    const checkboxes = document.querySelectorAll('.map-benefit-checkbox:checked');
    if (checkboxes.length > 0) {
        config.selectedMapBenefitTypes = Array.from(checkboxes).map(cb => cb.value);
    } else {
        // If no checkbox selected, use empty array (don't auto-check)
        config.selectedMapBenefitTypes = [];
    }
    
    console.log('Map benefit types updated:', config.selectedMapBenefitTypes);
    
    // Update map
    if (typeof mapModule !== 'undefined' && mapModule.updateMap) {
        mapModule.updateMap(config.currentYear, config.selectedMapBenefitTypes);
    } else if (typeof updateMap === 'function') {
        updateMap(config.currentYear, config.selectedMapBenefitTypes);
    }
}

/**
 * Update selected local authority
 */
function updateLocalAuthority(localAuthority) {
    if (typeof config === 'undefined') {
        console.error('Config not loaded yet');
        return;
    }
    
    config.currentLocalAuthority = localAuthority;
    
    // Update currentSelectedLA in map module
    if (typeof window !== 'undefined') {
        window.currentSelectedLA = localAuthority;
    }
    
    // Highlight area on map (without panning - user must click focus button to pan)
    if (typeof highlightAreaByName === 'function') {
        highlightAreaByName(localAuthority, false);
    } else if (typeof mapModule !== 'undefined' && mapModule.highlightAreaByName) {
        mapModule.highlightAreaByName(localAuthority, false);
    }
    
    // Show focus button
    const focusButton = document.getElementById('focus-button');
    if (focusButton) {
        focusButton.style.display = 'block';
    }
    
    updateChart();
}

/**
 * Update chart based on current selections
 */
function updateChart() {
    if (typeof config === 'undefined') {
        console.error('Config not loaded yet');
        return;
    }
    
    // Get selected benefit types from chart checkboxes
    const checkboxes = document.querySelectorAll('.benefit-checkbox:checked');
    if (checkboxes.length > 0) {
        config.selectedBenefitTypes = Array.from(checkboxes).map(cb => cb.value);
    } else {
        // If no checkbox selected, use empty array (don't auto-check)
        config.selectedBenefitTypes = [];
    }
    
    // Reload chart data
    if (typeof chartsModule !== 'undefined' && chartsModule.loadChartData) {
        chartsModule.loadChartData();
    } else if (typeof loadChartData === 'function') {
        loadChartData();
    }
}

// Make functions globally available immediately
window.updateYear = updateYear;
window.updateMapBenefitTypes = updateMapBenefitTypes;
window.updateLocalAuthority = updateLocalAuthority;
window.updateChart = updateChart;

/**
 * Initialize application after config is loaded
 */
function initializeApp() {
    if (!config) {
        console.error('Config not available');
        return;
    }
    
    // Initialize map
    if (typeof mapModule !== 'undefined' && mapModule.initMap) {
        mapModule.initMap();
    } else if (typeof initMap === 'function') {
        initMap();
    }
    
    // Initialize charts
    if (typeof chartsModule !== 'undefined' && chartsModule.initCharts) {
        chartsModule.initCharts();
    } else if (typeof initCharts === 'function') {
        initCharts();
    }
    
    // Set initial selected local authority
    if (config.currentLocalAuthority) {
        if (typeof window !== 'undefined') {
            window.currentSelectedLA = config.currentLocalAuthority;
        }
        setTimeout(() => {
            const focusButton = document.getElementById('focus-button');
            if (focusButton) {
                focusButton.style.display = 'block';
            }
        }, 1500);
    }
}

// Make initializeApp globally available
window.initializeApp = initializeApp;

// Initialize when DOM is ready (fallback if config loads before DOM)
document.addEventListener('DOMContentLoaded', function() {
    // If config is already loaded, initialize immediately
    if (config) {
        initializeApp();
    }
});
