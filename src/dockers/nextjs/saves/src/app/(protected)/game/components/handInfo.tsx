// import { React } from "react";

const HandInfo = ({ handleHandInfo } : { handleHandInfo: () => void }) => {
    return <div className="fixed inset-0 z-50 flex backdrop-filter backdrop-brightness-75 backdrop-blur-md
    items-center justify-center" 
    onClick={handleHandInfo}>
        <div className="flex bg-black text-white w-[50%] h-[50%] items-center justify-center">Test</div>
    </div>;
};

export default HandInfo;