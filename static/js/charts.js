/**
 * Charts Module
 * Menangani visualisasi grafik menggunakan Chart.js
 */

let lineChart;
let areaChart;
let breakEvenYear = null;

/**
 * Initialize charts
 */
function initCharts() {
    initLineChart();
    initAreaChart();
    loadChartData();
}

/**
 * Initialize line chart
 */
function initLineChart() {
    const ctx = document.getElementById('line-chart').getContext('2d');
    
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tren Temporal'
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tahun'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Nilai'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * Initialize area chart
 */
function initAreaChart() {
    const ctx = document.getElementById('area-chart').getContext('2d');
    
    areaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Akumulasi Nilai'
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                filler: {
                    propagate: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tahun'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Akumulasi Nilai'
                    },
                    stacked: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

/**
 * Load chart data from API
 */
async function loadChartData() {
    const localAuthority = config.currentLocalAuthority;
    const benefitTypes = config.selectedBenefitTypes;
    
    // If no benefit types selected, don't load data
    if (!benefitTypes || benefitTypes.length === 0) {
        // Clear charts
        if (lineChart) {
            lineChart.data.labels = [];
            lineChart.data.datasets = [];
            lineChart.update();
        }
        if (areaChart) {
            areaChart.data.labels = [];
            areaChart.data.datasets = [];
            areaChart.update();
        }
        updateBreakEvenInfo(null);
        return;
    }
    
    try {
        // Load time series data
        const chartParams = new URLSearchParams();
        chartParams.append('local_authority', localAuthority);
        if (benefitTypes && Array.isArray(benefitTypes)) {
            benefitTypes.forEach(bt => {
                chartParams.append('benefit_types', bt);
            });
        }
        
        const chartResponse = await fetch(`/api/chart-data?${chartParams}`);
        const chartResult = await chartResponse.json();
        
        if (chartResult.success) {
            updateLineChart(chartResult.data);
        }
        
        // Load cumulative data
        const cumulParams = new URLSearchParams();
        cumulParams.append('local_authority', localAuthority);
        if (benefitTypes && Array.isArray(benefitTypes)) {
            benefitTypes.forEach(bt => {
                cumulParams.append('benefit_types', bt);
            });
        }
        
        const cumulResponse = await fetch(`/api/cumulative-data?${cumulParams}`);
        const cumulResult = await cumulResponse.json();
        
        if (cumulResult.success) {
            updateAreaChart(cumulResult.data);
        }
        
        // Load break-even
        const beResponse = await fetch(`/api/break-even?local_authority=${localAuthority}`);
        const beResult = await beResponse.json();
        
        if (beResult.success && beResult.break_even_year) {
            breakEvenYear = beResult.break_even_year;
            updateBreakEvenInfo(breakEvenYear);
        } else {
            breakEvenYear = null;
            updateBreakEvenInfo(null);
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

/**
 * Update line chart with new data
 */
function updateLineChart(data) {
    // Group data by benefit type
    const groupedData = {};
    const years = new Set();
    
    data.forEach(item => {
        if (!groupedData[item.co_benefit_type]) {
            groupedData[item.co_benefit_type] = {};
        }
        groupedData[item.co_benefit_type][item.year] = item.value_total;
        years.add(item.year);
    });
    
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    
    // Filter data up to selected year
    const filteredYears = sortedYears.filter(y => y <= config.currentYear);
    
    // Create datasets
    const datasets = [];
    const colors = {
        'physical_activity': 'rgb(75, 192, 192)',
        'air_quality': 'rgb(54, 162, 235)',
        'hassle_costs': 'rgb(255, 99, 132)',
        'congestion': 'rgb(255, 159, 64)'
    };
    
    config.selectedBenefitTypes.forEach(bt => {
        if (groupedData[bt]) {
            const values = filteredYears.map(year => groupedData[bt][year] || 0);
            datasets.push({
                label: config.benefitLabels[bt],
                data: values,
                borderColor: colors[bt] || 'rgb(128, 128, 128)',
                backgroundColor: colors[bt] ? colors[bt].replace('rgb', 'rgba').replace(')', ', 0.2)') : 'rgba(128, 128, 128, 0.2)',
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6
            });
        }
    });
    
    lineChart.data.labels = filteredYears;
    lineChart.data.datasets = datasets;
    
    // Add break-even line if available (using Chart.js annotations plugin)
    if (breakEvenYear && breakEvenYear <= config.currentYear) {
        const beIndex = filteredYears.indexOf(breakEvenYear);
        if (beIndex >= 0 && lineChart.options.plugins) {
            // Add annotation for break-even year
            if (!lineChart.options.plugins.annotation) {
                lineChart.options.plugins.annotation = {
                    annotations: {}
                };
            }
            lineChart.options.plugins.annotation.annotations = {
                breakEvenLine: {
                    type: 'line',
                    xMin: breakEvenYear,
                    xMax: breakEvenYear,
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        display: true,
                        content: `Break-even: ${breakEvenYear}`,
                        position: 'end',
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        color: 'white',
                        padding: 5,
                        borderRadius: 3
                    }
                }
            };
        }
    }
    
    lineChart.update();
}

/**
 * Update area chart with cumulative data
 */
function updateAreaChart(data) {
    // Similar to line chart but with cumulative values
    const groupedData = {};
    const years = new Set();
    
    data.forEach(item => {
        if (!groupedData[item.co_benefit_type]) {
            groupedData[item.co_benefit_type] = {};
        }
        groupedData[item.co_benefit_type][item.year] = item.cumulative;
        years.add(item.year);
    });
    
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const filteredYears = sortedYears.filter(y => y <= config.currentYear);
    
    const datasets = [];
    const colors = {
        'physical_activity': 'rgba(75, 192, 192, 0.6)',
        'air_quality': 'rgba(54, 162, 235, 0.6)',
        'hassle_costs': 'rgba(255, 99, 132, 0.6)',
        'congestion': 'rgba(255, 159, 64, 0.6)'
    };
    
    config.selectedBenefitTypes.forEach(bt => {
        if (groupedData[bt]) {
            const values = filteredYears.map(year => groupedData[bt][year] || 0);
            datasets.push({
                label: config.benefitLabels[bt],
                data: values,
                borderColor: colors[bt].replace('0.6', '1'),
                backgroundColor: colors[bt],
                tension: 0.4,
                fill: true
            });
        }
    });
    
    areaChart.data.labels = filteredYears;
    areaChart.data.datasets = datasets;
    areaChart.update();
}

/**
 * Update break-even info display
 */
function updateBreakEvenInfo(year) {
    const infoDiv = document.getElementById('break-even-info');
    if (year) {
        infoDiv.innerHTML = `<strong>Tahun Break-Even:</strong> ${year} — Manfaat mulai melebihi biaya`;
        infoDiv.style.display = 'block';
    } else {
        infoDiv.innerHTML = '';
        infoDiv.style.display = 'none';
    }
}

// Export functions
window.chartsModule = {
    initCharts,
    loadChartData,
    updateBreakEvenInfo
};

