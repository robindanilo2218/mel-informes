// Main application initialization

const App = {
    async init() {
        console.log('Initializing application...');
        
        try {
            // Load data
            await DataUtils.loadData();
            console.log('Data loaded successfully');
            
            // Initialize views
            Views.init();
            
            // Populate filters
            Views.populateFilters();
            
            // Setup file import
            this.setupFileImport();
            
            // Setup export handlers
            this.setupExportHandlers();
            
            // Setup force update button
            this.setupForceUpdate();
            
            console.log('Application initialized');
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Error al cargar los datos. Por favor, verifica el archivo CSV.');
        }
    },

    // Setup force update functionality
    setupForceUpdate() {
        const updateBtn = document.getElementById('forceUpdateBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', async () => {
                const confirmed = confirm(
                    '¿Deseas actualizar la aplicación a la última versión?\n\n' +
                    'Esto limpiará la caché y recargará todos los archivos.\n' +
                    'Tu configuración de Líneas de Producción se mantendrá.'
                );
                
                if (confirmed) {
                    await this.forceUpdate();
                }
            });
        }
    },

    // Force update: clear cache and reload
    async forceUpdate() {
        try {
            console.log('Starting forced update...');
            
            // Show loading indicator
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('active');
            }
            
            // Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log(`Unregistering ${registrations.length} service workers...`);
                
                for (const registration of registrations) {
                    await registration.unregister();
                    console.log('Service worker unregistered');
                }
            }
            
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log(`Deleting ${cacheNames.length} caches...`);
                
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log(`Deleting cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
            }
            
            console.log('Cache cleared, reloading page...');
            
            // Force reload from server (bypass cache)
            window.location.reload(true);
            
        } catch (error) {
            console.error('Error during force update:', error);
            alert('Error al actualizar la aplicación. Por favor, intenta recargar manualmente (Ctrl+Shift+R).');
            
            // Hide loading indicator
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
        }
    },

    // Setup file import functionality
    setupFileImport() {
        const fileInput = document.getElementById('fileInput');
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const confirmReplace = confirm('¿Deseas reemplazar los datos existentes?\n\nOK = Reemplazar\nCancelar = Agregar a los datos existentes');
            
            try {
                const result = await DataUtils.importFromFile(file, confirmReplace);
                alert(result.message);
                
                // Refresh views and filters
                Views.populateFilters();
                const currentView = document.querySelector('.view-section.active').id;
                Views.switchView(currentView);
                
                // Clear file input
                fileInput.value = '';
            } catch (error) {
                alert(error.message || 'Error al importar el archivo.');
                fileInput.value = '';
            }
        });
    },

    // Setup export handlers for both views
    setupExportHandlers() {
        // Analysis view export handlers
        const exportCsvBtn = document.getElementById('exportCsv');
        const exportExcelBtn = document.getElementById('exportExcel');
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                DataUtils.exportToCSV('filtered');
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                DataUtils.exportToExcel('filtered');
            });
        }

        // Production lines export handlers
        const exportProdCsvBtn = document.getElementById('exportProdCsv');
        const exportProdExcelBtn = document.getElementById('exportProdExcel');
        
        if (exportProdCsvBtn) {
            exportProdCsvBtn.addEventListener('click', () => {
                DataUtils.exportToCSV('filtered');
            });
        }
        
        if (exportProdExcelBtn) {
            exportProdExcelBtn.addEventListener('click', () => {
                DataUtils.exportToExcel('filtered');
            });
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Register service worker for PWA functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}
