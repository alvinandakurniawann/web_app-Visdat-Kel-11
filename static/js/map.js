/**
 * Map Module
 * Menangani visualisasi peta menggunakan Leaflet
 */

let map;
let geojsonLayer;
let currentYear;
let currentBenefitTypes;
let matchingProperty;
let selectedLayer = null; // Layer untuk highlight selected area
let legendControl = null; // Reference to legend control
let mapDataMap = null; // Store data map for resetting styles
let mapStyleFunction = null; // Store style function for resetting styles
let currentPopup = null; // Reference to current active popup

// Global variable for selected LA (declare once here using var for function scope)
var currentSelectedLA = null; // Current selected local authority

/**
 * Initialize map
 */
function initMap() {
    // Initialize config values
    if (typeof config !== 'undefined') {
        currentYear = config.currentYear || 2025;
        currentBenefitTypes = config.selectedMapBenefitTypes || ['air_quality'];
        matchingProperty = config.matchingProperty;
    } else {
        currentYear = 2025;
        currentBenefitTypes = ['air_quality'];
    }
    
    // Initialize Leaflet map centered on UK
    map = L.map('map').setView([54.5, -2.0], 6);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Load GeoJSON and data
    loadMapData();
}

/**
 * Load map data from API
 */
async function loadMapData() {
    try {
        // Load GeoJSON
        const geojsonResponse = await fetch('/api/geojson');
        const geojson = await geojsonResponse.json();
        
        // Load map data with multiple benefit types
        const params = new URLSearchParams({
            year: currentYear
        });
        
        // Only add benefit types if there are any selected
        if (currentBenefitTypes && currentBenefitTypes.length > 0) {
            currentBenefitTypes.forEach(bt => {
                params.append('benefit_types', bt);
            });
        }
        
        const dataResponse = await fetch(`/api/map-data?${params}`);
        const result = await dataResponse.json();
        
        if (result.success) {
            renderMap(geojson, result.data || []);
        }
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading map data:', error);
        return Promise.reject(error);
    }
}

/**
 * Render map with data
 */
function renderMap(geojson, data) {
    // Close any existing popup
    if (currentPopup) {
        map.closePopup(currentPopup);
        currentPopup = null;
    }
    
    // Remove existing layer if any
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
        selectedLayer = null; // Reset selected layer
    }
    
    // Create data lookup map
    const dataMap = {};
    let maxValue = 0;
    let minValue = 0;
    
    if (data && data.length > 0) {
        data.forEach(item => {
            dataMap[normalizeName(item.local_authority)] = item.value;
        });
        
        // Find max value for color scaling
        const values = data.map(d => d.value);
        maxValue = Math.max(...values.map(v => Math.abs(v)));
        minValue = Math.min(...values);
    }
    
    // Store dataMap globally for resetting styles
    mapDataMap = dataMap;
    
    // Create color function
    function getColor(value) {
        // Use red-yellow-green color scheme
        if (value >= 0) {
            // Positive values: green scale
            const ratio = maxValue > 0 ? value / maxValue : 0;
            return `rgb(${Math.floor(255 * (1 - ratio))}, ${Math.floor(200 + 55 * ratio)}, 0)`;
        } else {
            // Negative values: red scale
            const ratio = minValue < 0 ? Math.abs(value) / Math.abs(minValue) : 0;
            return `rgb(${Math.floor(200 + 55 * ratio)}, 0, 0)`;
        }
    }
    
    // Style function for features
    function style(feature) {
        const propValue = feature.properties[matchingProperty];
        const normalizedName = normalizeName(propValue);
        const value = dataMap[normalizedName];
        
        // Check if value exists in data
        const hasData = value !== undefined && value !== null;
        
        // If no data, use gray color to indicate missing data
        if (!hasData) {
            return {
                fillColor: '#cccccc',
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.5
            };
        }
        
        return {
            fillColor: getColor(value),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }
    
    // Store style function globally for resetting styles
    mapStyleFunction = style;
    
    // Highlight on hover (only if not selected)
    function highlightFeature(e) {
        const layer = e.target;
        // Don't highlight if this is the selected layer
        if (selectedLayer && selectedLayer === layer) {
            return;
        }
        
        layer.setStyle({
            weight: 4,
            color: '#999',
            dashArray: '',
            fillOpacity: 0.85
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
        
        // JANGAN tampilkan popup saat hover - hanya saat klik atau dipilih
    }
    
    // Reset highlight (only if not selected)
    function resetHighlight(e) {
        const layer = e.target;
        // Don't reset if this is the selected layer
        if (selectedLayer && selectedLayer === layer) {
            return;
        }
        // Close any popup that might be open (except selected area popup)
        if (currentPopup && currentPopup !== selectedLayer) {
            map.closePopup(currentPopup);
            currentPopup = null;
        }
        geojsonLayer.resetStyle(e.target);
    }
    
    // Handle click
    function onFeatureClick(e) {
        const properties = e.target.feature.properties;
        const propValue = properties[matchingProperty];
        const normalizedName = normalizeName(propValue);
        
        // Check if data exists for this area
        const value = dataMap[normalizedName];
        const hasData = value !== undefined && value !== null;
        
        // Find matching local authority
        let matchingLA = null;
        if (typeof config !== 'undefined' && config.localAuthorities) {
            matchingLA = config.localAuthorities.find(la => 
                normalizeName(la) === normalizedName
            );
        }
        
        // Close any existing popup first
        if (currentPopup) {
            map.closePopup(currentPopup);
            currentPopup = null;
        }
        
        // Only allow selection if data exists and matches a local authority in the list
        if (matchingLA && hasData) {
            // Update selected local authority
            const selectEl = document.getElementById('local-authority-select');
            if (selectEl) {
                selectEl.value = matchingLA;
            }
            
            if (typeof config !== 'undefined') {
                config.currentLocalAuthority = matchingLA;
            }
            currentSelectedLA = matchingLA;
            
            // Highlight selected area
            highlightSelectedArea(e.target, matchingLA);
            
            // Show popup for selected area
            showPopupForArea(e.target, propValue, value);
            
            // Pan to selected area
            map.fitBounds(e.target.getBounds(), { padding: [50, 50], maxZoom: 10 });
            
            // Update charts
            if (typeof updateChart === 'function') {
                updateChart();
            }
        } else {
            // Show message that this area cannot be selected
            const message = !matchingLA ? 
                'Wilayah ini tidak ada di data Excel' : 
                'Tidak ada data untuk wilayah ini pada tahun/parameter yang dipilih';
            
            // Show temporary popup message
            const tempPopup = L.popup({
                className: 'non-interactive-popup'
            })
                .setLatLng(e.latlng)
                .setContent(`<b>${propValue}</b><br><small style="color: #999;">${message}</small>`)
                .openOn(map);
            
            currentPopup = tempPopup;
            
            // Auto close after 2 seconds
            setTimeout(() => {
                if (currentPopup === tempPopup) {
                    map.closePopup(tempPopup);
                    currentPopup = null;
                }
            }, 2000);
        }
    }
    
    
    // Create GeoJSON layer
    geojsonLayer = L.geoJSON(geojson, {
        style: style,
        onEachFeature: function(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: onFeatureClick
            });
        }
    }).addTo(map);
    
    // Store reference to geojsonLayer for later use
    window.geojsonLayerRef = geojsonLayer;
    
    // Fit bounds to features
    map.fitBounds(geojsonLayer.getBounds());
    
    // Add legend
    addLegend(minValue, maxValue);
    
    // Don't auto-highlight on render - user should click focus button or click on map
}

/**
 * Show popup for selected area
 */
function showPopupForArea(layer, propValue, value) {
    // Close any existing popup first
    if (currentPopup) {
        map.closePopup(currentPopup);
        currentPopup = null;
    }
    
    // Get center of the layer for popup position
    const bounds = layer.getBounds();
    const center = bounds.getCenter();
    
    const valueText = value !== undefined && value !== null ? value.toFixed(2) : 'N/A';
    
    // Create label for benefit types
    let benefitLabel = '';
    if (typeof config !== 'undefined' && config.benefitLabels && currentBenefitTypes) {
        if (currentBenefitTypes.length === 1) {
            benefitLabel = config.benefitLabels[currentBenefitTypes[0]] || currentBenefitTypes[0];
        } else {
            benefitLabel = 'Total (' + currentBenefitTypes.map(bt => config.benefitLabels[bt] || bt).join(' + ') + ')';
        }
    }
    
    // Create and show popup
    const popup = L.popup({
        className: 'non-interactive-popup',
        closeOnClick: false,
        autoClose: false,
        closeButton: false
    })
        .setLatLng(center)
        .setContent(`<b>${propValue}</b><br>${benefitLabel ? benefitLabel + ': ' : ''}${valueText}`)
        .openOn(map);
    
    currentPopup = popup;
}

/**
 * Highlight selected area on map
 */
function highlightSelectedArea(layer, localAuthorityName) {
    // Reset previous highlight using original style
    if (selectedLayer && selectedLayer !== layer) {
        // Use resetStyle to restore original style from geojsonLayer
        if (geojsonLayer && mapStyleFunction) {
            geojsonLayer.resetStyle(selectedLayer);
        }
        // Close popup from previous selection
        if (currentPopup) {
            map.closePopup(currentPopup);
            currentPopup = null;
        }
    }
    
    // Set new highlight
    selectedLayer = layer;
    layer.setStyle({
        weight: 5,
        opacity: 1,
        color: '#FF6B35',
        dashArray: '',
        fillColor: '#FF6B35',
        fillOpacity: 0.8
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    
    currentSelectedLA = localAuthorityName;
    
    // Update legend to show selected value
    updateLegend();
}

/**
 * Highlight area by local authority name
 * @param {string} localAuthorityName - Name of local authority to highlight
 * @param {boolean} shouldPan - Whether to pan map to the area (default: false)
 */
function highlightAreaByName(localAuthorityName, shouldPan = false) {
    const layerToUse = geojsonLayer || window.geojsonLayerRef;
    if (!layerToUse) {
        console.warn('GeoJSON layer not available yet');
        return false;
    }
    
    if (!matchingProperty) {
        console.warn('Matching property not set');
        return false;
    }
    
    let found = false;
    layerToUse.eachLayer(function(layer) {
        const properties = layer.feature.properties;
        const propValue = properties[matchingProperty];
        if (!propValue) return;
        
        const normalizedName = normalizeName(propValue);
        
        if (normalizeName(localAuthorityName) === normalizedName) {
            highlightSelectedArea(layer, localAuthorityName);
            
            // Show popup for selected area
            const propValue = properties[matchingProperty];
            const normalizedName2 = normalizeName(propValue);
            const value = mapDataMap ? mapDataMap[normalizedName2] : undefined;
            showPopupForArea(layer, propValue, value);
            
            if (shouldPan) {
                map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 10 });
            }
            found = true;
            return false; // Break iteration
        }
    });
    
    return found;
}

/**
 * Focus map to selected local authority
 */
function focusToSelectedArea() {
    if (!currentSelectedLA) {
        // Use current selected from dropdown
        const selectEl = document.getElementById('local-authority-select');
        if (selectEl) {
            currentSelectedLA = selectEl.value;
        }
    }
    
    if (currentSelectedLA && (geojsonLayer || window.geojsonLayerRef)) {
        // Pan to area when focus button is clicked
        highlightAreaByName(currentSelectedLA, true);
    }
}

/**
 * Update map when year or benefit types change
 */
function updateMap(year, benefitTypes) {
    currentYear = year;
    currentBenefitTypes = Array.isArray(benefitTypes) ? benefitTypes : [benefitTypes];
    
    console.log('Updating map with year:', currentYear, 'benefitTypes:', currentBenefitTypes);
    
    // Store current selected LA before reloading
    const prevSelectedLA = currentSelectedLA || (typeof config !== 'undefined' ? config.currentLocalAuthority : null);
    
    loadMapData().then(() => {
        console.log('Map data loaded successfully');
        // Restore highlight after map reloads (without panning)
        if (prevSelectedLA) {
            setTimeout(() => {
                highlightAreaByName(prevSelectedLA, false);
                // Show focus button
                const focusButton = document.getElementById('focus-button');
                if (focusButton) {
                    focusButton.style.display = 'block';
                }
            }, 300);
        }
    }).catch(error => {
        console.error('Error updating map:', error);
    });
}

/**
 * Normalize name for matching
 */
function normalizeName(name) {
    if (!name) return "";
    return String(name).toLowerCase()
        .replace(/[''`]/g, "")
        .replace(/&/g, "and")
        .trim()
        .replace(/\s+/g, " ");
}

/**
 * Add legend to map
 */
function addLegend(minValue, maxValue) {
    // Remove existing legend if any
    if (legendControl) {
        map.removeControl(legendControl);
        legendControl = null;
    }
    
    const legend = L.control({ position: 'bottomright', className: 'map-legend' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        // Set background putih secara eksplisit
        div.style.backgroundColor = 'white';
        div.style.opacity = '1';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        
        // Create label for multiple benefit types
        let benefitLabel = '';
        if (typeof config !== 'undefined' && config.benefitLabels && currentBenefitTypes) {
            if (currentBenefitTypes.length === 1) {
                benefitLabel = config.benefitLabels[currentBenefitTypes[0]] || currentBenefitTypes[0];
            } else {
                benefitLabel = currentBenefitTypes.map(bt => config.benefitLabels[bt] || bt).join(' + ');
            }
        } else {
            benefitLabel = currentBenefitTypes ? currentBenefitTypes.join(' + ') : 'Multiple Parameters';
        }
        
        // Get value for selected local authority if any
        let selectedValueText = '';
        if (currentSelectedLA && mapDataMap) {
            const normalizedName = normalizeName(currentSelectedLA);
            const value = mapDataMap[normalizedName];
            if (value !== undefined) {
                selectedValueText = `                <div class="legend-selected" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc;">
                    <strong>Terpilih:</strong> ${currentSelectedLA}<br>
                    <strong>Nilai:</strong> ${value.toFixed(2)}<br>
                    <small style="color: #666; font-size: 0.85em;">${benefitLabel || 'Total dari parameter terpilih'}</small>
                </div>`;
            }
        }
        
        // Nilai min/max adalah GLOBAL (fix untuk semua wilayah)
        // Hanya nilai "Terpilih" yang berubah sesuai local authority yang dipilih
        div.innerHTML = `
            <h4>${benefitLabel}</h4>
            <div class="legend-scale">
                <div class="legend-item">
                    <span class="legend-color" style="background: rgb(255, 0, 0);"></span>
                    <span>${minValue.toFixed(1)}</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: rgb(255, 200, 0);"></span>
                    <span>0</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: rgb(0, 200, 0);"></span>
                    <span>${maxValue.toFixed(1)}</span>
                </div>
            </div>
            ${selectedValueText}
        `;
        return div;
    };
    
    legend.addTo(map);
    legendControl = legend; // Store reference for later removal
}

/**
 * Update legend with current selected local authority value
 */
function updateLegend() {
    if (!legendControl || !mapDataMap) return;
    
    // Get current min/max values
    const values = Object.values(mapDataMap);
    if (values.length === 0) return;
    
    const maxValue = Math.max(...values.map(v => Math.abs(v)));
    const minValue = Math.min(...values);
    
    // Remove and recreate legend
    addLegend(minValue, maxValue);
}

// Export functions
window.mapModule = {
    initMap,
    updateMap,
    highlightAreaByName,
    focusToSelectedArea
};

// Make functions globally available
window.highlightAreaByName = highlightAreaByName;
window.focusToSelectedArea = focusToSelectedArea;
window.initMap = initMap;
window.updateMap = updateMap;
