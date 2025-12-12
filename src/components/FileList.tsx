
import FileCard from "./FileCard";
function FileList({ files }: { files: any[] }) {
  return (
    <div className="w-full h-full grid justify-items-center grid-cols-1 md:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} {...file} />
      ))}
    </div>
  );
}

export default FileList;
