import { useRef, useEffect, useState, act } from 'react'

export type LoadProgress = {
    progress: number;
    total: number;
}

const ProgressBar = ({ progress, total }: LoadProgress) => {
    const value = progress / total;
    const normalizedValue = Math.min(Math.max(value, 0), 1) * 100; // convert to percentage

    return (
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${normalizedValue}%` }}
            ></div>
        </div>
    );
};


type LoadingScreenProps = {
    Module: any;

};

function LoadingScreen({ Module }: LoadingScreenProps) {

    const [loadProgress, setLoadProgress] = useState<LoadProgress>({ progress: 0, total: 1 });

    Module.updateLoadingProgress = (progress: number, total: number) => {
        setLoadProgress({ progress: progress, total: total });
    };

    return (

        <div>
            {loadProgress.progress < loadProgress.total &&
                <div
                    className="flex flex-col items-center justify-center h-screen bg-grey-100 space-y-4">
                    <p className="text-lg font-medium">Loading... {Math.floor(loadProgress.progress / loadProgress.total * 100)}%</p>
                    <div className="w-64">
                        <ProgressBar progress={loadProgress.progress} total={loadProgress.total} />
                    </div>
                </div>
            }
        </div>
    )
}


export default LoadingScreen;