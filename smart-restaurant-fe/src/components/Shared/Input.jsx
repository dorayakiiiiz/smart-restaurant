

export default function Input({ type, value, placeholder, setState, disabled = false }) {
    return (
        <input 
                type={type}
                value={value}
                disabled={disabled}
                className={`h-[50px] w-full max-w-[500px] my-[10px] rounded-xl bg-[#f7f8f6] px-[20px] ${disabled && 'cursor-not-allowed text-gray-400'}`}
                placeholder={placeholder}
                onChange={e => setState(e.target.value)}
        />
    )
}