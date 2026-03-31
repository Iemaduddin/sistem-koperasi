export default function Footbar() {
    return (
        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-5 text-sm text-slate-500">
            <span>
                © {new Date().getFullYear()} Azzahwa Mitra Koperasi. All rights
                reserved.
            </span>
            <span>Created by ___</span>
        </footer>
    );
}
