import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartLine } from 'lucide-react';
import './TimelineGraph.css';

const TimelineGraph = ({ data = [] }) => {
    const sampleData = [
        { day: 'Mon', currentTimeline: 70, whatIf: 40 },
        { day: 'Tue', currentTimeline: 60, whatIf: 80 },
        { day: 'Wed', currentTimeline: 90, whatIf: 50 },
        { day: 'Thu', currentTimeline: 75, whatIf: 85 },
        { day: 'Fri', currentTimeline: 85, whatIf: 65 },
        { day: 'Sat', currentTimeline: 30, whatIf: 88 },
        { day: 'Sun', currentTimeline: 76, whatIf: 82 },

    ];

    const chartData = data.length > 0 ? data : sampleData;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="timeline-tooltip">
                    <p className="tooltip-label">{`${label}`}</p>
                    <p className="timeline-value">
                        <span className="dot current-dot"></span>
                        Current: {payload[0].value}
                    </p>
                    <p className="whatif-value">
                        <span className="dot whatif-dot"></span>
                        What If: {payload[1].value}
                    </p>
                </div>
            );
        }
        return null;
    };

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
                                    stroke="#666"
                                    tick={{ fill: '#666' }}
                                />
                                <YAxis
                                    stroke="#666"
                                    domain={[0, 100]}
                                    tick={{ fill: '#666' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="currentTimeline"
                                    stroke="#8884d8"
                                    strokeWidth={3}
                                    name="Current Timeline"
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
                            <span>Current Timeline</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-line whatif"></span>
                            <span>What If...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineGraph;