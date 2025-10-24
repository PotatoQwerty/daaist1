import { yearOptions } from "../../../../constants/uploadConstants";
import Link from "next/link";
export default function FilesList() {
  return (
    <div className="p-4 flex flex-col justify-center items-center w-full h-screen">
      <h1 className="text-2xl font-bold mt-4 mb-2">View courses by year</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full h-full place-items-center">
        {yearOptions.map((item) => (
          <div key={item.value}>
            <Link
              href={`/courses/${item.value}`}
              className="flex items-center justify-center p-3 bg-accent hover:bg-accent/80 hover:scale-110 rounded-2xl w-[240px] h-[240px] transition-all ease-in-out duration-200"
            >
              <span className="font-bold">{item.label}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
