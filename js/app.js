// Main application entry point

const App = {
    // Initialize the application
    async init() {
        this.showLoading();
        
        try {
            // Load data
            await DataUtils.loadData();
            
            // Initialize filters
            this.initializeFilters();
            
            // Initialize views
            ViewManager.init();
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Render initial view
            ViewManager.renderDashboard();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Error al cargar los datos. Por favor, recarga la página.');
            this.hideLoading();
        }
    },

    // Initialize filter dropdowns
    initializeFilters() {
        // Populate year filter
        const yearSelect = document.getElementById('filterYear');
        const years = DataUtils.getUniqueYears();
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        // Populate department filter
        const deptSelect = document.getElementById('filterDept');
        const departments = DataUtils.getUniqueValues('departamento');
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });

        // Populate section filter
        const sectionSelect = document.getElementById('filterSection');
        const sections = DataUtils.getUniqueValues('seccion');
        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            sectionSelect.appendChild(option);
        });

        // Populate maintenance type filter
        const maintSelect = document.getElementById('filterMaint');
        const maintTypes = DataUtils.getUniqueValues('tipoMantenimiento');
        maintTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            maintSelect.appendChild(option);
        });
    },

    // Setup event listeners
    setupEventListeners() {
        // Filter change listeners
        const filterElements = [
            'filterYear',
            'filterMonth',
            'filterDept',
            'filterSection',
            'filterMaint'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            element?.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Reset filters button
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Mobile menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        // Close modal
        document.getElementById('closeModal')?.addEventListener('click', () => {
            ViewManager.closeMachineModal();
        });

        // Close modal on backdrop click
        document.getElementById('machineModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'machineModal') {
                ViewManager.closeMachineModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                ViewManager.closeMachineModal();
            }
        });

        // Data Management event listeners
        this.setupDataManagement();
    },

    // Setup Data Management event listeners
    setupDataManagement() {
        // Export buttons
        document.getElementById('exportCSV')?.addEventListener('click', () => {
            const exportType = document.getElementById('exportType').value;
            DataUtils.exportToCSV(exportType);
        });

        document.getElementById('exportExcel')?.addEventListener('click', () => {
            const exportType = document.getElementById('exportType').value;
            DataUtils.exportToExcel(exportType);
        });

        // Update export count when selection changes
        document.getElementById('exportType')?.addEventListener('change', () => {
            ViewManager.renderDataManagement();
        });

        // Import file selection
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const dropZone = document.getElementById('dropZone');

        selectFileBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileImport(file);
            }
        });

        // Drag and drop functionality
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone?.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileImport(file);
            }
        });
    },

    // Handle file import
    async handleFileImport(file) {
        const statusEl = document.getElementById('importStatus');
        const messageEl = statusEl.querySelector('.status-message');
        const replaceData = document.getElementById('replaceData').checked;

        // Show loading
        this.showLoading();
        statusEl.style.display = 'none';

        try {
            const result = await DataUtils.importFromFile(file, replaceData);
            
            // Hide loading
            this.hideLoading();

            // Show success message
            statusEl.className = 'import-status success';
            statusEl.style.display = 'block';
            messageEl.textContent = result.message;

            // Refresh the application
            this.initializeFilters();
            ViewManager.switchView(ViewManager.currentView);

            // Clear file input
            document.getElementById('fileInput').value = '';

        } catch (error) {
            // Hide loading
            this.hideLoading();

            // Show error message
            statusEl.className = 'import-status error';
            statusEl.style.display = 'block';
            messageEl.textContent = error.message || 'Error al importar el archivo.';

            // Clear file input
            document.getElementById('fileInput').value = '';
        }
    },

    // Apply filters
    applyFilters() {
        // Get filter values
        DataUtils.filters.year = document.getElementById('filterYear').value;
        DataUtils.filters.month = document.getElementById('filterMonth').value;
        DataUtils.filters.dept = document.getElementById('filterDept').value;
        DataUtils.filters.section = document.getElementById('filterSection').value;
        DataUtils.filters.maint = document.getElementById('filterMaint').value;

        // Apply filters
        DataUtils.applyFilters();

        // Update current view
        ViewManager.switchView(ViewManager.currentView);
    },

    // Reset filters
    resetFilters() {
        // Clear filter selects
        document.getElementById('filterYear').value = '';
        document.getElementById('filterMonth').value = '';
        document.getElementById('filterDept').value = '';
        document.getElementById('filterSection').value = '';
        document.getElementById('filterMaint').value = '';

        // Reset data filters
        DataUtils.filters = {
            year: '',
            month: '',
            dept: '',
            section: '',
            maint: ''
        };

        DataUtils.filteredData = [...DataUtils.rawData];

        // Update current view
        ViewManager.switchView(ViewManager.currentView);
    },

    // Show loading overlay
    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    },

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install prompt ready');
});

// Log PWA installation
window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
});
