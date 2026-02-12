// View management module

const ViewManager = {
    currentView: 'dashboard',
    currentPeriod: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    timelineMode: 'monthly',

    // Initialize views
    init() {
        this.setupViewSwitching();
        this.setupTimeline();
    },

    // Setup view switching
    setupViewSwitching() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.getAttribute('data-view');
                this.switchView(view);
                
                // Update active menu item
                menuItems.forEach(m => m.classList.remove('active'));
                item.classList.add('active');
                
                // Close mobile menu if open
                document.getElementById('sidebar').classList.remove('active');
            });
        });
    },

    // Switch between views
    switchView(viewName) {
        this.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        // Render the view
        switch(viewName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'timeline':
                this.renderTimeline();
                break;
            case 'organigram':
                this.renderOrganigram();
                break;
            case 'data':
                this.renderDataManagement();
                break;
        }
    },

    // Render Dashboard View
    renderDashboard() {
        // Update KPIs
        const kpis = DataUtils.calculateKPIs();
        document.getElementById('kpiTotal').textContent = DataUtils.formatCurrency(kpis.total);
        document.getElementById('kpiAvg').textContent = DataUtils.formatCurrency(kpis.average);
        document.getElementById('kpiCount').textContent = kpis.count.toLocaleString();
        document.getElementById('kpiTopMachine').textContent = kpis.topMachine;
        
        // Update charts
        ChartManager.updateDashboardCharts();
    },

    // Setup timeline navigation
    setupTimeline() {
        const prevBtn = document.getElementById('prevPeriod');
        const nextBtn = document.getElementById('nextPeriod');
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        
        prevBtn?.addEventListener('click', () => {
            this.navigatePeriod(-1);
        });
        
        nextBtn?.addEventListener('click', () => {
            this.navigatePeriod(1);
        });
        
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.timelineMode = mode;
                
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.renderTimeline();
            });
        });
    },

    // Navigate timeline period
    navigatePeriod(direction) {
        if (this.timelineMode === 'monthly') {
            this.currentPeriod.month += direction;
            if (this.currentPeriod.month > 12) {
                this.currentPeriod.month = 1;
                this.currentPeriod.year++;
            } else if (this.currentPeriod.month < 1) {
                this.currentPeriod.month = 12;
                this.currentPeriod.year--;
            }
        } else {
            // Weekly navigation (simplified - just move by month for now)
            this.currentPeriod.month += direction;
            if (this.currentPeriod.month > 12) {
                this.currentPeriod.month = 1;
                this.currentPeriod.year++;
            } else if (this.currentPeriod.month < 1) {
                this.currentPeriod.month = 12;
                this.currentPeriod.year--;
            }
        }
        
        this.renderTimeline();
    },

    // Render Timeline View
    renderTimeline() {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        // Update period display
        const periodDisplay = document.getElementById('periodDisplay');
        periodDisplay.textContent = `${monthNames[this.currentPeriod.month - 1]} ${this.currentPeriod.year}`;
        
        // Get period data
        const breakdown = DataUtils.getPeriodBreakdown(this.currentPeriod.year, this.currentPeriod.month);
        
        // Update period KPIs
        document.getElementById('periodTotal').textContent = DataUtils.formatCurrency(breakdown.total);
        
        // Calculate accumulated (all data up to this period)
        const accumulated = DataUtils.rawData
            .filter(row => {
                const rowDate = new Date(row.fecha.getFullYear(), row.fecha.getMonth());
                const currentDate = new Date(this.currentPeriod.year, this.currentPeriod.month - 1);
                return rowDate <= currentDate;
            })
            .reduce((sum, row) => sum + row.valorSalida, 0);
        
        document.getElementById('accumulatedTotal').textContent = DataUtils.formatCurrency(accumulated);
        
        // Render timeline chart
        ChartManager.createTimelineChart('timelineChart', this.timelineMode);
        
        // Render breakdown
        this.renderPeriodBreakdown(breakdown);
    },

    // Render period breakdown
    renderPeriodBreakdown(breakdown) {
        const container = document.getElementById('periodBreakdown');
        container.innerHTML = '';
        
        // Add department breakdown
        Object.entries(breakdown.byDepartment).forEach(([dept, value]) => {
            const item = document.createElement('div');
            item.className = 'breakdown-item';
            item.innerHTML = `
                <div class="breakdown-label">${dept}</div>
                <div class="breakdown-value">${DataUtils.formatCurrency(value)}</div>
            `;
            container.appendChild(item);
        });
    },

    // Render Organigram View
    renderOrganigram() {
        const container = document.getElementById('organigramContainer');
        container.innerHTML = '';
        
        const hierarchy = DataUtils.getHierarchy();
        
        // Render each department
        Object.entries(hierarchy).forEach(([deptName, deptData]) => {
            const deptSection = document.createElement('div');
            deptSection.className = 'dept-section';
            
            const deptHeader = document.createElement('div');
            deptHeader.className = 'dept-header';
            deptHeader.innerHTML = `
                <span>${deptName}</span>
                <span class="dept-total">${DataUtils.formatCurrency(deptData.total)}</span>
            `;
            deptSection.appendChild(deptHeader);
            
            // Create sections grid
            const sectionsGrid = document.createElement('div');
            sectionsGrid.className = 'sections-grid';
            
            // Render each section
            Object.entries(deptData.sections).forEach(([sectionName, sectionData]) => {
                const sectionCard = this.createSectionCard(sectionName, sectionData);
                sectionsGrid.appendChild(sectionCard);
            });
            
            deptSection.appendChild(sectionsGrid);
            container.appendChild(deptSection);
        });
    },

    // Create section card with machines
    createSectionCard(sectionName, sectionData) {
        const card = document.createElement('div');
        card.className = 'section-card';
        
        const header = document.createElement('div');
        header.innerHTML = `
            <div class="section-name">${sectionName}</div>
            <div class="section-total">${DataUtils.formatCurrency(sectionData.total)}</div>
        `;
        card.appendChild(header);
        
        const machinesList = document.createElement('div');
        machinesList.className = 'machines-list';
        
        // Sort machines by total cost
        const sortedMachines = Object.entries(sectionData.machines)
            .sort((a, b) => b[1].total - a[1].total);
        
        sortedMachines.forEach(([machineName, machineData]) => {
            const machineItem = document.createElement('div');
            machineItem.className = 'machine-item';
            machineItem.innerHTML = `
                <span class="machine-name">${machineName}</span>
                <span class="machine-cost">${DataUtils.formatCurrency(machineData.total)}</span>
            `;
            
            // Add click handler to show machine detail
            machineItem.addEventListener('click', () => {
                this.showMachineDetail(machineName);
            });
            
            machinesList.appendChild(machineItem);
        });
        
        card.appendChild(machinesList);
        return card;
    },

    // Show machine detail modal
    showMachineDetail(machineName) {
        const machineData = DataUtils.getMachineData(machineName);
        if (!machineData) return;
        
        // Update modal header
        document.getElementById('machineName').textContent = machineName;
        document.getElementById('machineDept').textContent = machineData.department;
        document.getElementById('machineSection').textContent = machineData.section;
        document.getElementById('machineTotal').textContent = DataUtils.formatCurrency(machineData.total);
        
        // Render machine chart
        ChartManager.createMachineChart('machineChart', machineData);
        
        // Render machine table
        this.renderMachineTable(machineData.records);
        
        // Show modal
        document.getElementById('machineModal').classList.add('active');
    },

    // Render machine records table
    renderMachineTable(records) {
        const tbody = document.querySelector('#machineTable tbody');
        tbody.innerHTML = '';
        
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${DataUtils.formatDate(record.fecha)}</td>
                <td>${record.articulo}</td>
                <td>${record.descripcion}</td>
                <td>${record.cantidad.toFixed(2)}</td>
                <td>${DataUtils.formatCurrency(record.valorSalida)}</td>
                <td>${record.tipoMantenimiento}</td>
            `;
            tbody.appendChild(row);
        });
    },

    // Close machine modal
    closeMachineModal() {
        document.getElementById('machineModal').classList.remove('active');
    },

    // Render Data Management View
    renderDataManagement() {
        // Update export count
        const exportType = document.getElementById('exportType')?.value || 'filtered';
        const count = exportType === 'all' ? DataUtils.rawData.length : DataUtils.filteredData.length;
        const exportCountEl = document.getElementById('exportCount');
        if (exportCountEl) {
            exportCountEl.textContent = count.toLocaleString();
        }
    }
};
