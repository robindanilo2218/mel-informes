// Data utilities for CSV parsing and data manipulation

const DataUtils = {
    rawData: [],
    filteredData: [],
    filters: {
        year: '',
        month: '',
        dept: '',
        section: '',
        maint: ''
    },

    // Parse currency from format "100.589,56" to 100589.56
    parseCurrency(value) {
        if (!value || value === '') return 0;
        // Remove thousands separator (.) and replace decimal comma with dot
        const cleaned = String(value).replace(/\./g, '').replace(',', '.');
        return parseFloat(cleaned) || 0;
    },

    // Format currency to Guatemalan Quetzal format
    formatCurrency(value) {
        return 'Q ' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Parse date from format "19/3/2025" to Date object
    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        // DD/MM/YYYY
        return new Date(parts[2], parts[1] - 1, parts[0]);
    },

    // Format date to readable Spanish format
    formatDate(date) {
        if (!date) return '';
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                       'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    },

    // Calculate ISO week number from a date
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    // Load and parse CSV data
    async loadData() {
        return new Promise((resolve, reject) => {
            Papa.parse('assets/informe_salidas_bodega.csv', {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.rawData = results.data.map((row, index) => {
                        const fecha = this.parseDate(row['Fecha Contabilizacion']);
                        
                        // Calculate date fields from fecha if not present in CSV
                        let dia = parseInt(row['Dia']) || 0;
                        let mes = parseInt(row['Mes']) || 0;
                        let semana = parseInt(row['Semana']) || 0;
                        
                        if (fecha) {
                            if (!dia) dia = fecha.getDate();
                            if (!mes) mes = fecha.getMonth() + 1; // JavaScript months are 0-indexed
                            if (!semana) semana = this.getWeekNumber(fecha);
                        }
                        
                        return {
                            id: index,
                            salida: row['No. Salida'],
                            fecha: fecha,
                            fechaStr: row['Fecha Contabilizacion'],
                            dia: dia,
                            semana: semana,
                            mes: mes,
                            articulo: row['Articulo'] || '',
                            descripcion: row['Descripcion'] || '',
                            cantidad: parseFloat(row['Cantidad']) || 0,
                            costoArticulo: this.parseCurrency(row['Costo Articulo']),
                            valorSalida: this.parseCurrency(row['Valor Salida']),
                            autorizador: row['Nombre Autorizador'] || '',
                            encargado: row['Encargado'] || '',
                            departamento: row['Departamento'] || '',
                            maquinaria: row['Maquinaria'] || '',
                            seccion: row['Seccion'] || '',
                            mercado: row['Mercado'] || '',
                            comentario: row['Comentario'] || '',
                            bodeguero: row['Bodeguero'] || '',
                            tipoMantenimiento: row['Tipo Mantenimiento'] || ''
                        };
                    }).filter(row => row.fecha && row.valorSalida > 0);
                    
                    this.filteredData = [...this.rawData];
                    console.log(`Loaded ${this.rawData.length} records`);
                    resolve(this.rawData);
                },
                error: (error) => {
                    console.error('Error loading CSV:', error);
                    reject(error);
                }
            });
        });
    },

    // Apply filters
    applyFilters() {
        this.filteredData = this.rawData.filter(row => {
            if (this.filters.year && row.fecha.getFullYear().toString() !== this.filters.year) {
                return false;
            }
            if (this.filters.month && row.mes.toString() !== this.filters.month) {
                return false;
            }
            if (this.filters.dept && row.departamento !== this.filters.dept) {
                return false;
            }
            if (this.filters.section && row.seccion !== this.filters.section) {
                return false;
            }
            if (this.filters.maint && row.tipoMantenimiento !== this.filters.maint) {
                return false;
            }
            return true;
        });
        return this.filteredData;
    },

    // Get unique values for filters
    getUniqueValues(field) {
        const values = new Set();
        this.rawData.forEach(row => {
            const value = row[field];
            if (value) values.add(value);
        });
        return Array.from(values).sort();
    },

    // Get unique years
    getUniqueYears() {
        const years = new Set();
        this.rawData.forEach(row => {
            if (row.fecha) years.add(row.fecha.getFullYear());
        });
        return Array.from(years).sort();
    },

    // Calculate KPIs
    calculateKPIs(data = null) {
        const dataset = data || this.filteredData;
        if (dataset.length === 0) {
            return {
                total: 0,
                average: 0,
                count: 0,
                topMachine: '-'
            };
        }

        const total = dataset.reduce((sum, row) => sum + row.valorSalida, 0);
        const average = total / dataset.length;

        // Group by machine to find top spender
        const machineSpending = {};
        dataset.forEach(row => {
            if (row.maquinaria) {
                machineSpending[row.maquinaria] = 
                    (machineSpending[row.maquinaria] || 0) + row.valorSalida;
            }
        });

        const topMachine = Object.entries(machineSpending)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            total,
            average,
            count: dataset.length,
            topMachine: topMachine ? topMachine[0] : '-',
            topMachineValue: topMachine ? topMachine[1] : 0
        };
    },

    // Group data by field
    groupBy(field, data = null) {
        const dataset = data || this.filteredData;
        const grouped = {};
        
        dataset.forEach(row => {
            const key = row[field] || 'Sin especificar';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(row);
        });

        return grouped;
    },

    // Get time series data (monthly)
    getMonthlyTimeSeries() {
        const monthly = {};
        
        this.filteredData.forEach(row => {
            const year = row.fecha.getFullYear();
            const month = row.mes;
            const key = `${year}-${month.toString().padStart(2, '0')}`;
            
            if (!monthly[key]) {
                monthly[key] = { total: 0, count: 0, year, month };
            }
            monthly[key].total += row.valorSalida;
            monthly[key].count++;
        });

        return Object.entries(monthly)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => ({
                period: key,
                ...value
            }));
    },

    // Get weekly time series
    getWeeklyTimeSeries() {
        const weekly = {};
        
        this.filteredData.forEach(row => {
            const year = row.fecha.getFullYear();
            const week = row.semana;
            const key = `${year}-W${week.toString().padStart(2, '0')}`;
            
            if (!weekly[key]) {
                weekly[key] = { total: 0, count: 0, year, week };
            }
            weekly[key].total += row.valorSalida;
            weekly[key].count++;
        });

        return Object.entries(weekly)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, value]) => ({
                period: key,
                ...value
            }));
    },

    // Get aggregated data by department
    getDepartmentAggregation() {
        const deptData = this.groupBy('departamento');
        return Object.entries(deptData).map(([dept, items]) => ({
            department: dept,
            total: items.reduce((sum, item) => sum + item.valorSalida, 0),
            count: items.length
        })).sort((a, b) => b.total - a.total);
    },

    // Get aggregated data by maintenance type
    getMaintenanceTypeAggregation() {
        const maintData = this.groupBy('tipoMantenimiento');
        return Object.entries(maintData).map(([type, items]) => ({
            type: type,
            total: items.reduce((sum, item) => sum + item.valorSalida, 0),
            count: items.length
        })).sort((a, b) => b.total - a.total);
    },

    // Get top machines by spending
    getTopMachines(limit = 10) {
        const machineData = this.groupBy('maquinaria');
        return Object.entries(machineData)
            .map(([machine, items]) => ({
                machine: machine,
                total: items.reduce((sum, item) => sum + item.valorSalida, 0),
                count: items.length,
                dept: items[0].departamento,
                section: items[0].seccion
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    },

    // Get hierarchical structure (Dept -> Machine -> Section)
    getHierarchy() {
        const hierarchy = {};
        
        this.filteredData.forEach(row => {
            const dept = row.departamento || 'Sin Departamento';
            const machine = row.maquinaria || 'Sin Máquina';
            const section = row.seccion || 'Sin Sección';
            
            if (!hierarchy[dept]) {
                hierarchy[dept] = { machines: {}, total: 0 };
            }
            
            if (!hierarchy[dept].machines[machine]) {
                hierarchy[dept].machines[machine] = { sections: {}, total: 0 };
            }
            
            if (!hierarchy[dept].machines[machine].sections[section]) {
                hierarchy[dept].machines[machine].sections[section] = { 
                    items: [], 
                    total: 0 
                };
            }
            
            hierarchy[dept].machines[machine].sections[section].items.push(row);
            hierarchy[dept].machines[machine].sections[section].total += row.valorSalida;
            hierarchy[dept].machines[machine].total += row.valorSalida;
            hierarchy[dept].total += row.valorSalida;
        });

        return hierarchy;
    },

    // Get data for specific machine
    getMachineData(machineName) {
        const machineRecords = this.filteredData.filter(row => 
            row.maquinaria === machineName
        );
        
        if (machineRecords.length === 0) return null;

        const total = machineRecords.reduce((sum, row) => sum + row.valorSalida, 0);
        
        return {
            name: machineName,
            department: machineRecords[0].departamento,
            section: machineRecords[0].seccion,
            total: total,
            count: machineRecords.length,
            records: machineRecords.sort((a, b) => b.fecha - a.fecha)
        };
    },

    // Get monthly breakdown for a specific period
    getPeriodBreakdown(year, month) {
        const periodData = this.rawData.filter(row => 
            row.fecha.getFullYear() === year && row.mes === month
        );

        const byDept = {};
        const byType = {};
        
        periodData.forEach(row => {
            const dept = row.departamento || 'Sin Departamento';
            const type = row.tipoMantenimiento || 'Sin Tipo';
            
            byDept[dept] = (byDept[dept] || 0) + row.valorSalida;
            byType[type] = (byType[type] || 0) + row.valorSalida;
        });

        return {
            total: periodData.reduce((sum, row) => sum + row.valorSalida, 0),
            count: periodData.length,
            byDepartment: byDept,
            byType: byType
        };
    },

    // Format currency for export (reverse of parseCurrency)
    formatCurrencyForExport(value) {
        // Format as "1.234,56" (European/Guatemalan format)
        const parts = value.toFixed(2).split('.');
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${intPart},${parts[1]}`;
    },

    // Format date for export (DD/MM/YYYY)
    formatDateForExport(date) {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    // Export data to CSV
    exportToCSV(dataType = 'filtered') {
        const data = dataType === 'all' ? this.rawData : this.filteredData;
        
        // Define column headers
        const headers = [
            'No. Salida',
            'Fecha Contabilizacion',
            'Dia',
            'Semana',
            'Mes',
            'Articulo',
            'Descripcion',
            'Cantidad',
            'Costo Articulo',
            'Valor Salida',
            'Nombre Autorizador',
            'Encargado',
            'Departamento',
            'Maquinaria',
            'Seccion',
            'Mercado',
            'Comentario',
            'Bodeguero',
            'Tipo Mantenimiento'
        ];

        // Convert data to CSV format
        const csvData = data.map(row => [
            row.salida,
            this.formatDateForExport(row.fecha),
            row.dia,
            row.semana,
            row.mes,
            row.articulo,
            row.descripcion,
            row.cantidad,
            this.formatCurrencyForExport(row.costoArticulo),
            this.formatCurrencyForExport(row.valorSalida),
            row.autorizador,
            row.encargado,
            row.departamento,
            row.maquinaria,
            row.seccion,
            row.mercado,
            row.comentario,
            row.bodeguero,
            row.tipoMantenimiento
        ]);

        // Use PapaParse to generate CSV
        const csv = Papa.unparse({
            fields: headers,
            data: csvData
        });

        // Download file
        this.downloadFile(csv, `presupuestos_${dataType}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    },

    // Export data to Excel
    exportToExcel(dataType = 'filtered') {
        const data = dataType === 'all' ? this.rawData : this.filteredData;
        
        // Prepare data for Excel
        const excelData = data.map(row => ({
            'No. Salida': row.salida,
            'Fecha Contabilizacion': this.formatDateForExport(row.fecha),
            'Dia': row.dia,
            'Semana': row.semana,
            'Mes': row.mes,
            'Articulo': row.articulo,
            'Descripcion': row.descripcion,
            'Cantidad': row.cantidad,
            'Costo Articulo': this.formatCurrencyForExport(row.costoArticulo),
            'Valor Salida': this.formatCurrencyForExport(row.valorSalida),
            'Nombre Autorizador': row.autorizador,
            'Encargado': row.encargado,
            'Departamento': row.departamento,
            'Maquinaria': row.maquinaria,
            'Seccion': row.seccion,
            'Mercado': row.mercado,
            'Comentario': row.comentario,
            'Bodeguero': row.bodeguero,
            'Tipo Mantenimiento': row.tipoMantenimiento
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Presupuestos');

        // Generate Excel file and download
        XLSX.writeFile(wb, `presupuestos_${dataType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    },

    // Helper function to download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // Import data from file
    async importFromFile(file, replaceExisting = true) {
        return new Promise((resolve, reject) => {
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (fileExtension === 'csv') {
                // Import CSV
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        try {
                            const importedData = this.processImportedData(results.data);
                            this.mergeImportedData(importedData, replaceExisting);
                            resolve({
                                success: true,
                                count: importedData.length,
                                message: `Se importaron ${importedData.length} registros correctamente.`
                            });
                        } catch (error) {
                            reject({
                                success: false,
                                message: `Error al procesar el CSV: ${error.message}`
                            });
                        }
                    },
                    error: (error) => {
                        reject({
                            success: false,
                            message: `Error al leer el archivo CSV: ${error.message}`
                        });
                    }
                });
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Import Excel
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                        
                        const importedData = this.processImportedData(jsonData);
                        this.mergeImportedData(importedData, replaceExisting);
                        resolve({
                            success: true,
                            count: importedData.length,
                            message: `Se importaron ${importedData.length} registros correctamente.`
                        });
                    } catch (error) {
                        reject({
                            success: false,
                            message: `Error al procesar el archivo Excel: ${error.message}`
                        });
                    }
                };
                reader.onerror = () => {
                    reject({
                        success: false,
                        message: 'Error al leer el archivo Excel'
                    });
                };
                reader.readAsArrayBuffer(file);
            } else {
                reject({
                    success: false,
                    message: 'Formato de archivo no soportado. Use CSV o Excel.'
                });
            }
        });
    },

    // Process imported data to match internal format
    processImportedData(data) {
        return data.map((row, index) => {
            const fecha = this.parseDate(row['Fecha Contabilizacion'] || row['Fecha']);
            
            // Calculate date fields from fecha if not present in CSV
            let dia = parseInt(row['Dia']) || 0;
            let mes = parseInt(row['Mes']) || 0;
            let semana = parseInt(row['Semana']) || 0;
            
            if (fecha) {
                if (!dia) dia = fecha.getDate();
                if (!mes) mes = fecha.getMonth() + 1; // JavaScript months are 0-indexed
                if (!semana) semana = this.getWeekNumber(fecha);
            }
            
            return {
                id: this.rawData.length + index,
                salida: row['No. Salida'] || row['No Salida'] || '',
                fecha: fecha,
                fechaStr: row['Fecha Contabilizacion'] || row['Fecha'] || '',
                dia: dia,
                semana: semana,
                mes: mes,
                articulo: row['Articulo'] || '',
                descripcion: row['Descripcion'] || '',
                cantidad: parseFloat(row['Cantidad']) || 0,
                costoArticulo: this.parseCurrency(row['Costo Articulo'] || row['Costo']),
                valorSalida: this.parseCurrency(row['Valor Salida'] || row['Valor']),
                autorizador: row['Nombre Autorizador'] || row['Autorizador'] || '',
                encargado: row['Encargado'] || '',
                departamento: row['Departamento'] || '',
                maquinaria: row['Maquinaria'] || '',
                seccion: row['Seccion'] || '',
                mercado: row['Mercado'] || '',
                comentario: row['Comentario'] || '',
                bodeguero: row['Bodeguero'] || '',
                tipoMantenimiento: row['Tipo Mantenimiento'] || row['Tipo'] || ''
            };
        }).filter(row => row.fecha && row.valorSalida > 0);
    },

    // Merge imported data with existing data
    mergeImportedData(importedData, replaceExisting) {
        if (replaceExisting) {
            this.rawData = importedData;
        } else {
            this.rawData = [...this.rawData, ...importedData];
        }
        this.filteredData = [...this.rawData];
    },

    // === PRODUCTION LINE CONFIGURATION ===
    
    // Get all unique machines
    getUniqueMachines() {
        const machines = new Set();
        this.rawData.forEach(row => {
            if (row.maquinaria) {
                machines.add(row.maquinaria);
            }
        });
        return Array.from(machines).sort();
    },

    // Save production lines configuration to localStorage
    saveProductionLinesConfig(productionLines) {
        try {
            localStorage.setItem('productionLines', JSON.stringify(productionLines));
            return true;
        } catch (error) {
            console.error('Error saving production lines config:', error);
            return false;
        }
    },

    // Load production lines configuration from localStorage
    getProductionLinesConfig() {
        try {
            const stored = localStorage.getItem('productionLines');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading production lines config:', error);
            return [];
        }
    },

    // Get hierarchical structure by Machine -> Section (for production lines)
    getProductionLineHierarchy() {
        const productionLines = this.getProductionLinesConfig();
        const hierarchy = {};
        
        this.filteredData.forEach(row => {
            const machine = row.maquinaria || 'Sin Máquina';
            
            // Only include if this machine is marked as a production line
            if (!productionLines.includes(machine)) {
                return;
            }
            
            const section = row.seccion || 'Sin Sección';
            
            if (!hierarchy[machine]) {
                hierarchy[machine] = { 
                    sections: {}, 
                    total: 0,
                    department: row.departamento || 'Sin Departamento'
                };
            }
            
            if (!hierarchy[machine].sections[section]) {
                hierarchy[machine].sections[section] = { 
                    items: [], 
                    total: 0 
                };
            }
            
            hierarchy[machine].sections[section].items.push(row);
            hierarchy[machine].sections[section].total += row.valorSalida;
            hierarchy[machine].total += row.valorSalida;
        });

        return hierarchy;
    },

    // Get aggregated data by production lines
    getProductionLineAggregation() {
        const productionLines = this.getProductionLinesConfig();
        const machineData = this.groupBy('maquinaria');
        
        return Object.entries(machineData)
            .filter(([machine]) => productionLines.includes(machine))
            .map(([machine, items]) => ({
                machine: machine,
                total: items.reduce((sum, item) => sum + item.valorSalida, 0),
                count: items.length,
                dept: items[0].departamento,
                sections: [...new Set(items.map(item => item.seccion))].length
            }))
            .sort((a, b) => b.total - a.total);
    },

    // Check if a machine is configured as a production line
    isProductionLine(machineName) {
        const productionLines = this.getProductionLinesConfig();
        return productionLines.includes(machineName);
    }
};
