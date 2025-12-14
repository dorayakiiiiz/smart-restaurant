import React from 'react';

export default function AdminTable({ columns, data, isLoading, actions }) {
    if (isLoading) {
        return <div className="w-full p-10 text-center text-gray-500">Loading data...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="w-full p-10 text-center text-gray-500">No records found.</div>;
    }

    return (
        <div className="overflow-auto bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100">
            <table className="w-full text-left border-collapse relative">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 uppercase sticky top-0 z-10">
                        {columns.map((col, index) => (
                            <th key={index} className="px-6 py-4 font-semibold whitespace-nowrap">
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="px-6 py-4 font-semibold text-left whitespace-nowrap">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((item, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                            {columns.map((col, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                    {col.render ? col.render(item) : item[col.accessor]}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4 text-left whitespace-nowrap">
                                    {actions(item)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}