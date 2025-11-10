// Advanced Charting and Analytics for Interview Performance
class PerformanceCharts {
    constructor() {
        this.charts = new Map();
        this.performanceData = {
            technical: [],
            communication: [],
            behavioral: [],
            responseTimes: [],
            wordCounts: []
        };
        
        this.initializeCharts();
    }

    initializeCharts() {
        this.createRadarChart();
        this.createProgressChart();
        this.createTimeSeriesChart();
        this.createScoreDistributionChart();
    }

    createRadarChart() {
        const ctx = document.getElementById('radarChart');
        if (!ctx) return;

        this.charts.set('radar', new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Technical Knowledge', 'Communication', 'Behavioral', 'Confidence', 'Structure', 'Examples'],
                datasets: [{
                    label: 'Current Performance',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        suggestedMin: 0,
                        suggestedMax: 10,
                        ticks: {
                            stepSize: 2,
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}/10`;
                            }
                        }
                    }
                }
            }
        }));
    }

    createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        this.charts.set('progress', new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Technical Score',
                    data: [],
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Communication Score',
                    data: [],
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Behavioral Score',
                    data: [],
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 2
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}/10`;
                            }
                        }
                    }
                }
            }
        }));
    }

    createTimeSeriesChart() {
        const ctx = document.getElementById('timeSeriesChart');
        if (!ctx) return;

        this.charts.set('timeSeries', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time (seconds)',
                    data: [],
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Word Count',
                    data: [],
                    type: 'line',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Response Time (s)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Word Count'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Response Time: ${context.parsed.y}s`;
                                } else {
                                    return `Word Count: ${context.parsed.y}`;
                                }
                            }
                        }
                    }
                }
            }
        }));
    }

    createScoreDistributionChart() {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        this.charts.set('distribution', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Technical', 'Communication', 'Behavioral'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed / total) * 100);
                                return `${context.label}: ${context.parsed}/10 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        }));
    }

    updateRealTimeCharts(analysis) {
        // Update performance data
        this.performanceData.technical.push(analysis.scores.technical);
        this.performanceData.communication.push(analysis.scores.communication);
        this.performanceData.behavioral.push(analysis.scores.behavioral);

        // Update radar chart
        this.updateRadarChart(analysis);

        // Update progress chart
        this.updateProgressChart();

        // Update time series chart
        this.updateTimeSeriesChart(analysis);

        // Update distribution chart
        this.updateDistributionChart();
    }

    updateRadarChart(analysis) {
        const radarChart = this.charts.get('radar');
        if (radarChart) {
            const radarData = [
                analysis.scores.technical,
                analysis.scores.communication,
                analysis.scores.behavioral,
                analysis.sentiment_analysis?.compound * 5 + 5 || 5, // Convert -1 to 1 scale to 0-10
                analysis.complexity_metrics?.sentence_count > 3 ? 8 : 5, // Structure score
                analysis.detailed_feedback.technical.some(f => f.includes('example')) ? 8 : 5 // Examples score
            ];

            radarChart.data.datasets[0].data = radarData;
            radarChart.update();
        }
    }

    updateProgressChart() {
        const progressChart = this.charts.get('progress');
        if (progressChart) {
            const questionNumbers = this.performanceData.technical.map((_, i) => `Q${i + 1}`);
            
            progressChart.data.labels = questionNumbers;
            progressChart.data.datasets[0].data = this.performanceData.technical;
            progressChart.data.datasets[1].data = this.performanceData.communication;
            progressChart.data.datasets[2].data = this.performanceData.behavioral;
            
            progressChart.update();
        }
    }

    updateTimeSeriesChart(analysis) {
        const timeSeriesChart = this.charts.get('timeSeries');
        if (timeSeriesChart) {
            const questionNumbers = this.performanceData.technical.map((_, i) => `Q${i + 1}`);
            const responseTimes = this.performanceData.responseTimes;
            const wordCounts = this.performanceData.wordCounts;

            timeSeriesChart.data.labels = questionNumbers;
            timeSeriesChart.data.datasets[0].data = responseTimes;
            timeSeriesChart.data.datasets[1].data = wordCounts;
            
            timeSeriesChart.update();
        }
    }

    updateDistributionChart() {
        const distributionChart = this.charts.get('distribution');
        if (distributionChart) {
            const avgTechnical = this.calculateAverage(this.performanceData.technical);
            const avgCommunication = this.calculateAverage(this.performanceData.communication);
            const avgBehavioral = this.calculateAverage(this.performanceData.behavioral);

            distributionChart.data.datasets[0].data = [avgTechnical, avgCommunication, avgBehavioral];
            distributionChart.update();
        }
    }

    calculateAverage(array) {
        if (array.length === 0) return 0;
        return array.reduce((a, b) => a + b, 0) / array.length;
    }

    addResponseData(responseTime, wordCount) {
        this.performanceData.responseTimes.push(responseTime);
        this.performanceData.wordCounts.push(wordCount);
    }

    // Final results visualization
    displayFinalResults(results) {
        this.createFinalScoreChart(results.scores);
        this.createImprovementAreasChart(results.insights);
        this.createComparisonChart(results.metrics);
    }

    createFinalScoreChart(scores) {
        const ctx = document.getElementById('finalScoreChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Overall', 'Technical', 'Communication', 'Behavioral'],
                datasets: [{
                    label: 'Score',
                    data: [scores.overall, scores.technical, scores.communication, scores.behavioral],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Score: ${context.parsed.y}/10`;
                            }
                        }
                    }
                }
            }
        });
    }

    createImprovementAreasChart(insights) {
        const ctx = document.getElementById('improvementChart');
        if (!ctx) return;

        const improvementAreas = this.analyzeImprovementAreas(insights);

        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: improvementAreas.map(area => area.category),
                datasets: [{
                    data: improvementAreas.map(area => area.priority),
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Priority: ${context.parsed.r}/10`;
                            }
                        }
                    }
                }
            }
        });
    }

    createComparisonChart(metrics) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        const averages = {
            technical: this.calculateAverage(metrics.technical_scores),
            communication: this.calculateAverage(metrics.communication_scores),
            behavioral: this.calculateAverage(metrics.behavioral_scores)
        };

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Question 1', 'Question 2', 'Question 3', 'Question 4', 'Question 5'],
                datasets: [{
                    label: 'Technical Scores',
                    data: metrics.technical_scores,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }, {
                    label: 'Communication Scores',
                    data: metrics.communication_scores,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }, {
                    label: 'Behavioral Scores',
                    data: metrics.behavioral_scores,
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }

    analyzeImprovementAreas(insights) {
        const areas = [
            { category: 'Technical Depth', priority: 0 },
            { category: 'Communication', priority: 0 },
            { category: 'Behavioral Examples', priority: 0 },
            { category: 'Response Structure', priority: 0 }
        ];

        insights.forEach(insight => {
            if (insight.toLowerCase().includes('technical')) {
                areas[0].priority += 3;
            }
            if (insight.toLowerCase().includes('communication') || insight.toLowerCase().includes('concise')) {
                areas[1].priority += 2;
            }
            if (insight.toLowerCase().includes('behavioral') || insight.toLowerCase().includes('star')) {
                areas[2].priority += 2;
            }
            if (insight.toLowerCase().includes('structure') || insight.toLowerCase().includes('organize')) {
                areas[3].priority += 1;
            }
        });

        return areas.filter(area => area.priority > 0)
                   .sort((a, b) => b.priority - a.priority);
    }

    // Utility methods
    destroyAllCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }

    exportChartsAsImage() {
        const chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) return;

        html2canvas(chartsContainer).then(canvas => {
            const link = document.createElement('a');
            link.download = 'interview-performance-charts.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Charts = new PerformanceCharts();
    
    // Load final results if on results page
    if (window.location.pathname.includes('results')) {
        const results = JSON.parse(sessionStorage.getItem('interviewResults'));
        if (results) {
            window.Charts.displayFinalResults(results);
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceCharts;
}