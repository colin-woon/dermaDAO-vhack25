import { useState, useEffect } from 'react';

const PendingProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [showScoringModal, setShowScoringModal] = useState(false);
    const [scores, setScores] = useState({
        impact: 0,
        methodology: 0,
        sustainability: 0,
        budget: 0,
        timeline: 0
    });

    // Mock data for demonstration
    const mockProposals = [
        {
            id: 1,
            projectName: "Project A",
            description: "Description of Project A",
            goalAmount: "10 DMC",
            aiScore: 85,
            donorScores: [
                { donor: "0x123...456", score: 88 }
            ],
            proposal: {
                impact: "This project aims to...",
                methodology: "We will implement...",
                sustainability: "The long-term impact...",
                budget_breakdown: "Budget allocation...",
                timeline: "Project milestones..."
            },
            status: "Pending",
            requiredScores: 2,
            currentScores: 1
        },
        {
            id: 2,
            projectName: "Project B",
            description: "Description of Project B",
            goalAmount: "15 DMC",
            aiScore: 82,
            donorScores: [],
            proposal: {
                impact: "Project B will address...",
                methodology: "The approach involves...",
                sustainability: "Sustainability measures...",
                budget_breakdown: "Fund distribution...",
                timeline: "Key dates..."
            },
            status: "Pending",
            requiredScores: 2,
            currentScores: 0
        }
    ];

    useEffect(() => {
        // In real implementation, fetch from API
        setProposals(mockProposals);
    }, []);

    const handleScoreSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Calculate average score
            const scoreValues = Object.values(scores);
            const averageScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

            // Mock API call to submit score
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update proposals list
            setProposals(prevProposals =>
                prevProposals.map(p =>
                    p.id === selectedProposal.id
                        ? {
                            ...p,
                            donorScores: [...p.donorScores, { donor: "0x789...012", score: averageScore }],
                            currentScores: p.currentScores + 1
                        }
                        : p
                )
            );

            setShowScoringModal(false);
            setSelectedProposal(null);
            setScores({
                impact: 0,
                methodology: 0,
                sustainability: 0,
                budget: 0,
                timeline: 0
            });

            alert('Score submitted successfully!');
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('Error submitting score');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Pending Proposals</h2>
            <div className="space-y-6">
                {proposals.map((proposal) => (
                    <div key={proposal.id} className="bg-purple-950/90 rounded-lg p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-semibold">{proposal.projectName}</h3>
                                <p className="text-gray-400">{proposal.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">Goal Amount: <span className="text-violet-400">{proposal.goalAmount}</span></p>
                                <p className="text-sm">AI Score: <span className="text-green-400">{proposal.aiScore}/100</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-2">Impact & Significance</h4>
                                <p className="text-gray-400">{proposal.proposal.impact}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Methodology</h4>
                                <p className="text-gray-400">{proposal.proposal.methodology}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Sustainability</h4>
                                <p className="text-gray-400">{proposal.proposal.sustainability}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Budget Breakdown</h4>
                                <p className="text-gray-400">{proposal.proposal.budget_breakdown}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-purple-800">
                            <div className="text-sm">
                                <span className="text-gray-400">Scores received: </span>
                                <span className="font-medium">{proposal.currentScores}/{proposal.requiredScores}</span>
                            </div>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    setSelectedProposal(proposal);
                                    setShowScoringModal(true);
                                }}
                                disabled={proposal.donorScores.some(score => score.donor === "0x789...012")} // Check if current user has already scored
                            >
                                Score Proposal
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scoring Modal */}
            {showScoringModal && selectedProposal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-950 p-6 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-4 sticky top-0 bg-gray-950 py-2 z-10 border-b border-gray-800">
                            Score Proposal: {selectedProposal.projectName}
                        </h3>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <form onSubmit={handleScoreSubmit} className="space-y-6">
                                {Object.entries(scores).map(([criterion, score]) => (
                                    <div key={criterion} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            {criterion.charAt(0).toUpperCase() + criterion.slice(1)} Score
                                        </label>
                                        <div className="w-full">
                                            <input
                                                type="range"
                                                min={1}
                                                max={5}
                                                value={Math.max(1, Math.round(score / 20))} // Convert 0-100 to 1-5
                                                className="range range-primary w-full"
                                                step="1"
                                                onChange={(e) => setScores(prev => ({
                                                    ...prev,
                                                    [criterion]: parseInt(e.target.value) * 20 // Convert back to 0-100
                                                }))}
                                            />
                                            <div className="flex justify-between px-2.5 mt-2 text-xs">
                                                <span>|</span>
                                                <span>|</span>
                                                <span>|</span>
                                                <span>|</span>
                                                <span>|</span>
                                            </div>
                                            <div className="flex justify-between px-2.5 mt-2 text-xs">
                                                <span>1</span>
                                                <span>2</span>
                                                <span>3</span>
                                                <span>4</span>
                                                <span>5</span>
                                            </div>
                                            <div className="text-center mt-2 text-sm text-gray-400">
                                                Score: {Math.round(score / 20)} out of 5
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </form>
                        </div>
                        <div className="pt-4 bg-gray-950 mt-4 border-t border-gray-800 flex justify-end space-x-3">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowScoringModal(false);
                                    setSelectedProposal(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleScoreSubmit}
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : 'Submit Score'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingProposals;
