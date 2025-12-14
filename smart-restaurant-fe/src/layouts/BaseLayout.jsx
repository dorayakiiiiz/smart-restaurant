import Navbar from "../components/Shared/Navbar";
import Footer from "../components/Shared/Footer";
import { Outlet } from "react-router-dom";

export default function BaseLayout() {
    return (
        <>
            <Navbar />
            <main className="bg-[] pt-[70px] min-h-[700px]">
                <Outlet />
            </main>
            <Footer />
        </>
    )
}