import DonorDashboardNavBar from './DonorDashboardNavBar';
import Footer from './Footer';
import Table from './Table';
import CardDonorDashboard from './CardDonorDashboard';
import PendingProposals from './PendingProposals';
import { useState, useEffect } from 'react';
import { FlickeringGrid } from './magicui/flickering-grid';

const DonorDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'proposals'

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const data = await response.json();
            setProjects(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            setError(err.message);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className='relative flex flex-col justify-between min-h-screen bg-gray-950'>
            <div className="fixed inset-0">
                <FlickeringGrid
                    color="rgb(80, 5, 255)"
                    maxOpacity={0.5}
                    className="w-full h-full"
                    squareSize={3}
                    gridGap={3}
                    flickerChance={0.7}
                />
            </div>
            <div className="relative z-10">
                <DonorDashboardNavBar />
                <div className='flex flex-col justify-around min-h-screen p-10 space-y-12'>
                    {/* Tab Navigation */}
                    <div className="tabs tabs-boxed justify-center bg-transparent gap-2">
                        <button
                            className={`tab ${activeTab === 'projects' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('projects')}
                        >
                            Active Projects
                        </button>
                        <button
                            className={`tab ${activeTab === 'proposals' ? 'tab-active' : ''}`}
                            onClick={() => setActiveTab('proposals')}
                        >
                            Pending Proposals
                        </button>
                    </div>

                    {/* Content based on active tab */}
                    {activeTab === 'projects' ? (
                        <div className='flex flex-row flex-wrap justify-evenly gap-8 w-full'>
                            {loading ? (
                                <div className="flex items-center justify-center w-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
                                </div>
                            ) : error ? (
                                <div className="text-red-500 text-center w-full">{error}</div>
                            ) : !projects || projects.length === 0 ? (
                                <div className="text-gray-400 text-center w-full">No projects found</div>
                            ) : (
                                projects.map((project) => (
                                    <CardDonorDashboard key={project.id} project={project} />
                                ))
                            )}
                        </div>
                    ) : (
                        <PendingProposals />
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
}

export default DonorDashboard;
