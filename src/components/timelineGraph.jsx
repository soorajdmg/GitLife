import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartLine } from 'lucide-react';
import { api } from '../config/api';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import './timelineGraph.css';

const TimelineGraph = () => {
    const { refreshTrigger } = useDataRefresh();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            try {
                setLoading(true);

                // Fetch all decisions and branches
                const [decisions, branches] = await Promise.all([
                    api.getDecisions({ sortBy: 'timestamp', sortOrder: 'asc' }),
                    api.getBranches()
                ]);

                if (decisions.length === 0) {
                    setChartData([]);
                    setLoading(false);
                    return;
                }

                // Process data to create timeline graph
                const processedData = processDecisionsForGraph(decisions, branches);
                setChartData(processedData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching timeline data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAndProcessData();

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchAndProcessData, 10000);
        return () => clearInterval(interval);
    }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

    // Process decisions into graph data points
    const processDecisionsForGraph = (decisions, branches) => {
        if (decisions.length === 0) return [];

        // Group decisions by date
        const decisionsByDate = {};

        decisions.forEach(decision => {
            const date = new Date(decision.timestamp);
            const dateKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            if (!decisionsByDate[dateKey]) {
                decisionsByDate[dateKey] = {
                    main: [],
                    whatIf: []
                };
            }

            // Determine if this is main timeline or what-if branch
            const branch = branches.find(b => b.name === decision.branch_name);
            const isWhatIf = branch && (branch.type === 'what-if' || branch.type === 'alternative');

            if (isWhatIf) {
                decisionsByDate[dateKey].whatIf.push(decision);
            } else {
                decisionsByDate[dateKey].main.push(decision);
            }
        });

        // Calculate cumulative impact scores for each date
        let cumulativeMain = 0;
        let cumulativeWhatIf = 0;

        const graphData = Object.entries(decisionsByDate).map(([date, data]) => {
            // Calculate average impact for decisions on this date
            const mainImpact = data.main.length > 0
                ? data.main.reduce((sum, d) => sum + (d.impact || 0), 0) / data.main.length
                : 0;

            const whatIfImpact = data.whatIf.length > 0
                ? data.whatIf.reduce((sum, d) => sum + (d.impact || 0), 0) / data.whatIf.length
                : 0;

            cumulativeMain += mainImpact;
            cumulativeWhatIf += whatIfImpact;

            return {
                day: date,
                currentTimeline: Math.min(Math.round(cumulativeMain), 100),
                whatIf: Math.min(Math.round(cumulativeWhatIf), 100),
                mainDecisions: data.main.length,
                whatIfDecisions: data.whatIf.length
            };
        });

        // Return the last 7-14 data points for better visualization
        return graphData.slice(-14);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            return (
                <div className="timeline-tooltip">
                    <p className="tooltip-label">{`${label}`}</p>
                    <p className="timeline-value">
                        <span className="dot current-dot"></span>
                        Main Timeline: {payload[0]?.value || 0}
                        {data?.mainDecisions > 0 && ` (${data.mainDecisions} decisions)`}
                    </p>
                    {payload[1] && (
                        <p className="whatif-value">
                            <span className="dot whatif-dot"></span>
                            What If: {payload[1]?.value || 0}
                            {data?.whatIfDecisions > 0 && ` (${data.whatIfDecisions} decisions)`}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="timelineg-section">
                <div className="timelinesg-header">
                    <ChartLine className="timelineg-header-icon" />
                    <h2 className="timelineg-title">Life Branches</h2>
                </div>
                <div className="timelineg-container">
                    <div className="timelineg-content">
                        <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#9ca3af' }}>Loading your life timeline...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="timelineg-section">
                <div className="timelinesg-header">
                    <ChartLine className="timelineg-header-icon" />
                    <h2 className="timelineg-title">Life Branches</h2>
                </div>
                <div className="timelineg-container">
                    <div className="timelineg-content">
                        <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ color: '#f87171' }}>Error loading timeline: {error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="timelineg-section">
                <div className="timelinesg-header">
                    <ChartLine className="timelineg-header-icon" />
                    <h2 className="timelineg-title">Life Branches</h2>
                </div>
                <div className="timelineg-container">
                    <div className="timelineg-content">
                        <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ color: '#9ca3af', textAlign: 'center' }}>No decisions yet!</p>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>
                                Start making life choices to see your timeline graph
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="timelineg-section">
            <div className="timelinesg-header">
                <ChartLine className="timelineg-header-icon" />
                <h2 className="timelineg-title">Life Branches</h2>
            </div>
            <div className="timelineg-container">
                <div className="timelineg-content">
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                className="timelineg-chart"
                            >
                                <CartesianGrid strokeDasharray="3 3" className="timelineg-grid" />
                                <XAxis
                                    dataKey="day"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    domain={[0, 100]}
                                    tick={{ fill: '#9ca3af' }}
                                    label={{ value: 'Impact Score', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="currentTimeline"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    name="Main Timeline"
                                    dot={{ r: 4, className: 'timeline-dot-current' }}
                                    activeDot={{ r: 6, className: 'timeline-dot-current-active' }}
                                    className="timeline-line-current"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="whatIf"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    name="What If..."
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, className: 'timeline-dot-whatif' }}
                                    activeDot={{ r: 6, className: 'timeline-dot-whatif-active' }}
                                    className="timeline-line-whatif"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="timelineg-legend">
                        <div className="legend-item">
                            <span className="legend-line current"></span>
                            <span>Main Timeline (main-timeline branch)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-line whatif"></span>
                            <span>What If Branches (alternative paths)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGraph;