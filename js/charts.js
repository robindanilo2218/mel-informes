// Chart management module using Chart.js

const ChartManager = {
    charts: {},
    
    // Default colors
    colors: {
        primary: '#1e40af',
        secondary: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        purple: '#8b5cf6',
        gradient: [
            'rgba(30, 64, 175, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)'
        ]
    },

    // Destroy chart if exists
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    },

    // Create trend chart (Line/Area chart for monthly spending)
    createTrendChart(canvasId, data) {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const timeSeries = data || DataUtils.getMonthlyTimeSeries();
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const labels = timeSeries.map(item => 
            `${monthNames[item.month - 1]} ${item.year}`
        );
        const values = timeSeries.map(item => item.total);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gasto Mensual',
                    data: values,
                    borderColor: this.colors.primary,
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return DataUtils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create department distribution chart (Pie/Doughnut)
    createDepartmentChart(canvasId) {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const deptData = DataUtils.getDepartmentAggregation();
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: deptData.map(item => item.department),
                datasets: [{
                    data: deptData.map(item => item.total),
                    backgroundColor: this.colors.gradient,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = DataUtils.formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Create maintenance type chart (Bar chart)
    createMaintenanceChart(canvasId) {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const maintData = DataUtils.getMaintenanceTypeAggregation();
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: maintData.map(item => item.type),
                datasets: [{
                    label: 'Gasto por Tipo',
                    data: maintData.map(item => item.total),
                    backgroundColor: [
                        this.colors.danger,
                        this.colors.secondary,
                        this.colors.warning
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return DataUtils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create top machines chart (Horizontal bar)
    createTopMachinesChart(canvasId) {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const topMachines = DataUtils.getTopMachines(10);
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topMachines.map(item => {
                    const name = item.machine;
                    return name.length > 30 ? name.substring(0, 30) + '...' : name;
                }),
                datasets: [{
                    label: 'Gasto Total',
                    data: topMachines.map(item => item.total),
                    backgroundColor: this.colors.purple,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return DataUtils.formatCurrency(context.parsed.x);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create timeline chart (for chronological view)
    createTimelineChart(canvasId, mode = 'monthly') {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const timeSeries = mode === 'monthly' ? 
            DataUtils.getMonthlyTimeSeries() : 
            DataUtils.getWeeklyTimeSeries();
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const labels = timeSeries.map(item => {
            if (mode === 'monthly') {
                return `${monthNames[item.month - 1]} ${item.year}`;
            } else {
                return `S${item.week} ${item.year}`;
            }
        });
        
        const values = timeSeries.map(item => item.total);
        
        // Calculate accumulated values
        const accumulated = [];
        let sum = 0;
        values.forEach(value => {
            sum += value;
            accumulated.push(sum);
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gasto del Período',
                        data: values,
                        borderColor: this.colors.info,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Acumulado',
                        data: accumulated,
                        borderColor: this.colors.secondary,
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        tension: 0.4,
                        pointRadius: 0,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                return `${label}: ${DataUtils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create machine history chart
    createMachineChart(canvasId, machineData) {
        this.destroyChart(canvasId);
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Group records by month
        const monthly = {};
        machineData.records.forEach(record => {
            const key = `${record.fecha.getFullYear()}-${(record.mes).toString().padStart(2, '0')}`;
            if (!monthly[key]) {
                monthly[key] = 0;
            }
            monthly[key] += record.valorSalida;
        });

        const sortedMonths = Object.keys(monthly).sort();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const labels = sortedMonths.map(key => {
            const [year, month] = key.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        });
        
        const values = sortedMonths.map(key => monthly[key]);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gasto Mensual',
                    data: values,
                    backgroundColor: this.colors.gradient[0],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return DataUtils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return 'Q ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
    },

    // Update all dashboard charts
    updateDashboardCharts() {
        this.createTrendChart('trendChart');
        this.createDepartmentChart('deptChart');
        this.createMaintenanceChart('maintChart');
        this.createTopMachinesChart('topMachinesChart');
    },

    // Destroy all charts
    destroyAll() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }
};
