

export default function Input({ type, value, placeholder, setState }) {
    return (
        <input 
                type={type}
                value={value}
                className="h-[50px] w-full max-w-[500px] my-[10px] rounded-xl bg-[#f7f8f6] px-[20px]"
                placeholder={placeholder}
                onChange={e => setState(e.target.value)}
        />
    )
}