import { createContext, useContext, useState, ReactNode } from "react";

interface DevLabelContextType {
  subLabel: string;
  setSubLabel: (label: string) => void;
}

const DevLabelContext = createContext<DevLabelContextType | undefined>(undefined);

export const DevLabelProvider = ({ children }: { children: ReactNode }) => {
  const [subLabel, setSubLabel] = useState("");
  return (
    <DevLabelContext.Provider value={{ subLabel, setSubLabel }}>
      {children}
    </DevLabelContext.Provider>
  );
};

export const useDevLabel = () => {
  const context = useContext(DevLabelContext);
  if (!context) {
    throw new Error("useDevLabel must be used within a DevLabelProvider");
  }
  return context;
};
