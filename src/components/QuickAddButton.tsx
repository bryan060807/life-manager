import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function QuickAddButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="fixed bottom-8 right-8 neon-button rounded-full w-14 h-14 flex items-center justify-center z-50"
      animate={{ scale: hovered ? 1.1 : 1 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <Plus size={22} />
    </motion.button>
  );
}
