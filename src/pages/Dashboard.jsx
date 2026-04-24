import StatsCards from '../components/StatsCards';
import TimelineGraph from '../components/timelineGraph';
import MoodChart from '../components/MoodChart';
import Timeline from '../components/timeline';
import CommitHistory from '../components/commitHistory';

export default function Dashboard() {
  return (
    <div className="page-content">
      <StatsCards />
      <MoodChart />
      <TimelineGraph />
      <Timeline />
      <CommitHistory />
    </div>
  );
}
