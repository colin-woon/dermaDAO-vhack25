const Table = ({ data = [] }) => {
    if (!data.length) {
        return (
            <div className="text-center text-gray-400 py-8">
                No transactions to display
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full bg-gray-700">
                <thead>
                    <tr className="border-b border-gray-600">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Recipient
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                    {data.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-600 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {row.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {row.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    row.status === 'Completed' 
                                        ? 'bg-green-800 text-green-200' 
                                        : 'bg-yellow-800 text-yellow-200'
                                }`}>
                                    {row.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                                {row.recipient}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;