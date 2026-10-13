import { FaJava, FaJs, FaPython } from "react-icons/fa";

const LanguageBrandIcon = ({ language, className = "h-6 w-6" }) => {
  if (language === "python") {
    return <FaPython className={`${className} text-[#3776ab]`} aria-hidden="true" />;
  }

  if (language === "java") {
    return <FaJava className={`${className} text-[#e76f00]`} aria-hidden="true" />;
  }

  return <FaJs className={`${className} text-[#f7df1e]`} aria-hidden="true" />;
};

export default LanguageBrandIcon;
