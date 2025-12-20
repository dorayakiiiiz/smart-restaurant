import { useState } from "react";

const mockOrders = [
    { id: 1, item: "Pizza", status: "Pending" },
    { id: 2, item: "Burger", status: "In Progress" },
    { id: 3, item: "Salad", status: "Completed" },
    { id: 4, item: "Pasta", status: "Pending" },
    { id: 5, item: "Sushi", status: "In Progress" },
]



export default function Test() {
    const [search, setSearch] = useState('')

    const filterOrders = mockOrders.filter((mockOrder) => {
        return mockOrder.item.toLowerCase().includes(search.toLowerCase())
    })
    return (
        <div>
            <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="bg-amber-100"
            />
            <div className="grid grid-cols-2 gap-4">
                {filterOrders.length > 0 ? 
                    (filterOrders.map((filterOrder) => {
                        return <div className="bg-[#e7cde7aa]">
                            {filterOrder.item}
                        </div>
                        })) : 

                        (<div>
                            No data matched
                        </div>)
                    }
            </div>
        </div>
    )
}