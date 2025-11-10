import pkg from "../../package.json";
function Footer() {
  return (
    <footer className="text-center text-sm text-gray-500 py-8">
      © 2025 DAA’ist || V {pkg.version} (Preview Access || Test for
      bugs/functionality)
    </footer>
  );
}

export default Footer;
