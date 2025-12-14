import { useState } from "react"

export default function DeleteModal({ onClose, deleteId, removeFunc, confirmMessage, successLog }) {

    const [log, setLog] = useState({ type: '', content: '' });

    const handleDelete = () => {
        removeFunc(deleteId);

        setLog({
            type: 'success',
            content: successLog
        });

        setTimeout(() => onClose(), 1500);
    }

    return (
        <div
            className="fixed inset-0 z-100 bg-black/50 backdrop-blur flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-full max-w-[560px] px-[50px] py-[30px] min-h-[220px] bg-[#fff] md:rounded-3xl"
                onClick={e => e.stopPropagation()}
            >


                <div className="font-momo text-2xl text-[#ff3838]">
                    {confirmMessage}
                </div>

                <div className="font-quicksand mt-[10px]">
                    This action cannot be undone.
                </div>

                <div className={`w-full text-center h-[12px] my-[10px] ${log.type == 'error' ? 'text-[red]' : 'text-[green] success-glow'} font-semibold`}>
                    {log.content}
                </div>

                <div className="flex mt-[14px] items-center justify-center gap-[20px]">
                    <div
                        className="cursor-pointer bg-[#ccc] hover:bg-[#e0e0e0] text-[#fff] rounded-xl px-[20px] py-[10px]"
                        onClick={onClose}
                    >
                        Cancel
                    </div>

                    <div
                        className="cursor-pointer bg-[#fc5050] hover:bg-[#ff9696] text-[#fff] rounded-xl px-[20px] py-[10px]"
                        onClick={handleDelete}
                    >
                        Delete
                    </div>
                </div>


            </div>


        </div>
    )

}