import FileCard from "./FileCard";
function FileList({ files }: { files: any[] }) {
  return (
    <div className="w-full h-full grid gap-2 justify-items-center grid-cols-1 md:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} {...file} />
      ))}
    </div>
  );
}

export default FileList;
