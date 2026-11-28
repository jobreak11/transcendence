// import { React } from "react";

const HandInfo = ({ handleHandInfo } : { handleHandInfo: () => void }) => {
    return <div className="fixed inset-0 z-5000 flex backdrop-filter backdrop-brightness-75 backdrop-blur-md
    items-center justify-center" 
    onClick={handleHandInfo}>
        <div className="flex w-full h-full items-center justify-center">
            <img
      src={`/img/HandInfo/hand_ranking.svg`}
      className="h-full object-contain"
    />
        </div>
    </div>;
};

export default HandInfo;