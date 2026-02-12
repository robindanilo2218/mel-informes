// View handling and UI updates

const Views = {
    // Initialize views
    init() {
        this.setupEventListeners();
        this.renderDashboard();
    },

    // Setup event listeners for navigation and filters
    setupEventListeners() {
        // Navigation - Sidebar menu items
        document.querySelectorAll('.menu-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = button.getAttribute('data-view');
                this.switchView(targetId);
                // Close sidebar on mobile after selection
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                }
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

        // Filters
        const filterIds = ['yearFilter', 'monthFilter', 'deptFilter', 'sectionFilter', 'maintFilter'];
        filterIds.forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateFilters();
            });
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Configuration view event listeners
        document.getElementById('selectAllMachines').addEventListener('click', () => {
            this.selectAllMachines(true);
        });

        document.getElementById('deselectAllMachines').addEventListener('click', () => {
            this.selectAllMachines(false);
        });

        document.getElementById('saveProductionLines').addEventListener('click', () => {
            this.saveProductionLinesConfig();
        });
    },

    // Switch between views (Dashboard, Production Lines, Analysis, Config, Details)
    switchView(viewId) {
        // Update sidebar navigation
        document.querySelectorAll('.menu-item').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-view') === viewId) {
                button.classList.add('active');
            }
        });

        // Update view visibility
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.remove('active');
            if (container.id === viewId) {
                container.classList.add('active');
            }
        });

        // Render specific view content
        if (viewId === 'dashboard') {
            this.renderDashboard();
        } else if (viewId === 'production-lines') {
            this.renderProductionLines();
        } else if (viewId === 'analysis') {
            this.renderAnalysis();
        } else if (viewId === 'config') {
            this.renderConfiguration();
        } else if (viewId === 'details') {
            this.renderDetails();
        }
    },

    // Update filters based on selection
    updateFilters() {
        DataUtils.filters = {
            year: document.getElementById('yearFilter').value,
            month: document.getElementById('monthFilter').value,
            dept: document.getElementById('deptFilter').value,
            section: document.getElementById('sectionFilter').value,
            maint: document.getElementById('maintFilter').value
        };
        
        DataUtils.applyFilters();
        
        // Re-render current view
        const currentView = document.querySelector('.view-container.active');
        if (currentView) {
            this.switchView(currentView.id);
        }
    },

    // Reset all filters
    resetFilters() {
        document.getElementById('yearFilter').value = '';
        document.getElementById('monthFilter').value = '';
        document.getElementById('deptFilter').value = '';
        document.getElementById('sectionFilter').value = '';
        document.getElementById('maintFilter').value = '';
        
        this.updateFilters();
    },

    // Populate filter dropdowns
    populateFilters() {
        const populateSelect = (id, values) => {
            const select = document.getElementById(id);
            const currentValue = select.value;
            
            // Keep the first option (placeholder)
            select.innerHTML = select.options[0].outerHTML;
            
            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });

            // Restore selection if valid
            if (values.includes(currentValue)) {
                select.value = currentValue;
            }
        };

        populateSelect('yearFilter', DataUtils.getUniqueYears());
        
        // For months, we might want to show names instead of numbers
        const months = [
            { val: '1', name: 'Enero' }, { val: '2', name: 'Febrero' }, 
            { val: '3', name: 'Marzo' }, { val: '4', name: 'Abril' },
            { val: '5', name: 'Mayo' }, { val: '6', name: 'Junio' },
            { val: '7', name: 'Julio' }, { val: '8', name: 'Agosto' },
            { val: '9', name: 'Septiembre' }, { val: '10', name: 'Octubre' },
            { val: '11', name: 'Noviembre' }, { val: '12', name: 'Diciembre' }
        ];
        
        const monthSelect = document.getElementById('monthFilter');
        const currentMonth = monthSelect.value;
        monthSelect.innerHTML = monthSelect.options[0].outerHTML;
        
        months.forEach(m => {
            const option = document.createElement('option');
            option.value = m.val;
            option.textContent = m.name;
            monthSelect.appendChild(option);
        });
        monthSelect.value = currentMonth;

        populateSelect('deptFilter', DataUtils.getUniqueValues('departamento'));
        populateSelect('sectionFilter', DataUtils.getUniqueValues('seccion'));
        populateSelect('maintFilter', DataUtils.getUniqueValues('tipoMantenimiento'));
    },

    // Render Dashboard View
    renderDashboard() {
        const kpis = DataUtils.calculateKPIs();
        
        // Update KPI cards
        document.getElementById('totalSpending').textContent = DataUtils.formatCurrency(kpis.total);
        document.getElementById('avgSpending').textContent = DataUtils.formatCurrency(kpis.average);
        document.getElementById('totalRecords').textContent = kpis.count;
        document.getElementById('topMachine').textContent = kpis.topMachine;
        document.getElementById('topMachineValue').textContent = DataUtils.formatCurrency(kpis.topMachineValue);

        // Render Charts
        Charts.renderMonthlyTrend(DataUtils.getMonthlyTimeSeries());
        Charts.renderDepartmentDistribution(DataUtils.getDepartmentAggregation());
        Charts.renderTopMachines(DataUtils.getTopMachines(10));
    },

    // Render Production Lines View (NEW)
    renderProductionLines() {
        const hierarchy = DataUtils.getProductionLineHierarchy();
        const container = document.getElementById('productionLinesTree');
        container.innerHTML = '';

        const productionLines = DataUtils.getProductionLinesConfig();

        if (productionLines.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay líneas de producción configuradas. Por favor ve a la sección de <a href="#config" class="nav-link">Configuración</a> para seleccionar las líneas de producción.</div>';
            return;
        }

        if (Object.keys(hierarchy).length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay datos para mostrar con los filtros actuales.</div>';
            return;
        }

        // Create tree view: Machine -> Section
        Object.entries(hierarchy).forEach(([machine, machineData]) => {
            const machineNode = this.createTreeNode(machine, machineData.total, 'machine', machineData.department);
            const machineContent = document.createElement('div');
            machineContent.className = 'tree-content hidden';
            
            Object.entries(machineData.sections).forEach(([section, sectionData]) => {
                const sectionNode = this.createTreeNode(section, sectionData.total, 'section');
                // Add click event to show details
                sectionNode.querySelector('.tree-label').addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Section details:', machine, section, sectionData);
                });
                machineContent.appendChild(sectionNode);
            });
            
            machineNode.appendChild(machineContent);
            container.appendChild(machineNode);
        });
    },

    // Render Analysis View (General)
    renderAnalysis() {
        const hierarchy = DataUtils.getHierarchy();
        const container = document.getElementById('hierarchyTree');
        container.innerHTML = '';

        if (Object.keys(hierarchy).length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay datos para mostrar con los filtros actuales.</div>';
            return;
        }

        // Create tree view: Department -> Section -> Machine
        Object.entries(hierarchy).forEach(([dept, deptData]) => {
            const deptNode = this.createTreeNode(dept, deptData.total, 'department');
            const deptContent = document.createElement('div');
            deptContent.className = 'tree-content hidden';
            
            Object.entries(deptData.sections).forEach(([section, sectionData]) => {
                const sectionNode = this.createTreeNode(section, sectionData.total, 'section');
                const sectionContent = document.createElement('div');
                sectionContent.className = 'tree-content hidden';
                
                Object.entries(sectionData.machines).forEach(([machine, machineData]) => {
                    const machineNode = this.createTreeNode(machine, machineData.total, 'machine');
                    // Add click event to show details for this machine
                    machineNode.querySelector('.tree-label').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showMachineDetails(machine);
                    });
                    sectionContent.appendChild(machineNode);
                });
                
                sectionNode.appendChild(sectionContent);
                deptContent.appendChild(sectionNode);
            });
            
            deptNode.appendChild(deptContent);
            container.appendChild(deptNode);
        });
    },

    // Render Configuration View (NEW)
    renderConfiguration() {
        const machines = DataUtils.getUniqueMachines();
        const productionLines = DataUtils.getProductionLinesConfig();
        const container = document.getElementById('machineConfigList');
        container.innerHTML = '';

        if (machines.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay máquinas en los datos cargados.</div>';
            return;
        }

        // Sort machines alphabetically
        machines.sort().forEach(machine => {
            const isChecked = productionLines.includes(machine);
            
            const item = document.createElement('div');
            item.className = 'machine-config-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `machine_${machine.replace(/[^a-zA-Z0-9]/g, '_')}`;
            checkbox.value = machine;
            checkbox.checked = isChecked;
            checkbox.className = 'machine-checkbox';
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = machine;
            label.className = 'machine-label';
            
            item.appendChild(checkbox);
            item.appendChild(label);
            container.appendChild(item);
        });
    },

    // Helper to create tree nodes
    createTreeNode(label, value, type, subtitle = '') {
        const node = document.createElement('div');
        node.className = `tree-node ${type}`;
        
        const header = document.createElement('div');
        header.className = 'tree-header';
        
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.textContent = '▶';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tree-label';
        labelSpan.textContent = label;
        
        if (subtitle) {
            const subtitleSpan = document.createElement('span');
            subtitleSpan.className = 'tree-subtitle';
            subtitleSpan.textContent = ` (${subtitle})`;
            labelSpan.appendChild(subtitleSpan);
        }
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'tree-value';
        valueSpan.textContent = DataUtils.formatCurrency(value);
        
        header.appendChild(toggle);
        header.appendChild(labelSpan);
        header.appendChild(valueSpan);
        node.appendChild(header);
        
        // Toggle functionality
        header.addEventListener('click', () => {
            const content = node.querySelector('.tree-content');
            if (content) {
                content.classList.toggle('hidden');
                toggle.textContent = content.classList.contains('hidden') ? '▶' : '▼';
            }
        });
        
        return node;
    },

    // Select/Deselect all machines (NEW)
    selectAllMachines(select) {
        const checkboxes = document.querySelectorAll('.machine-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    },

    // Save production lines configuration (NEW)
    saveProductionLinesConfig() {
        const checkboxes = document.querySelectorAll('.machine-checkbox:checked');
        const selectedMachines = Array.from(checkboxes).map(cb => cb.value);
        
        if (DataUtils.saveProductionLinesConfig(selectedMachines)) {
            alert(`Configuración guardada exitosamente. ${selectedMachines.length} líneas de producción seleccionadas.`);
            
            // Refresh production lines view if it's open
            const currentView = document.querySelector('.view-container.active');
            if (currentView && currentView.id === 'production-lines') {
                this.renderProductionLines();
            }
        } else {
            alert('Error al guardar la configuración.');
        }
    },

    // Show details for a specific machine
    showMachineDetails(machineName) {
        const data = DataUtils.getMachineData(machineName);
        if (!data) return;

        console.log('Machine Details:', data);
        alert(`Máquina: ${machineName}\nDepartamento: ${data.department}\nSección: ${data.section}\nTotal: ${DataUtils.formatCurrency(data.total)}\nRegistros: ${data.count}`);
    },

    // Render Details View (Data Grid)
    renderDetails() {
        const data = DataUtils.filteredData;
        const tbody = document.getElementById('detailsTableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay datos disponibles</td></tr>';
            return;
        }

        // Limit to first 100 rows for performance
        const displayData = data.slice(0, 100);
        
        displayData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.salida}</td>
                <td>${DataUtils.formatDate(row.fecha)}</td>
                <td>${row.departamento}</td>
                <td>${row.seccion}</td>
                <td>${row.maquinaria}</td>
                <td>${row.articulo} - ${row.descripcion}</td>
                <td>${row.tipoMantenimiento}</td>
                <td class="text-right">${DataUtils.formatCurrency(row.valorSalida)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update count message
        const countMsg = document.getElementById('detailsCount');
        if (countMsg) {
            countMsg.textContent = `Mostrando ${displayData.length} de ${data.length} registros`;
        }
    }
};
