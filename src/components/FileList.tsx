import FileCard from "./FileCard";
function FileList({ files }: { files: any[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} {...file} />
      ))}
    </div>
  );
}

export default FileList;
