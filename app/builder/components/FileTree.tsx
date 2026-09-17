"use client";

export default function FileTree({
  files,
  activeFile,
  setActiveFile,
}: any) {
  return (
    <div className="border border-secondary-800 bg-[#05080c] h-full flex flex-col">
      <div className="p-3 bg-secondary-900 border-b border-secondary-800 shrink-0">
        <h2 className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-secondary-600 block"></span>
          File_Explorer
        </h2>
      </div>
      <div className="p-2 overflow-y-auto flex-1 font-mono text-xs text-secondary-400">
        {Object.keys(files).map((file) => {
          const isActive = activeFile === file;
          return (
            <div
              key={file}
              onClick={() => setActiveFile(file)}
              className={`p-2 cursor-pointer flex items-center gap-3 transition-colors group mb-1 ${
                isActive 
                  ? "bg-primary-900/10 text-primary-400 border-l-2 border-primary-500" 
                  : "hover:bg-secondary-900 hover:text-white border-l-2 border-transparent"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-500' : 'text-secondary-600 group-hover:text-secondary-400'}`}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="truncate">{file}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}